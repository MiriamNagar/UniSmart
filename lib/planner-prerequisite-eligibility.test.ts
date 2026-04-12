import type { Course } from '@/types/courses';
import {
	filterCoursesEligibleForSemester,
	isCourseEligibleForSemester,
	minSemesterRankAmongOfferings,
	semesterRank,
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

describe('minSemesterRankAmongOfferings', () => {
	it('returns minimum rank', () => {
		const all = [
			mk({ courseID: '1', courseName: 'Foo', semester: 'B' }),
			mk({ courseID: '2', courseName: 'Foo', semester: 'A' }),
		];
		expect(minSemesterRankAmongOfferings('Foo', all)).toBe(0);
	});
});
