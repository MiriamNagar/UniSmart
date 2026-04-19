import { mockCourses } from "@/mockData/mock-courses";
import { StudentPreferences } from "@/types/constraints";
import type { Course, CourseSection } from "@/types/courses";
import { Days } from "@/types/courses";

import {
    calculateFitScore,
    computeFitScoreBreakdown,
    computeScheduleLayoutMetrics,
    hasInternalSectionCollision,
    isSectionValid,
    lessonMultisetFingerprint,
    parseLessonTimeToMinutes,
    parsePreferenceTimeToMinutes,
    scheduleRespectsHardRules,
} from "./utils";

describe("parsePreferenceTimeToMinutes", () => {
  it("treats Any as unset", () => {
    expect(parsePreferenceTimeToMinutes("Any")).toBe(-1);
  });

  it("parses planner UI 12-hour labels", () => {
    expect(parsePreferenceTimeToMinutes("8:00 AM")).toBe(8 * 60);
    expect(parsePreferenceTimeToMinutes("12:00 PM")).toBe(12 * 60);
    expect(parsePreferenceTimeToMinutes("1:00 PM")).toBe(13 * 60);
    expect(parsePreferenceTimeToMinutes("9:00 PM")).toBe(21 * 60);
    expect(parsePreferenceTimeToMinutes("12:00 AM")).toBe(0);
  });

  it("parses 12-hour labels without a space before AM/PM", () => {
    expect(parsePreferenceTimeToMinutes("9:00AM")).toBe(9 * 60);
    expect(parsePreferenceTimeToMinutes("1:05pm")).toBe(13 * 60 + 5);
  });

  it("accepts plain HH:MM for tests and fixtures", () => {
    expect(parsePreferenceTimeToMinutes("14:30")).toBe(14 * 60 + 30);
  });
});

describe("parseLessonTimeToMinutes", () => {
  it("parses 24h lesson times", () => {
    expect(parseLessonTimeToMinutes("09:00")).toBe(9 * 60);
    expect(parseLessonTimeToMinutes("16:30")).toBe(16 * 60 + 30);
  });
});

describe("lessonMultisetFingerprint", () => {
  it("matches for different section IDs with the same lesson slots", () => {
    const course: Course = {
      courseID: "C",
      courseName: "C",
      isMandatory: true,
      credits: 1,
      semester: "A",
      availableSections: [
        {
          sectionID: "C-A",
          lessons: [
            {
              day: Days.Mon,
              lecturer: "L",
              location: "R",
              type: "Lecture",
              startTime: "09:00",
              endTime: "10:00",
            },
          ],
        },
        {
          sectionID: "C-B",
          lessons: [
            {
              day: Days.Mon,
              lecturer: "L",
              location: "R",
              type: "Lecture",
              startTime: "09:00",
              endTime: "10:00",
            },
          ],
        },
      ],
    };
    const fa = lessonMultisetFingerprint([course.availableSections[0]], [
      course,
    ]);
    const fb = lessonMultisetFingerprint([course.availableSections[1]], [
      course,
    ]);
    expect(fa).toBe(fb);
  });
});

describe("computeScheduleLayoutMetrics", () => {
  it("sums same-day gaps between consecutive lessons", () => {
    const sections: CourseSection[] = [
      {
        sectionID: "S1",
        lessons: [
          {
            day: Days.Mon,
            lecturer: "L",
            location: "R",
            type: "Lecture",
            startTime: "09:00",
            endTime: "10:00",
          },
          {
            day: Days.Mon,
            lecturer: "L",
            location: "R",
            type: "Lecture",
            startTime: "12:00",
            endTime: "13:00",
          },
        ],
      },
    ];
    const m = computeScheduleLayoutMetrics(sections);
    expect(m.earliestStartMinutes).toBe(9 * 60);
    expect(m.totalInterLessonGapMinutes).toBe(2 * 60);
  });

  it("reports infinite earliest start when there are no lessons", () => {
    expect(computeScheduleLayoutMetrics([]).earliestStartMinutes).toBe(
      Number.POSITIVE_INFINITY,
    );
  });
});

describe("hasInternalSectionCollision (bundle integrity)", () => {
  it("detects overlapping lessons within one section", () => {
    const section: CourseSection = {
      sectionID: "bundle-bad",
      lessons: [
        {
          day: Days.Mon,
          lecturer: "L",
          location: "R",
          type: "Lecture",
          startTime: "09:00",
          endTime: "10:00",
        },
        {
          day: Days.Mon,
          lecturer: "L",
          location: "R",
          type: "Tutorial",
          startTime: "09:30",
          endTime: "10:30",
        },
      ],
    };
    expect(hasInternalSectionCollision(section)).toBe(true);
    expect(isSectionValid(section, [], { blockedDays: [], startHour: "Any", endHour: "Any" })).toBe(false);
  });

  it("returns false when same-day lessons are adjacent without overlap", () => {
    const section: CourseSection = {
      sectionID: "bundle-ok",
      lessons: [
        {
          day: Days.Mon,
          lecturer: "L",
          location: "R",
          type: "Lecture",
          startTime: "09:00",
          endTime: "10:00",
        },
        {
          day: Days.Mon,
          lecturer: "L",
          location: "R",
          type: "Tutorial",
          startTime: "10:00",
          endTime: "11:00",
        },
      ],
    };
    expect(hasInternalSectionCollision(section)).toBe(false);
  });
});

describe("scheduleRespectsHardRules", () => {
  const openPrefs = (): StudentPreferences => ({
    blockedDays: [],
    startHour: "Any",
    endHour: "Any",
  });

  it("rejects a full schedule if any section hits a blocked day", () => {
    const a: CourseSection = {
      sectionID: "A1",
      lessons: [
        {
          day: Days.Mon,
          lecturer: "L",
          location: "R",
          type: "Lecture",
          startTime: "09:00",
          endTime: "10:00",
        },
      ],
    };
    const b: CourseSection = {
      sectionID: "B1",
      lessons: [
        {
          day: Days.Wed,
          lecturer: "L",
          location: "R",
          type: "Lecture",
          startTime: "09:00",
          endTime: "10:00",
        },
      ],
    };
    expect(scheduleRespectsHardRules([a, b], openPrefs())).toBe(true);
    expect(
      scheduleRespectsHardRules([a, b], { ...openPrefs(), blockedDays: [Days.Wed] }),
    ).toBe(false);
  });
});

describe("isSectionValid hard daily window", () => {
  const prefs = (start: string, end: string): StudentPreferences => ({
    blockedDays: [],
    startHour: start,
    endHour: end,
  });

  it("rejects a section that starts before earliest allowed time", () => {
    const section: CourseSection = {
      sectionID: "T-001",
      lessons: [
        {
          day: Days.Mon,
          lecturer: "A",
          location: "R1",
          type: "Lecture",
          startTime: "08:00",
          endTime: "09:00",
        },
      ],
    };
    expect(isSectionValid(section, [], prefs("9:00 AM", "Any"))).toBe(false);
    expect(isSectionValid(section, [], prefs("8:00 AM", "Any"))).toBe(true);
  });

  it("rejects a section that ends after latest allowed time", () => {
    const section: CourseSection = {
      sectionID: "T-002",
      lessons: [
        {
          day: Days.Tue,
          lecturer: "B",
          location: "R2",
          type: "Lecture",
          startTime: "18:00",
          endTime: "20:00",
        },
      ],
    };
    expect(isSectionValid(section, [], prefs("Any", "7:00 PM"))).toBe(false);
    expect(isSectionValid(section, [], prefs("Any", "9:00 PM"))).toBe(true);
  });
});

describe("computeFitScoreBreakdown", () => {
  const basePrefs = (): StudentPreferences => ({
    blockedDays: [],
    startHour: "Any",
    endHour: "Any",
  });

  it("matches calculateFitScore total", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101") as Course;
    const section001 = cs101.availableSections.find(
      (s) => s.sectionID === "CS101-001",
    ) as CourseSection;
    const b = computeFitScoreBreakdown([section001], [cs101], basePrefs());
    expect(calculateFitScore([section001], [cs101], basePrefs())).toBe(b.total);
  });

  it("caps display total at 100 when raw components exceed 100", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101") as Course;
    const section001 = cs101.availableSections.find(
      (s) => s.sectionID === "CS101-001",
    ) as CourseSection;
    const b = computeFitScoreBreakdown([section001], [cs101], {
      ...basePrefs(),
      preferredInstructorsByCourse: { CS101: "Dr. Smith" },
    });
    expect(b.total).toBe(100);
    expect(b.creditPoints + b.preferredHoursPoints + b.instructorBonusPoints).toBeGreaterThan(100);
  });

  it("ignores malformed lesson times in preferred-window scoring (does not treat -1 as before window)", () => {
    const course: Course = {
      courseID: "X",
      courseName: "X",
      isMandatory: true,
      credits: 3,
      semester: "A",
      availableSections: [
        {
          sectionID: "X-1",
          lessons: [
            {
              day: Days.Mon,
              lecturer: "L",
              location: "R",
              type: "Lecture",
              startTime: "09:00",
              endTime: "10:00",
            },
            {
              day: Days.Mon,
              lecturer: "L",
              location: "R",
              type: "Lecture",
              startTime: "not-a-time",
              endTime: "11:00",
            },
          ],
        },
      ],
    };
    const b = computeFitScoreBreakdown(
      [course.availableSections[0]],
      [course],
      {
        blockedDays: [],
        startHour: "8:00 AM",
        endHour: "9:00 PM",
      },
    );
    expect(b.lessonsOutsidePreferredWindow).toBe(0);
    expect(b.totalLessons).toBe(2);
  });
});

describe("calculateFitScore instructor preferences", () => {
  const basePrefs = (): StudentPreferences => ({
    blockedDays: [],
    startHour: "Any",
    endHour: "Any",
  });

  it("adds bonus when scheduled section includes the preferred lecturer", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101") as Course;
    const section001 = cs101.availableSections.find(
      (s) => s.sectionID === "CS101-001",
    ) as CourseSection;

    const withoutB = computeFitScoreBreakdown(
      [section001],
      [cs101],
      basePrefs(),
    );
    const withB = computeFitScoreBreakdown([section001], [cs101], {
      ...basePrefs(),
      preferredInstructorsByCourse: { CS101: "Dr. Smith" },
    });

    expect(withoutB.instructorBonusPoints).toBe(0);
    expect(withB.instructorBonusPoints).toBeGreaterThan(0);
  });

  it("does not add bonus when another lecturer is scheduled", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101") as Course;
    const section002 = cs101.availableSections.find(
      (s) => s.sectionID === "CS101-002",
    ) as CourseSection;

    const without = calculateFitScore(
      [section002],
      [cs101],
      basePrefs(),
    );
    const withPref = calculateFitScore([section002], [cs101], {
      ...basePrefs(),
      preferredInstructorsByCourse: { CS101: "Dr. Smith" },
    });

    expect(withPref).toBe(without);
  });

  it("applies bonus when preferredInstructorsByCourse key has surrounding whitespace", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101") as Course;
    const section001 = cs101.availableSections.find(
      (s) => s.sectionID === "CS101-001",
    ) as CourseSection;

    const withoutB = computeFitScoreBreakdown(
      [section001],
      [cs101],
      basePrefs(),
    );
    const withB = computeFitScoreBreakdown([section001], [cs101], {
      ...basePrefs(),
      preferredInstructorsByCourse: { "  CS101  ": "Dr. Smith" },
    });

    expect(withoutB.instructorBonusPoints).toBe(0);
    expect(withB.instructorBonusPoints).toBeGreaterThan(0);
  });

  it("applies bonus when catalog courseID has surrounding whitespace", () => {
    const cs101 = mockCourses.find((c) => c.courseID === "CS101") as Course;
    const section001 = cs101.availableSections.find(
      (s) => s.sectionID === "CS101-001",
    ) as CourseSection;
    const courseSpaced = { ...cs101, courseID: "  CS101  " };

    const withoutB = computeFitScoreBreakdown(
      [section001],
      [courseSpaced],
      basePrefs(),
    );
    const withB = computeFitScoreBreakdown([section001], [courseSpaced], {
      ...basePrefs(),
      preferredInstructorsByCourse: { CS101: "Dr. Smith" },
    });

    expect(withoutB.instructorBonusPoints).toBe(0);
    expect(withB.instructorBonusPoints).toBeGreaterThan(0);
  });
});
