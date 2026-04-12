import { bguCatalogToCourses, parseBguTimeField } from './bgu-catalog-to-courses';
import { Days } from '@/types/courses';

describe('parseBguTimeField', () => {
	it('parses standard Hebrew day line', () => {
		const r = parseBguTimeField('יום ג 10:00-13:00');
		expect(r).toEqual({
			day: Days.Tue,
			startTime: '10:00',
			endTime: '13:00',
		});
	});

	it('returns null for unparseable input', () => {
		expect(parseBguTimeField('')).toBeNull();
		expect(parseBguTimeField('invalid')).toBeNull();
	});
});

describe('bguCatalogToCourses', () => {
	it('produces Course entries with sections and lessons', () => {
		const catalog = {
			courses: {
				'Test Course': {
					name: 'Test Course',
					prerequisites: [],
					offerings: [
						{
							type: 'שיעור',
							lecturer: 'Dr A',
							semester: 'א',
							year: 'א',
							time: 'יום א 09:00-11:00',
							credits: 3,
							weekly_hours: 2,
							places: 10,
						},
						{
							type: 'תרגיל',
							lecturer: 'TA B',
							semester: 'א',
							year: 'א',
							time: 'יום ב 14:00-15:00',
							credits: 0,
							weekly_hours: 0,
							places: 5,
						},
					],
				},
			},
		};
		const courses = bguCatalogToCourses(catalog, { seed: 1 });
		expect(courses.length).toBe(1);
		expect(courses[0].semester).toBe('A');
		expect(courses[0].degreeCatalogYear).toBe('א');
		expect(courses[0].availableSections.length).toBe(1);
		expect(courses[0].availableSections[0].lessons.length).toBe(2);
		expect(courses[0].availableSections[0].lessons[0].type).toBe('Lecture');
		expect(courses[0].availableSections[0].lessons[1].type).toBe('Tutorial');
	});
});
