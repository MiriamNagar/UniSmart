import { StudentPreferences } from "@/types/constraints";
import { Course, CourseSection, Lesson } from "@/types/courses";

/** Normalize lecturer labels for preference matching (case-insensitive, collapsed whitespace). */
export function normalizeLecturerLabel(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Catalog / lesson times: 24h "HH:MM". Returns minutes from midnight, or -1 if unset or invalid. */
export function parseLessonTimeToMinutes(time: string): number {
  if (time === "Any" || !time) return -1;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return -1;
  return hours * 60 + minutes;
}

/**
 * Planner UI / tests: "Any", "8:00 AM" … "9:00 PM", or plain "HH:MM".
 * Returns minutes from midnight, or -1 when unset ("Any").
 */
export function parsePreferenceTimeToMinutes(display: string): number {
  if (!display || display === "Any") return -1;
  const trimmed = display.trim();
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const mer = ampm[3].toUpperCase();
    if (Number.isNaN(h) || Number.isNaN(m)) return -1;
    if (mer === "PM" && h !== 12) h += 12;
    if (mer === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
  return parseLessonTimeToMinutes(trimmed);
}

// בדיקת חפיפה בין שני שיעורים בודדים
export function isLessonOverlap(lesson1: Lesson, lesson2: Lesson): boolean {
  if (lesson1.day !== lesson2.day) return false;

  const start1 = parseLessonTimeToMinutes(lesson1.startTime);
  const end1 = parseLessonTimeToMinutes(lesson1.endTime);
  const start2 = parseLessonTimeToMinutes(lesson2.startTime);
  const end2 = parseLessonTimeToMinutes(lesson2.endTime);

  return Math.max(start1, start2) < Math.min(end1, end2);
}

// בדיקה אם קבוצת רישום (Section) שלמה מתנגשת עם מערכת קיימת
export function hasCollision(
  newSection: CourseSection,
  currentSchedule: CourseSection[],
): boolean {
  for (const existingSection of currentSchedule) {
    for (const existingLesson of existingSection.lessons) {
      for (const newLesson of newSection.lessons) {
        if (isLessonOverlap(existingLesson, newLesson)) {
          return true;
        }
      }
    }
  }
  return false;
}

// בדיקת אילוצים קשיחים: האם הקבוצה נופלת על ימים חסומים או מתנגשת
export function isSectionValid(
  section: CourseSection,
  currentSchedule: CourseSection[],
  preferences: StudentPreferences,
): boolean {
  // בדיקת ימים חסומים
  const hasBlockedDay = section.lessons.some((lesson) =>
    preferences.blockedDays.includes(lesson.day),
  );
  if (hasBlockedDay) return false;

  const windowStart = parsePreferenceTimeToMinutes(preferences.startHour);
  const windowEnd = parsePreferenceTimeToMinutes(preferences.endHour);
  const outsideDailyWindow = section.lessons.some((lesson) => {
    const ls = parseLessonTimeToMinutes(lesson.startTime);
    const le = parseLessonTimeToMinutes(lesson.endTime);
    if (ls < 0 || le < 0) return true;
    if (windowStart >= 0 && ls < windowStart) return true;
    if (windowEnd >= 0 && le > windowEnd) return true;
    return false;
  });
  if (outsideDailyWindow) return false;

  // בדיקת חפיפת שעות
  if (hasCollision(section, currentSchedule)) return false;

  return true;
}

// פונקציית דירוג (אילוצים רכים) - מחזירה ציון 0-100
export function calculateFitScore(
  currentSections: CourseSection[],
  allSelectedCourses: Course[], // כל הקורסים שהסטודנט סימן ב-Checklist
  preferences: StudentPreferences,
): number {
  if (allSelectedCourses.length === 0) return 0;

  // --- 1. חישוב רכיב הנ"ז (40%) ---
  const maxPossibleCredits = allSelectedCourses.reduce(
    (sum, c) => sum + (c.credits || 0),
    0,
  );

  // מציאת הנ"ז של הקורסים ששובצו בפועל
  const currentCredits = currentSections.reduce((sum, section) => {
    const parentCourse = allSelectedCourses.find((c) =>
      c.availableSections.some((s) => s.sectionID === section.sectionID),
    );
    return sum + (parentCourse?.credits || 0);
  }, 0);

  const creditScore =
    maxPossibleCredits > 0 ? (currentCredits / maxPossibleCredits) * 60 : 0;

  // --- 2. חישוב רכיב השעות (60%) ---
  const allLessons = currentSections.flatMap((s) => s.lessons);
  const totalLessonsCount = allLessons.length;

  if (totalLessonsCount === 0) return creditScore; // מערכת ריקה תקבל רק ניקוד נ"ז (0)

  const prefStart = parsePreferenceTimeToMinutes(preferences.startHour);
  const prefEnd = parsePreferenceTimeToMinutes(preferences.endHour);

  let penaltyCount = 0;

  for (const lesson of allLessons) {
    const start = parseLessonTimeToMinutes(lesson.startTime);
    const end = parseLessonTimeToMinutes(lesson.endTime);

    let isViolated = false;
    if (prefStart !== -1 && start < prefStart) isViolated = true;
    if (prefEnd !== -1 && end > prefEnd) isViolated = true;

    if (isViolated) {
      penaltyCount++;
    }
  }

  // כל שיעור שחורג מוריד את החלק היחסי שלו מתוך ה-60 נקודות
  const timeScore = 40 * (1 - penaltyCount / totalLessonsCount);

  const prefMap = preferences.preferredInstructorsByCourse;
  let instructorBonus = 0;
  if (prefMap && Object.keys(prefMap).length > 0) {
    let considered = 0;
    let matches = 0;
    for (const [courseId, prefRaw] of Object.entries(prefMap)) {
      const prefNorm = normalizeLecturerLabel(prefRaw);
      if (!prefNorm) continue;
      const course = allSelectedCourses.find((c) => c.courseID === courseId);
      if (!course) continue;
      const scheduledSection = currentSections.find((section) =>
        course.availableSections.some((s) => s.sectionID === section.sectionID),
      );
      if (!scheduledSection) continue;
      considered += 1;
      const hit = scheduledSection.lessons.some(
        (lesson) => normalizeLecturerLabel(lesson.lecturer) === prefNorm,
      );
      if (hit) matches += 1;
    }
    if (considered > 0) {
      instructorBonus = (matches / considered) * 12;
    }
  }

  return Math.round(creditScore + timeScore + instructorBonus);
}
