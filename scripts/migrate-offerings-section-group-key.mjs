/**
 * Backfill `sectionGroupKey` in `bgu_cs_offerings`.
 *
 * Why:
 * - Planner section assembly can now use an explicit coupling key
 *   (lecture + one/more exercises/labs in the same group).
 * - Existing Firestore data has no `sectionGroupKey`, so this script adds it.
 *
 * Heuristic (deterministic, data-safe):
 * - Partition rows by (courseId, semesterHebrew, yearHebrew)
 * - Within each partition, split by "track" token from sessionType parentheses
 *   (e.g. "מצטיינים" in "תרגיל (מצטיינים)")
 * - For each track:
 *   - If lectures exist: tutorials/labs are assigned round-robin to lecture groups
 *     so a lecture may get multiple exercises (supports your requested shape).
 *   - If no lectures exist: each non-lecture row gets its own group.
 * - Rows with other sessionType values get their own groups.
 *
 * Safety:
 * - Default updates only rows with missing/blank sectionGroupKey.
 * - Use --overwrite to recompute/update all rows.
 * - Use --dry-run to preview only.
 *
 * Usage:
 *   node scripts/migrate-offerings-section-group-key.mjs --dry-run
 *   node scripts/migrate-offerings-section-group-key.mjs
 *   node scripts/migrate-offerings-section-group-key.mjs --overwrite
 */

function loadAdmin() {
	try {
		return import('firebase-admin');
	} catch {
		console.error('Missing dependency: npm install firebase-admin --save-dev\n');
		process.exit(1);
	}
}

function normalizeSessionType(value) {
	return String(value ?? '').trim();
}

function extractTrackKey(sessionType) {
	// Example: "תרגיל (מצטיינים)" -> "מצטיינים"
	const match = /\(([^)]+)\)/.exec(sessionType);
	if (!match) return 'default';
	const key = String(match[1] ?? '').trim();
	if (!key) return 'default';

	// Known Hebrew labels → stable English token
	if (key === 'מצטיינים') return 'HONORS';

	// Generic ASCII-safe tokenization (keeps determinism for unknown labels)
	const ascii = key
		.toUpperCase()
		.replace(/[^A-Z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
	return ascii || 'OTHER';
}

function sessionKind(sessionType) {
	const t = normalizeSessionType(sessionType);
	if (t.includes('שיעור')) return 'lecture';
	if (t.includes('תרגיל')) return 'tutorial';
	if (t.includes('מעבדה')) return 'lab';
	return 'other';
}

function timeSortKey(data) {
	const orderIndex =
		typeof data.orderIndex === 'number' && !Number.isNaN(data.orderIndex)
			? data.orderIndex
			: Number.MAX_SAFE_INTEGER;
	return orderIndex;
}

function partitionKey(data) {
	const semesterRaw = String(data.semesterHebrew ?? '').trim();
	const yearRaw = String(data.yearHebrew ?? '').trim();
	const semesterNoMarks = semesterRaw.normalize('NFKD').replace(/[\u0591-\u05C7]/g, '');
	const yearNoMarks = yearRaw.normalize('NFKD').replace(/[\u0591-\u05C7]/g, '');

	const semesterToken =
		semesterNoMarks.startsWith('א')
			? 'A'
			: semesterNoMarks.startsWith('ב')
				? 'B'
				: semesterNoMarks.startsWith('ק') || semesterRaw.toLowerCase() === 'summer'
					? 'SUMMER'
					: semesterNoMarks.startsWith('ש')
						? 'YEARLY'
					: semesterRaw || 'UNKNOWN_SEM';

	const yearToken =
		yearNoMarks.startsWith('א')
			? 'Y1'
			: yearNoMarks.startsWith('ב')
				? 'Y2'
				: yearNoMarks.startsWith('ג')
					? 'Y3'
					: yearNoMarks.startsWith('ד')
						? 'Y4'
						: yearRaw || 'UNKNOWN_YEAR';

	return [
		String(data.courseId ?? ''),
		semesterToken,
		yearToken,
	].join('|');
}

function buildSectionGroupAssignments(docs) {
	// docs: [{ id, data }]
	const byPartition = new Map();
	for (const doc of docs) {
		const pKey = partitionKey(doc.data);
		const list = byPartition.get(pKey) ?? [];
		list.push(doc);
		byPartition.set(pKey, list);
	}

	const assignments = new Map(); // docId -> sectionGroupKey

	for (const [pKey, rows] of byPartition) {
		const byTrack = new Map();
		for (const row of rows) {
			const sType = normalizeSessionType(row.data.sessionType);
			const tKey = extractTrackKey(sType);
			const list = byTrack.get(tKey) ?? [];
			list.push(row);
			byTrack.set(tKey, list);
		}

		for (const [trackKey, trackRows] of byTrack) {
			const lectures = [];
			const practicals = []; // tutorials + labs
			const others = [];

			for (const row of trackRows) {
				const kind = sessionKind(row.data.sessionType);
				if (kind === 'lecture') lectures.push(row);
				else if (kind === 'tutorial' || kind === 'lab') practicals.push(row);
				else others.push(row);
			}

			lectures.sort((a, b) => timeSortKey(a.data) - timeSortKey(b.data));
			practicals.sort((a, b) => timeSortKey(a.data) - timeSortKey(b.data));
			others.sort((a, b) => timeSortKey(a.data) - timeSortKey(b.data));

			const base = `${pKey}|track:${trackKey}`;

			if (lectures.length > 0) {
				// One group per lecture; practicals distributed round-robin.
				for (let i = 0; i < lectures.length; i++) {
					const groupKey = `${base}|g:${i + 1}`;
					assignments.set(lectures[i].id, groupKey);
				}
				for (let i = 0; i < practicals.length; i++) {
					const lectureIdx = i % lectures.length;
					const groupKey = `${base}|g:${lectureIdx + 1}`;
					assignments.set(practicals[i].id, groupKey);
				}
			} else {
				// No lectures in this track; keep rows separated.
				for (let i = 0; i < practicals.length; i++) {
					assignments.set(practicals[i].id, `${base}|p:${i + 1}`);
				}
			}

			for (let i = 0; i < others.length; i++) {
				assignments.set(others[i].id, `${base}|o:${i + 1}`);
			}
		}
	}

	return assignments;
}

async function main() {
	const argv = process.argv.slice(2);
	const dryRun = argv.includes('--dry-run') || argv.includes('-n');
	const overwrite = argv.includes('--overwrite');

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
	const col = db.collection('bgu_cs_offerings');
	const snap = await col.get();

	const docs = snap.docs.map((d) => ({ id: d.id, data: d.data() ?? {} }));
	const assignments = buildSectionGroupAssignments(docs);

	let alreadyHasKey = 0;
	let missingAssignment = 0;
	let toUpdate = 0;

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

	for (const doc of docs) {
		const existing =
			typeof doc.data.sectionGroupKey === 'string'
				? doc.data.sectionGroupKey.trim()
				: '';
		const next = assignments.get(doc.id);
		if (!next) {
			missingAssignment += 1;
			continue;
		}

		if (!overwrite && existing) {
			alreadyHasKey += 1;
			continue;
		}

		if (existing === next) {
			alreadyHasKey += 1;
			continue;
		}

		toUpdate += 1;
		if (dryRun) continue;

		batch.update(col.doc(doc.id), { sectionGroupKey: next });
		ops += 1;
		if (ops >= MAX_BATCH) {
			await commitBatch();
		}
	}

	await commitBatch();

	console.log(
		JSON.stringify(
			{
				dryRun,
				overwrite,
				totalOfferingDocs: docs.length,
				plannedAssignments: assignments.size,
				updated: toUpdate,
				skippedAlreadyHasKey: alreadyHasKey,
				missingAssignment,
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
