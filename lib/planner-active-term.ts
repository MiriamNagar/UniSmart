import type { Course } from '@/types/courses';

/** Hebrew degree-year letters used in the BGU catalog (`mockData/bgu-cs-catalog.json`). */
export const BGU_DEGREE_YEAR_OPTIONS = ['א', 'ב', 'ג', 'ד'] as const;

/**
 * Courses visible for the active planner term: semester (A/B/summer) plus catalog degree year.
 * Rows without a usable `degreeCatalogYear` (missing, empty, or whitespace) are included as legacy/mock.
 */
export function filterCoursesForPlannerTerm(
	courses: Course[],
	semesterKey: Course['semester'],
	degreeYear: string,
): Course[] {
	return courses.filter((c) => {
		if (c.semester !== semesterKey) return false;
		const y = c.degreeCatalogYear?.trim();
		if (!y) return true;
		return y === degreeYear;
	});
}
