import { generateSchedules } from './engine';
import { DEFAULT_MAX_PLANNER_PROPOSALS } from './limits';
import { scheduleRespectsHardRules } from './utils';
import { mockCourses } from '../../mockData/mock-courses';
import { Course, Days } from '@/types/courses';
import { printSchedulesToConsole } from './debug-printer';

function slot(
  day: Days,
  startTime: string,
  endTime: string,
) {
  return {
    day,
    lecturer: 'T',
    location: 'R',
    type: 'Lecture' as const,
    startTime,
    endTime,
  };
}

/** Three mandatory courses × two non-conflicting sections each ⇒ 8 complete schedules. */
function buildManyCombinationCourses(): Course[] {
  return [
    {
      courseID: 'E1',
      courseName: 'Course 1',
      isMandatory: true,
      credits: 1,
      semester: 'A',
      availableSections: [
        { sectionID: 'E1-001', lessons: [slot(Days.Mon, '09:00', '10:00')] },
        { sectionID: 'E1-002', lessons: [slot(Days.Tue, '09:00', '10:00')] },
      ],
    },
    {
      courseID: 'E2',
      courseName: 'Course 2',
      isMandatory: true,
      credits: 1,
      semester: 'A',
      availableSections: [
        { sectionID: 'E2-001', lessons: [slot(Days.Wed, '09:00', '10:00')] },
        { sectionID: 'E2-002', lessons: [slot(Days.Thu, '09:00', '10:00')] },
      ],
    },
    {
      courseID: 'E3',
      courseName: 'Course 3',
      isMandatory: true,
      credits: 1,
      semester: 'A',
      availableSections: [
        { sectionID: 'E3-001', lessons: [slot(Days.Fri, '09:00', '10:00')] },
        { sectionID: 'E3-002', lessons: [slot(Days.Sun, '09:00', '10:00')] },
      ],
    },
  ];
}

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
      expect(scheduleRespectsHardRules(proposal.sections, preferences)).toBe(true);
    });
  });

  it('does not emit proposals when the only mandatory section bundle has overlapping lessons', () => {
    const preferences = {
      blockedDays: [] as Days[],
      startHour: 'Any' as const,
      endHour: 'Any' as const,
    };
    const courses: Course[] = [
      {
        courseID: 'BAD-BUNDLE',
        courseName: 'Invalid bundle',
        isMandatory: true,
        credits: 3,
        semester: 'A',
        availableSections: [
          {
            sectionID: 'BAD-BUNDLE-001',
            lessons: [
              slot(Days.Mon, '09:00', '10:00'),
              slot(Days.Mon, '09:30', '10:30'),
            ],
          },
        ],
      },
    ];
    const result = generateSchedules(courses, preferences);
    expect(result.proposals.length).toBe(0);
  });

  it('every proposal satisfies hard feasibility rules', () => {
    const preferences = {
      blockedDays: [] as Days[],
      startHour: 'Any' as const,
      endHour: 'Any' as const,
    };
    const coursesToSchedule = mockCourses.filter(
      (c) => c.courseID === 'CS101' || c.courseID === 'MATH201',
    );
    const result = generateSchedules(coursesToSchedule, preferences);
    result.proposals.forEach((p) => {
      expect(scheduleRespectsHardRules(p.sections, preferences)).toBe(true);
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
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const preferences = {
      blockedDays: [Days.Wed],
      startHour: 'Any',
      endHour: 'Any',
    };

    const result = generateSchedules(mockCourses, preferences);
    expect(result.proposals.length).toBeGreaterThan(0);
    printSchedulesToConsole(result);
    logSpy.mockRestore();
  });

  it('caps the number of returned proposals when many combinations exist', () => {
    const preferences = {
      blockedDays: [] as Days[],
      startHour: 'Any' as const,
      endHour: 'Any' as const,
    };
    const courses = buildManyCombinationCourses();
    const uncapped = generateSchedules(
      courses,
      preferences,
      DEFAULT_MAX_PLANNER_PROPOSALS + 10,
    );
    expect(uncapped.proposals.length).toBe(8);

    const capped = generateSchedules(
      courses,
      preferences,
      DEFAULT_MAX_PLANNER_PROPOSALS,
    );
    expect(capped.proposals.length).toBe(DEFAULT_MAX_PLANNER_PROPOSALS);

    const invalidCap = generateSchedules(courses, preferences, -1);
    expect(invalidCap.proposals.length).toBe(DEFAULT_MAX_PLANNER_PROPOSALS);
    const nanCap = generateSchedules(courses, preferences, Number.NaN);
    expect(nanCap.proposals.length).toBe(DEFAULT_MAX_PLANNER_PROPOSALS);
  });

  it('sets totalCredits to the sum of course credits for scheduled sections', () => {
    const preferences = {
      blockedDays: [] as Days[],
      startHour: 'Any' as const,
      endHour: 'Any' as const,
    };
    const courses: Course[] = [
      {
        courseID: 'CR3',
        courseName: 'Three credits',
        isMandatory: true,
        credits: 3,
        semester: 'A',
        availableSections: [
          {
            sectionID: 'CR3-001',
            lessons: [slot(Days.Mon, '08:00', '09:00')],
          },
        ],
      },
      {
        courseID: 'CR4',
        courseName: 'Four credits',
        isMandatory: true,
        credits: 4,
        semester: 'A',
        availableSections: [
          {
            sectionID: 'CR4-001',
            lessons: [slot(Days.Tue, '08:00', '09:00')],
          },
        ],
      },
    ];

    const result = generateSchedules(courses, preferences);
    expect(result.proposals.length).toBe(1);
    expect(result.proposals[0].totalCredits).toBe(7);
  });

  // Soft ordering / tie-break (Epic 2 Story 2.9); kept here as regression guard for sort + metrics.
  it('when fit scores tie, prefers smaller same-day gaps over earlier first lesson', () => {
    const preferences = {
      blockedDays: [] as Days[],
      startHour: 'Any' as const,
      endHour: 'Any' as const,
    };
    const courses: Course[] = [
      {
        courseID: 'A',
        courseName: 'A',
        isMandatory: true,
        credits: 2,
        semester: 'A',
        availableSections: [
          {
            sectionID: 'A-WIDE',
            lessons: [
              slot(Days.Mon, '08:00', '09:00'),
              slot(Days.Mon, '11:00', '12:00'),
            ],
          },
          {
            sectionID: 'A-TIGHT',
            lessons: [
              slot(Days.Mon, '10:00', '11:00'),
              slot(Days.Mon, '11:30', '12:30'),
            ],
          },
        ],
      },
      {
        courseID: 'B',
        courseName: 'B',
        isMandatory: true,
        credits: 2,
        semester: 'A',
        availableSections: [
          { sectionID: 'B-TUE', lessons: [slot(Days.Tue, '09:00', '10:00')] },
        ],
      },
    ];

    const result = generateSchedules(courses, preferences, 5);
    expect(result.proposals.length).toBe(2);
    const firstIds = result.proposals[0].sections.map((s) => s.sectionID).sort();
    expect(firstIds).toContain('A-TIGHT');
    expect(firstIds).toContain('B-TUE');
  });

  it('collapses proposals that look identical on the calendar (same lesson times, different section IDs)', () => {
    const preferences = {
      blockedDays: [] as Days[],
      startHour: 'Any' as const,
      endHour: 'Any' as const,
    };
    const monLecture = slot(Days.Mon, '09:00', '10:00');
    const courses: Course[] = [
      {
        courseID: 'VIS',
        courseName: 'Visual dup test',
        isMandatory: true,
        credits: 3,
        semester: 'A',
        availableSections: [
          { sectionID: 'VIS-SECTION-A', lessons: [monLecture] },
          { sectionID: 'VIS-SECTION-B', lessons: [monLecture] },
        ],
      },
    ];
    const result = generateSchedules(courses, preferences, 10);
    expect(result.proposals.length).toBe(1);
  });

  it('does not return duplicate proposals when the same section multiset is reached in different orders', () => {
    const preferences = {
      blockedDays: [] as Days[],
      startHour: 'Any' as const,
      endHour: 'Any' as const,
    };
    const sectionX = {
      sectionID: 'DEDUP-X',
      lessons: [slot(Days.Mon, '09:00', '10:00')],
    };
    const sectionY = {
      sectionID: 'DEDUP-Y',
      lessons: [slot(Days.Tue, '09:00', '10:00')],
    };
    const row: Course = {
      courseID: 'DUP',
      courseName: 'Duplicate row',
      isMandatory: true,
      credits: 1,
      semester: 'A',
      availableSections: [sectionX, sectionY],
    };
    const courses: Course[] = [row, { ...row }];

    const result = generateSchedules(courses, preferences, 10);
    expect(result.proposals.length).toBe(1);
    expect(
      result.proposals[0].sections.map((s) => s.sectionID).sort(),
    ).toEqual(['DEDUP-X', 'DEDUP-Y']);
  });
});
