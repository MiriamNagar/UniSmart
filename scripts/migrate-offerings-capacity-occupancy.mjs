/**
 * Migrate `bgu_cs_offerings` documents to use `capacity` + `occupancy` only.
 *
 * - Does **not** delete or modify `bgu_cs_courses` or `bgu_cs_prerequisite_edges`.
 * - Does **not** wipe collections; only **updates** existing offering rows.
 * - For each offering that already has numeric `capacity` **and** `occupancy`, does nothing.
 * - Otherwise, if `places` is a finite number, sets:
 *     capacity = max(0, floor(places))
 *     occupancy = 0
 *   so remaining seats stay `capacity - occupancy === places` (legacy `places` meant "remaining").
 *   Then removes the `places` field so the document uses the new pair only.
 *
 * Setup (same as seed-firestore-3nf.mjs):
 *   PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\service-account.json"
 *   Run:         node scripts/migrate-offerings-capacity-occupancy.mjs
 *   Dry run:     node scripts/migrate-offerings-capacity-occupancy.mjs --dry-run
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadAdmin() {
	try {
		return import('firebase-admin');
	} catch {
		console.error('Missing dependency: npm install firebase-admin --save-dev\n');
		process.exit(1);
	}
}

function hasCapacityOccupancy(data) {
	return (
		typeof data.capacity === 'number' &&
		!Number.isNaN(data.capacity) &&
		typeof data.occupancy === 'number' &&
		!Number.isNaN(data.occupancy)
	);
}

function legacyPlaces(data) {
	if (typeof data.places !== 'number' || Number.isNaN(data.places)) {
		return null;
	}
	return Math.max(0, Math.floor(data.places));
}

async function main() {
	const argv = process.argv.slice(2);
	const dryRun = argv.includes('--dry-run') || argv.includes('-n');

	if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		console.error(
			'Missing GOOGLE_APPLICATION_CREDENTIALS.\n' +
				'  PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\service-account.json"\n',
		);
		process.exit(1);
	}

	const { default: admin } = await loadAdmin();
	if (!admin.apps.length) {
		admin.initializeApp();
	}
	const db = admin.firestore();
	const FieldValue = admin.firestore.FieldValue;

	const col = db.collection('bgu_cs_offerings');
	const snap = await col.get();

	let skippedAlready = 0;
	let skippedNoPlaces = 0;
	let updated = 0;
	let batch = db.batch();
	let ops = 0;
	const MAX_BATCH = 400;

	async function commitBatch() {
		if (ops === 0) return;
		if (!dryRun) {
			await batch.commit();
		}
		batch = db.batch();
		ops = 0;
	}

	for (const doc of snap.docs) {
		const data = doc.data() ?? {};

		if (hasCapacityOccupancy(data)) {
			skippedAlready += 1;
			continue;
		}

		const places = legacyPlaces(data);
		if (places === null) {
			skippedNoPlaces += 1;
			continue;
		}

		const ref = doc.ref;
		const payload = {
			capacity: places,
			occupancy: 0,
			places: FieldValue.delete(),
		};

		if (dryRun) {
			console.log(
				`[dry-run] ${doc.id}: places→capacity=${places}, occupancy=0, delete places`,
			);
		} else {
			batch.update(ref, payload);
			ops += 1;
			if (ops >= MAX_BATCH) {
				await commitBatch();
			}
		}
		updated += 1;
	}

	await commitBatch();

	console.log(
		JSON.stringify(
			{
				dryRun,
				totalOfferingDocs: snap.size,
				updated,
				skippedAlreadyHadCapacityOccupancy: skippedAlready,
				skippedNoNumericPlaces: skippedNoPlaces,
			},
			null,
			2,
		),
	);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
