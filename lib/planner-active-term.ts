import type { Course } from '@/types/courses';

/** Three-year CS track; maps to Hebrew degree-year letters in the BGU catalog JSON. */
export const DEGREE_YEAR_PLANNER_OPTIONS = [
	{ tier: '1', label: 'Year 1', catalogLetter: 'א' },
	{ tier: '2', label: 'Year 2', catalogLetter: 'ב' },
	{ tier: '3', label: 'Year 3', catalogLetter: 'ג' },
] as const;

export type DegreeYearTier = (typeof DEGREE_YEAR_PLANNER_OPTIONS)[number]['tier'];

const TIER_TO_LETTER: Record<DegreeYearTier, string> = {
	'1': 'א',
	'2': 'ב',
	'3': 'ג',
};

export function catalogLetterForDegreeTier(tier: string): string {
	const letter = TIER_TO_LETTER[tier as DegreeYearTier];
	return letter ?? 'א';
}

/**
 * Courses visible for the active planner term: semester (A/B/summer) plus catalog degree year letter.
 * Rows without a usable `degreeCatalogYear` (missing, empty, or whitespace) are included as legacy/mock.
 */
export function filterCoursesForPlannerTerm(
	courses: Course[],
	semesterKey: Course['semester'],
	catalogDegreeYearLetter: string,
): Course[] {
	return courses.filter((c) => {
		if (c.semester !== semesterKey) return false;
		const y = c.degreeCatalogYear?.trim();
		if (!y) return true;
		return y === catalogDegreeYearLetter;
	});
}
