import type { Course } from '@/types/courses';
import {
	filterCoursesEligibleForSemester,
	isCourseEligibleForSemester,
	minSemesterRankAmongOfferings,
	prerequisiteScheduleDisclosure,
	semesterRank,
	virtualCompletedCourseNamesForDegreeTier,
} from './planner-prerequisite-eligibility';

const mk = (partial: Partial<Course> & Pick<Course, 'courseID' | 'courseName' | 'semester'>): Course => ({
	credits: 3,
	isMandatory: false,
	availableSections: [],
	prerequisiteNames: [],
	...partial,
});

describe('semesterRank', () => {
	it('orders A < B < summer', () => {
		expect(semesterRank('A')).toBeLessThan(semesterRank('B'));
		expect(semesterRank('B')).toBeLessThan(semesterRank('summer'));
	});
});

describe('isCourseEligibleForSemester', () => {
	const all: Course[] = [
		mk({ courseID: 'a1', courseName: 'מבוא לחישוב', semester: 'A' }),
		mk({ courseID: 'a2', courseName: 'מבנה נתונים', semester: 'B', prerequisiteNames: ['מבוא לחישוב'] }),
		mk({
			courseID: 'a3',
			courseName: 'אלגוריתמים 1',
			semester: 'B',
			prerequisiteNames: ['מבנה נתונים'],
		}),
	];

	it('allows semester B when prereq only exists in A', () => {
		const data = all[1];
		expect(
			isCourseEligibleForSemester(data, 'B', all, { completedCourseNames: new Set() }),
		).toBe(true);
	});

	it('blocks semester A when prereq exists same semester or later only', () => {
		const algo = all[2];
		expect(
			isCourseEligibleForSemester(algo, 'B', all, { completedCourseNames: new Set() }),
		).toBe(false);
	});

	it('allows when prereq completed', () => {
		const algo = all[2];
		expect(
			isCourseEligibleForSemester(algo, 'B', all, {
				completedCourseNames: new Set(['מבנה נתונים']),
			}),
		).toBe(true);
	});

	it('first semester: only no / external prereqs', () => {
		const intro = all[0];
		expect(
			isCourseEligibleForSemester(intro, 'A', all, { completedCourseNames: new Set() }),
		).toBe(true);
	});
});

describe('filterCoursesEligibleForSemester', () => {
	it('drops courses whose prereq is only offered in the same semester or later', () => {
		const inB = [
			mk({ courseID: 'x', courseName: 'NoPrereq', semester: 'B', prerequisiteNames: [] }),
			mk({
				courseID: 'y',
				courseName: 'NeedSameSem',
				semester: 'B',
				prerequisiteNames: ['SameSem'],
			}),
		];
		const allCourses = [...inB, mk({ courseID: 's', courseName: 'SameSem', semester: 'B' })];
		const out = filterCoursesEligibleForSemester(inB, 'B', allCourses, {
			completedCourseNames: new Set(),
		});
		expect(out.map((c) => c.courseID)).toEqual(['x']);
	});
});

describe('virtualCompletedCourseNamesForDegreeTier', () => {
	it('is empty for year 1', () => {
		const all = [
			mk({ courseID: '1', courseName: 'Intro', semester: 'A', degreeCatalogYear: 'א' }),
		];
		expect(virtualCompletedCourseNamesForDegreeTier(all, '1').size).toBe(0);
	});

	it('includes all year-א names when planning year 2', () => {
		const all = [
			mk({ courseID: '1', courseName: 'Intro', semester: 'A', degreeCatalogYear: 'א' }),
			mk({ courseID: '2', courseName: 'Algo', semester: 'A', degreeCatalogYear: 'ב' }),
		];
		const s = virtualCompletedCourseNamesForDegreeTier(all, '2');
		expect(s.has('Intro')).toBe(true);
		expect(s.has('Algo')).toBe(false);
	});
});

describe('minSemesterRankAmongOfferings', () => {
	it('returns minimum rank', () => {
		const all = [
			mk({ courseID: '1', courseName: 'Foo', semester: 'B' }),
			mk({ courseID: '2', courseName: 'Foo', semester: 'A' }),
		];
		expect(minSemesterRankAmongOfferings('Foo', all)).toBe(0);
	});
});

describe('prerequisiteScheduleDisclosure', () => {
	it('returns no names and no advisory when course has no prerequisites', () => {
		const c = mk({ courseID: 'x', courseName: 'Solo', semester: 'B' });
		const r = prerequisiteScheduleDisclosure(c, 'B', [c], {});
		expect(r.names).toEqual([]);
		expect(r.advisoryNote).toBeNull();
		expect(r.eligibleForTerm).toBe(true);
	});

	it('lists names and advisory when catalog order suggests unmet prerequisites', () => {
		const all: Course[] = [
			mk({ courseID: 'a1', courseName: 'מבוא לחישוב', semester: 'A' }),
			mk({ courseID: 'a2', courseName: 'מבנה נתונים', semester: 'B', prerequisiteNames: ['מבוא לחישוב'] }),
			mk({
				courseID: 'a3',
				courseName: 'אלגוריתמים 1',
				semester: 'B',
				prerequisiteNames: ['מבנה נתונים'],
			}),
		];
		const algo = all[2];
		const r = prerequisiteScheduleDisclosure(algo, 'B', all, {
			completedCourseNames: new Set(),
		});
		expect(r.names).toEqual(['מבנה נתונים']);
		expect(r.eligibleForTerm).toBe(false);
		expect(r.advisoryNote).toContain('Confirm with your department');
	});

	it('no advisory when prerequisites appear satisfied for the term', () => {
		const all: Course[] = [
			mk({ courseID: 'a1', courseName: 'מבוא לחישוב', semester: 'A' }),
			mk({ courseID: 'a2', courseName: 'מבנה נתונים', semester: 'B', prerequisiteNames: ['מבוא לחישוב'] }),
		];
		const data = all[1];
		const r = prerequisiteScheduleDisclosure(data, 'B', all, {
			completedCourseNames: new Set(),
		});
		expect(r.names).toEqual(['מבוא לחישוב']);
		expect(r.eligibleForTerm).toBe(true);
		expect(r.advisoryNote).toBeNull();
	});

	it('advisory when prerequisite strings are only whitespace', () => {
		const c = mk({
			courseID: 'x',
			courseName: 'Weird',
			semester: 'B',
			prerequisiteNames: ['   ', '\t'],
		});
		const r = prerequisiteScheduleDisclosure(c, 'B', [c], {});
		expect(r.names).toEqual([]);
		expect(r.advisoryNote).toContain('could not be read');
	});

	it('deduplicates prerequisite names', () => {
		const c = mk({
			courseID: 'x',
			courseName: 'Dup',
			semester: 'B',
			prerequisiteNames: ['מבוא', 'מבוא', ' מבוא '],
		});
		const r = prerequisiteScheduleDisclosure(c, 'B', [c], {});
		expect(r.names).toEqual(['מבוא']);
	});
});
