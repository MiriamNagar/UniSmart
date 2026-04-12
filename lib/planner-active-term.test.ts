import { filterCoursesForPlannerTerm } from './planner-active-term';
import type { Course } from '@/types/courses';

const base = (partial: Partial<Course> & Pick<Course, 'courseID' | 'courseName' | 'semester'>): Course =>
	({
		isMandatory: false,
		credits: 3,
		availableSections: [],
		...partial,
	}) as Course;

describe('filterCoursesForPlannerTerm', () => {
	it('keeps same semester and degree year', () => {
		const courses = [
			base({ courseID: 'a', courseName: 'A', semester: 'A', degreeCatalogYear: 'א' }),
			base({ courseID: 'b', courseName: 'B', semester: 'A', degreeCatalogYear: 'ב' }),
		];
		const out = filterCoursesForPlannerTerm(courses, 'A', 'א');
		expect(out.map((c) => c.courseID)).toEqual(['a']);
	});

	it('drops other semesters', () => {
		const courses = [
			base({ courseID: 'a', courseName: 'A', semester: 'B', degreeCatalogYear: 'א' }),
		];
		expect(filterCoursesForPlannerTerm(courses, 'A', 'א')).toHaveLength(0);
	});

	it('includes legacy courses without degreeCatalogYear', () => {
		const courses = [base({ courseID: 'x', courseName: 'X', semester: 'A' })];
		expect(filterCoursesForPlannerTerm(courses, 'A', 'א')).toHaveLength(1);
	});

	it('treats empty or whitespace degreeCatalogYear as unscoped legacy', () => {
		const courses = [
			base({ courseID: 'z', courseName: 'Z', semester: 'A', degreeCatalogYear: '' }),
			base({ courseID: 'w', courseName: 'W', semester: 'A', degreeCatalogYear: '   ' }),
		];
		expect(filterCoursesForPlannerTerm(courses, 'A', 'ב')).toHaveLength(2);
	});
});
