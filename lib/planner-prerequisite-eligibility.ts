import type { Course } from '@/types/courses';

/** Semester ordering within an academic year: א < ב < (קיץ / קיץ מקוצר). */
export function semesterRank(semester: Course['semester']): number {
	if (semester === 'A') return 0;
	if (semester === 'B') return 1;
	return 2;
}

/**
 * Earliest semester (minimum rank) in which a course name appears in the catalog.
 * Used to decide if a prerequisite could have been taken before `targetSemester`
 * when the student has no transcript.
 */
export function minSemesterRankAmongOfferings(
	courseName: string,
	allCourses: Course[],
): number | undefined {
	const matches = allCourses.filter((c) => c.courseName === courseName);
	if (matches.length === 0) return undefined;
	return Math.min(...matches.map((c) => semesterRank(c.semester)));
}

export interface PrerequisiteEligibilityOptions {
	/**
	 * Course names the student is assumed to have already passed (no transcript UI yet).
	 */
	completedCourseNames?: ReadonlySet<string>;
	/**
	 * If a prerequisite name is not found in `allCourses`, treat as satisfied (default true).
	 * Set false to block until the catalog lists that course.
	 */
	treatMissingPrerequisiteAsEligible?: boolean;
}

/**
 * Without a transcript: a course in `targetSemester` is allowed only if every prerequisite
 * either appears in `completedCourseNames`, or is offered **strictly earlier** in the year
 * than `targetSemester` (so we can assume it was taken in a previous term).
 *
 * Semester A (first in year): only courses with no prereqs, completed prereqs, or prereqs not in catalog
 * (when `treatMissingPrerequisiteAsEligible`).
 */
export function isCourseEligibleForSemester(
	course: Course,
	targetSemester: Course['semester'],
	allCourses: Course[],
	options: PrerequisiteEligibilityOptions = {},
): boolean {
	const prereqs = course.prerequisiteNames ?? [];
	const completed = options.completedCourseNames ?? new Set<string>();
	const treatMissing = options.treatMissingPrerequisiteAsEligible !== false;
	const targetR = semesterRank(targetSemester);

	for (const p of prereqs) {
		if (completed.has(p)) continue;

		const minR = minSemesterRankAmongOfferings(p, allCourses);
		if (minR === undefined) {
			if (!treatMissing) return false;
			continue;
		}
		if (minR >= targetR) return false;
	}
	return true;
}

export function filterCoursesEligibleForSemester(
	coursesInTargetSemester: Course[],
	targetSemester: Course['semester'],
	allCourses: Course[],
	options?: PrerequisiteEligibilityOptions,
): Course[] {
	return coursesInTargetSemester.filter((c) =>
		isCourseEligibleForSemester(c, targetSemester, allCourses, options),
	);
}
