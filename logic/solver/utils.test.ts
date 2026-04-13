import { mockCourses } from "@/mockData/mock-courses";
import { StudentPreferences } from "@/types/constraints";
import type { Course, CourseSection } from "@/types/courses";
import { Days } from "@/types/courses";

import {
    calculateFitScore,
    isSectionValid,
    parseLessonTimeToMinutes,
    parsePreferenceTimeToMinutes,
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

    const without = calculateFitScore(
      [section001],
      [cs101],
      basePrefs(),
    );
    const withPref = calculateFitScore([section001], [cs101], {
      ...basePrefs(),
      preferredInstructorsByCourse: { CS101: "Dr. Smith" },
    });

    expect(withPref).toBeGreaterThan(without);
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
});
