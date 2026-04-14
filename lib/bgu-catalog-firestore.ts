import {
	collection,
	getDocs,
	query,
	where,
	type Firestore,
} from 'firebase/firestore';

import type {
	BguCatalogCourse,
	BguCatalogJson,
	BguOfferingRow,
} from '@/lib/bgu-catalog-to-courses';

/** Matches `program` in `mockData/bgu-cs-catalog.json` and seed script `seed-firestore-3nf.mjs`. */
export const DEFAULT_BGU_PROGRAM_KEY = 'bgu_computer_science';

interface CourseDoc {
	programKey?: string;
	displayName?: string;
	shortDescription?: string;
	short_description?: string;
	description?: string;
	summary?: string;
}

interface OfferingDoc {
	programKey?: string;
	courseId?: string;
	orderIndex?: number;
	sessionType?: string;
	lecturer?: string;
	/** Alternate field names seen in manual Firestore edits or other importers */
	instructor?: string;
	teacher?: string;
	lecturerName?: string;
	language?: string | null;
	semesterHebrew?: string;
	yearHebrew?: string;
	timeText?: string;
	credits?: number;
	weeklyHours?: number;
	places?: number;
}

interface EdgeDoc {
	programKey?: string;
	courseId?: string;
	prerequisiteCourseId?: string;
}

function matchesProgram(d: { programKey?: string } | undefined, programKey: string): boolean {
	if (!d) return false;
	return !d.programKey || d.programKey === programKey;
}

/** Exported for unit tests; merges common Firestore field variants into one display string. */
export function mergeOfferingLecturerFields(row: OfferingDoc): string {
	const candidates: unknown[] = [
		row.lecturer,
		row.instructor,
		row.teacher,
		row.lecturerName,
	];
	for (const c of candidates) {
		if (c == null) continue;
		if (typeof c === 'string') {
			const t = c.trim();
			if (t) return t;
			continue;
		}
		const s = String(c).trim();
		if (s) return s;
	}
	return '';
}

/** Exported for unit tests; merges common short-description variants into one trimmed string. */
export function mergeCourseDescriptionFields(row: CourseDoc): string | undefined {
	const candidates: unknown[] = [
		row.shortDescription,
		row.short_description,
		row.summary,
		row.description,
	];
	for (const c of candidates) {
		if (typeof c !== 'string') continue;
		const t = c.trim();
		if (t) return t;
	}
	return undefined;
}

/**
 * Loads catalog docs and rebuilds the same shape as `mockData/bgu-cs-catalog.json`
 * so {@link bguCatalogToCourses} can run unchanged.
 */
export async function fetchBguCatalogJsonFromFirestore(
	firestore: Firestore,
	options: { programKey?: string } = {},
): Promise<BguCatalogJson> {
	const programKey = options.programKey ?? DEFAULT_BGU_PROGRAM_KEY;

	let coursesSnap = await getDocs(
		query(collection(firestore, 'bgu_cs_courses'), where('programKey', '==', programKey)),
	);
	if (coursesSnap.empty) {
		coursesSnap = await getDocs(collection(firestore, 'bgu_cs_courses'));
	}

	let offeringsSnap = await getDocs(
		query(collection(firestore, 'bgu_cs_offerings'), where('programKey', '==', programKey)),
	);
	if (offeringsSnap.empty) {
		offeringsSnap = await getDocs(collection(firestore, 'bgu_cs_offerings'));
	}

	let edgesSnap = await getDocs(
		query(collection(firestore, 'bgu_cs_prerequisite_edges'), where('programKey', '==', programKey)),
	);
	if (edgesSnap.empty) {
		edgesSnap = await getDocs(collection(firestore, 'bgu_cs_prerequisite_edges'));
	}

	const idToName = new Map<string, string>();
	const courses: Record<string, BguCatalogCourse> = {};

	coursesSnap.forEach((docSnap) => {
		const d = docSnap.data() as CourseDoc;
		if (!matchesProgram(d, programKey)) return;
		const name = d.displayName?.trim();
		if (!name) return;
		idToName.set(docSnap.id, name);
		courses[name] = {
			name,
			shortDescription: mergeCourseDescriptionFields(d),
			offerings: [],
			prerequisites: [],
		};
	});

	const byCourseId = new Map<string, OfferingDoc[]>();
	offeringsSnap.forEach((docSnap) => {
		const d = docSnap.data() as OfferingDoc;
		if (!matchesProgram(d, programKey)) return;
		const cid = d.courseId;
		if (!cid) return;
		const list = byCourseId.get(cid) ?? [];
		list.push(d);
		byCourseId.set(cid, list);
	});

	for (const [courseId, rows] of byCourseId) {
		const displayName = idToName.get(courseId);
		if (!displayName || !courses[displayName]) continue;
		rows.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
		courses[displayName].offerings = rows.map(
			(row): BguOfferingRow => ({
				type: row.sessionType ?? '',
				lecturer: mergeOfferingLecturerFields(row),
				language: row.language ?? undefined,
				semester: row.semesterHebrew ?? '',
				year: row.yearHebrew ?? '',
				time: row.timeText ?? '',
				credits: row.credits ?? 0,
				weekly_hours: row.weeklyHours ?? 0,
				places: row.places ?? 0,
			}),
		);
	}

	edgesSnap.forEach((docSnap) => {
		const d = docSnap.data() as EdgeDoc;
		if (!matchesProgram(d, programKey)) return;
		const cid = d.courseId;
		const prereqId = d.prerequisiteCourseId;
		if (!cid || !prereqId) return;
		const name = idToName.get(cid);
		const prereqName = idToName.get(prereqId);
		if (!name || !prereqName || !courses[name]) return;
		const list = courses[name].prerequisites;
		if (!list.includes(prereqName)) {
			list.push(prereqName);
		}
	});

	return {
		schemaVersion: 1,
		program: programKey,
		courses,
	};
}
