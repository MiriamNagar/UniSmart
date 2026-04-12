/**
 * Builds mockData/bgu-cs-catalog.json from:
 *   - scripts/data/courses.json  (map: courseDisplayName -> offerings[])
 *   - scripts/data/legacy-catalog-merge.json  (optional: courses missing from export)
 *   - scripts/data/blocking-prereqs-raw.txt  (lines: "course - prereq1, prereq2")
 *
 * Normalizes duplicate course names (e.g. מבני נתונים -> מבנה נתונים, ליניארית -> לינארית).
 *
 * Usage:
 *   node scripts/build-bgu-catalog.mjs
 * Optional:
 *   set COURSES_JSON=path\to\courses.json
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const COURSES_PATH = process.env.COURSES_JSON || join(root, 'scripts', 'data', 'courses.json');
const LEGACY_MERGE_PATH = join(root, 'scripts', 'data', 'legacy-catalog-merge.json');
const BLOCKING_PATH = join(root, 'scripts', 'data', 'blocking-prereqs-raw.txt');
const OUT_PATH = join(root, 'mockData', 'bgu-cs-catalog.json');

/** Short / variant → canonical key used in courses.json */
const DISPLAY_ALIASES = {
	'חשבון אינפיניטסימלי 1': 'חשבון אינפיניטסימלי 1 למדעי המחשב',
	'חשבון אינפיניטסימלי 2': 'חשבון אינפיניטסימלי 2 למדעי המחשב',
	'אלגברה לינארית 1': 'אלגברה לינארית 1 למדעי המחשב',
	'אלגברה לינארית 2': 'אלגברה לינארית 2 למדעי המחשב',
	'לוגיקה ותורת הקבוצות': 'לוגיקה ותורת הקבוצות למדעי המחשב',
};

/** Unify near-duplicate display keys (Hebrew variants / typos). */
function normalizeCourseName(name) {
	let s = String(name).trim();
	s = s.replace(/ליניארית/g, 'לינארית');
	if (s === 'מבני נתונים') s = 'מבנה נתונים';
	return s;
}

const VALID_YEAR = new Set(['א', 'ב', 'ג', 'ד']);

function normalizeOfferingRow(row) {
	const o = { ...row };
	let y = String(o.year ?? '').trim();
	if (!VALID_YEAR.has(y)) {
		if (y === 'שנה' || y === 'ר') {
			o.year = 'ב';
		} else {
			o.year = 'א';
		}
	}
	return o;
}

function resolveToKnownKey(name, known) {
	let n = normalizeCourseName(name);
	if (known.has(n)) return n;
	if (DISPLAY_ALIASES[n] && known.has(DISPLAY_ALIASES[n])) return DISPLAY_ALIASES[n];
	const suffixed = `${n} למדעי המחשב`;
	if (known.has(suffixed)) return suffixed;
	return n;
}

function loadBlockingRules(path, known) {
	const raw = readFileSync(path, 'utf8');
	const rules = new Map();
	for (const line of raw.split(/\r?\n/)) {
		const t = line.trim();
		if (!t || t.startsWith('#')) continue;
		const dash = t.indexOf(' - ');
		if (dash < 1) continue;
		const rawCourse = t.slice(0, dash).trim();
		const rest = t.slice(dash + 3).trim();
		const course = resolveToKnownKey(rawCourse, known);
		const prereqs = rest
			.split(',')
			.map((s) => resolveToKnownKey(s.trim(), known))
			.filter(Boolean);
		rules.set(course, prereqs);
	}
	return rules;
}

function main() {
	const flat = JSON.parse(readFileSync(COURSES_PATH, 'utf8'));

	/** displayName -> { name, offerings } */
	const merged = new Map();

	for (const [key, offerings] of Object.entries(flat)) {
		const canon = normalizeCourseName(key);
		const normalizedOfferings = (offerings || []).map(normalizeOfferingRow);
		if (!merged.has(canon)) {
			merged.set(canon, { name: canon, offerings: [] });
		}
		merged.get(canon).offerings.push(...normalizedOfferings);
	}

	if (existsSync(LEGACY_MERGE_PATH)) {
		const legacy = JSON.parse(readFileSync(LEGACY_MERGE_PATH, 'utf8'));
		for (const [key, c] of Object.entries(legacy.courses || {})) {
			const canon = normalizeCourseName(key);
			if (merged.has(canon)) continue;
			merged.set(canon, {
				name: canon,
				offerings: (c.offerings || []).map(normalizeOfferingRow),
			});
		}
	}

	const known = new Set(merged.keys());
	const blocking = loadBlockingRules(BLOCKING_PATH, known);

	const courses = {};
	for (const [displayName, data] of merged) {
		const prereqs = blocking.get(displayName) ?? [];
		courses[displayName] = {
			name: displayName,
			offerings: data.offerings,
			prerequisites: [...prereqs],
		};
	}

	for (const [course, plist] of blocking) {
		if (!courses[course]) {
			console.warn(`[build-bgu-catalog] Rule for unknown course: "${course}"`);
		}
		for (const p of plist) {
			if (!courses[p]) {
				console.warn(`[build-bgu-catalog] Unknown prerequisite "${p}" for "${course}"`);
			}
		}
	}

	const out = {
		schemaVersion: 1,
		program: 'bgu_computer_science',
		courses,
	};

	writeFileSync(OUT_PATH, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
	console.log(`Wrote ${OUT_PATH} (${Object.keys(courses).length} courses).`);
}

main();
