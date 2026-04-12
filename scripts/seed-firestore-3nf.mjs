/**
 * Upload BGU catalog to Firestore in a 3NF-style layout (relational facts, no repeating groups).
 *
 * Collections (same project; namespaced for this program):
 *   bgu_cs_courses/{courseId}           — one doc per course (display name lives here once).
 *   bgu_cs_offerings/{offeringId}       — one doc per schedule row (FK: courseId).
 *   bgu_cs_prerequisite_edges/{edgeId}  — one doc per (course → prerequisite) pair (two FKs).
 *
 * Prerequisites reference courses by courseId; resolve names via bgu_cs_courses.displayName
 * or query where displayName == ...
 *
 * Setup:
 *   1. Firebase Console → Project settings → Service accounts → Generate new private key (JSON).
 *   2. Save outside the repo (e.g. ../secrets/bgu-firebase-adminsdk.json) — never commit.
 *   3. Point Node at the key file (same shell session as `node`):
 *      PowerShell:  $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\that.json"
 *      cmd.exe:     set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\that.json
 *      bash/zsh:    export GOOGLE_APPLICATION_CREDENTIALS=/path/to/that.json
 *   4. Enable Firestore (Native mode) in the same Firebase project as the app.
 *   5. Run:  node scripts/seed-firestore-3nf.mjs
 *      Full replace:  node scripts/seed-firestore-3nf.mjs --wipe
 *      (deletes all docs in bgu_cs_courses, bgu_cs_offerings, bgu_cs_prerequisite_edges, then seeds)
 *
 * Optional: FIRESTORE_CATALOG_PATH=mockData/bgu-cs-catalog.json
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

function loadAdmin() {
	try {
		return import('firebase-admin');
	} catch {
		console.error(
			'Missing dependency: npm install firebase-admin --save-dev\n',
		);
		process.exit(1);
	}
}

/** Stable ID from UTF-8 course name (same name → same id across runs). */
function stableCourseId(displayName) {
	return 'c_' + createHash('sha256').update(displayName, 'utf8').digest('hex').slice(0, 24);
}

function stableEdgeId(courseId, prerequisiteCourseId) {
	return (
		'p_' +
		createHash('sha256')
			.update(`${courseId}|${prerequisiteCourseId}`, 'utf8')
			.digest('hex')
			.slice(0, 28)
	);
}

function stableOfferingId(courseId, offeringIndex) {
	return `o_${courseId}_${offeringIndex}`;
}

/** Delete documents in chunks (Firestore batch max 500 ops). */
async function wipeCollection(db, collectionId) {
	const col = db.collection(collectionId);
	let total = 0;
	for (;;) {
		const snap = await col.limit(500).get();
		if (snap.empty) break;
		const b = db.batch();
		for (const d of snap.docs) {
			b.delete(d.ref);
		}
		await b.commit();
		total += snap.size;
		if (snap.size < 500) break;
	}
	return total;
}

async function main() {
	const argv = process.argv.slice(2);
	const wipe = argv.includes('--wipe') || argv.includes('-w');
	if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		console.error(
			'Missing GOOGLE_APPLICATION_CREDENTIALS.\n' +
				'  PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\service-account.json"\n' +
				'  cmd.exe:    set GOOGLE_APPLICATION_CREDENTIALS=C:\\path\\to\\service-account.json\n',
		);
		process.exit(1);
	}

	const catalogPath = process.env.FIRESTORE_CATALOG_PATH || join(root, 'mockData/bgu-cs-catalog.json');
	const raw = JSON.parse(readFileSync(catalogPath, 'utf8'));
	const programKey = raw.program || 'bgu_computer_science';
	const courses = raw.courses || {};

	const { default: admin } = await loadAdmin();
	if (!admin.apps.length) {
		admin.initializeApp();
	}
	const db = admin.firestore();

	if (wipe) {
		console.log('Wiping bgu_cs_* collections…');
		for (const id of [
			'bgu_cs_prerequisite_edges',
			'bgu_cs_offerings',
			'bgu_cs_courses',
		]) {
			const n = await wipeCollection(db, id);
			console.log(`  ${id}: removed ${n} doc(s)`);
		}
	}

	const colCourses = db.collection('bgu_cs_courses');
	const colOfferings = db.collection('bgu_cs_offerings');
	const colEdges = db.collection('bgu_cs_prerequisite_edges');

	const nameToId = new Map();
	for (const displayName of Object.keys(courses)) {
		nameToId.set(displayName, stableCourseId(displayName));
	}

	let batch = db.batch();
	let ops = 0;
	const MAX_BATCH = 400;

	function commitBatch() {
		if (ops === 0) return Promise.resolve();
		const p = batch.commit();
		batch = db.batch();
		ops = 0;
		return p;
	}

	function setDoc(ref, data) {
		batch.set(ref, data, { merge: false });
		ops += 1;
		if (ops >= MAX_BATCH) {
			return commitBatch().then(() => {});
		}
		return Promise.resolve();
	}

	console.log('Writing courses…');
	for (const [displayName, c] of Object.entries(courses)) {
		const courseId = nameToId.get(displayName);
		const ref = colCourses.doc(courseId);
		await setDoc(ref, {
			programKey,
			schemaVersion: raw.schemaVersion ?? 1,
			displayName: c.name || displayName,
			createdBySeed: true,
		});
	}

	console.log('Writing offerings…');
	for (const [displayName, c] of Object.entries(courses)) {
		const courseId = nameToId.get(displayName);
		const list = c.offerings || [];
		for (let i = 0; i < list.length; i++) {
			const row = list[i];
			const oid = stableOfferingId(courseId, i);
			const ref = colOfferings.doc(oid);
			await setDoc(ref, {
				programKey,
				courseId,
				orderIndex: i,
				sessionType: row.type,
				lecturer: row.lecturer,
				language: row.language ?? null,
				semesterHebrew: row.semester,
				yearHebrew: row.year,
				timeText: row.time,
				credits: row.credits,
				weeklyHours: row.weekly_hours,
				places: row.places,
			});
		}
	}

	console.log('Writing prerequisite edges…');
	for (const [displayName, c] of Object.entries(courses)) {
		const courseId = nameToId.get(displayName);
		const prereqs = c.prerequisites || [];
		for (const prereqName of prereqs) {
			const prereqId = nameToId.get(prereqName);
			if (!prereqId) {
				console.warn(
					`Skip edge: prerequisite "${prereqName}" has no course row — add it to catalog first.`,
				);
				continue;
			}
			const eid = stableEdgeId(courseId, prereqId);
			const ref = colEdges.doc(eid);
			await setDoc(ref, {
				programKey,
				courseId,
				prerequisiteCourseId: prereqId,
			});
		}
	}

	await commitBatch();
	console.log('Done. Collections: bgu_cs_courses, bgu_cs_offerings, bgu_cs_prerequisite_edges');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
