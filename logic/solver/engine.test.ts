import { generateSchedules } from './engine';
import { mockCourses } from '../../mockData/mock-courses';
import { Days } from '@/types/courses';
import { printSchedulesToConsole } from './debug-printer';

describe('Schedule Solver Engine', () => {
  it('should avoid overlapping courses (CS101 and MATH201)', () => {
    // 1. הגדרת נתוני הבדיקה
    const coursesToSchedule = mockCourses.filter(c => 
      c.courseID === 'CS101' || c.courseID === 'MATH201'
    );
    
    const preferences = {
      blockedDays: [],
      startHour: 'Any',
      endHour: 'Any'
    };

    // 2. הפעלת האלגוריתם
    const result = generateSchedules(coursesToSchedule, preferences);

    // 3. אימות התוצאות (Assertions)
    
    // מוודאים שחזרה לפחות מערכת אחת תקינה
    expect(result.proposals.length).toBeGreaterThan(0);

    // מוודאים שבכל המערכות שהוצעו, MATH201 שובץ לקבוצה 001
    // כי קבוצה 002 מתנגשת עם שתי האפשרויות של CS101 ביום שני
    result.proposals.forEach(proposal => {
      const mathSection = proposal.sections.find(s => s.sectionID.startsWith('MATH201'));
      expect(mathSection?.sectionID).toBe('MATH201-001');
    });
  });

  it('should respect blocked days', () => {
    const coursesToSchedule = mockCourses.filter(c => c.courseID === 'HIST150');
    
    // חוסמים את יום רביעי (היום היחיד שבו מתקיים הקורס בהיסטוריה)
    const preferences = {
		blockedDays: [Days.Wed],
		startHour: 'Any',
		endHour: 'Any'
    };

    const result = generateSchedules(coursesToSchedule, preferences);

    // מוודאים שהקורס לא שובץ כי הוא נופל על יום חסום
    // מכיוון שהוא לא קורס חובה (isMandatory: false במוק), האלגוריתם ידלג עליו
    expect(result.proposals.length).toBeGreaterThan(0);
    expect(result.proposals[0].sections.length).toBe(0);
  });

  it('should generate multiple valid schedules and print them', () => {
	const preferences = {
		blockedDays: [],
		startHour: 'Any',
		endHour: 'Any'
	};

	const result = generateSchedules(mockCourses, preferences);
		printSchedulesToConsole(result);
	});
});