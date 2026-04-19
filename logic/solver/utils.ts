import { StudentPreferences } from "@/types/constraints";
import { Course, CourseSection, Days, Lesson } from "@/types/courses";

/** Used to order proposals when fit scores tie: fewer same-day idle gaps first, then earlier first lesson. */
export interface ScheduleLayoutMetrics {
  /** Smallest lesson start time in minutes from midnight; lower = earlier. */
  earliestStartMinutes: number;
  /** Sum of gaps between consecutive lessons on the same day (idle time on campus). */
  totalInterLessonGapMinutes: number;
}

/**
 * Earliest first-class time and total same-day idle gaps between consecutive lessons.
 * Empty schedules sort last (earliestStartMinutes = +Infinity, gaps = 0).
 */
export function computeScheduleLayoutMetrics(
  sections: CourseSection[],
): ScheduleLayoutMetrics {
  const allLessons = sections.flatMap((s) => s.lessons);
  if (allLessons.length === 0) {
    return {
      earliestStartMinutes: Number.POSITIVE_INFINITY,
      totalInterLessonGapMinutes: 0,
    };
  }

  let earliest = Number.POSITIVE_INFINITY;
  for (const lesson of allLessons) {
    const start = parseLessonTimeToMinutes(lesson.startTime);
    if (start >= 0 && start < earliest) earliest = start;
  }

  const byDay = new Map<Days, Lesson[]>();
  for (const lesson of allLessons) {
    const list = byDay.get(lesson.day) ?? [];
    list.push(lesson);
    byDay.set(lesson.day, list);
  }

  let totalGap = 0;
  for (const lessons of byDay.values()) {
    lessons.sort((a, b) => {
      const sa = parseLessonTimeToMinutes(a.startTime);
      const sb = parseLessonTimeToMinutes(b.startTime);
      return sa - sb;
    });
    for (let i = 1; i < lessons.length; i++) {
      const prevEnd = parseLessonTimeToMinutes(lessons[i - 1].endTime);
      const curStart = parseLessonTimeToMinutes(lessons[i].startTime);
      if (prevEnd >= 0 && curStart >= 0 && curStart > prevEnd) {
        totalGap += curStart - prevEnd;
      }
    }
  }

  return {
    earliestStartMinutes: earliest,
    totalInterLessonGapMinutes: totalGap,
  };
}

/**
 * Stable key for the **displayed** weekly timetable: course + slot + lesson type per lesson.
 * Ignores section IDs so two catalog variants with identical class times dedupe as one proposal.
 */
export function lessonMultisetFingerprint(
  sections: CourseSection[],
  allCourses: Course[],
): string {
  const parts: string[] = [];
  for (const section of sections) {
    const parentCourse = allCourses.find((c) =>
      c.availableSections.some((s) => s.sectionID === section.sectionID),
    );
    const courseId = parentCourse?.courseID ?? section.sectionID;
    for (const lesson of section.lessons) {
      parts.push(
        `${courseId}|${lesson.day}|${lesson.startTime}|${lesson.endTime}|${lesson.type}`,
      );
    }
  }
  parts.sort();
  return parts.join("||");
}

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

/**
 * True if two lessons in the same section overlap in time (invalid catalog / bundle break).
 * Atomic section bundles must schedule all lessons together; they must not collide with each other.
 */
export function hasInternalSectionCollision(section: CourseSection): boolean {
  const { lessons } = section;
  for (let i = 0; i < lessons.length; i++) {
    for (let j = i + 1; j < lessons.length; j++) {
      if (isLessonOverlap(lessons[i], lessons[j])) return true;
    }
  }
  return false;
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
  if (hasInternalSectionCollision(section)) return false;

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

/**
 * Verifies a complete proposed schedule against release hard rules (FR19):
 * no time collisions, blocked-day compliance, daily time window, atomic section bundles (no intra-section overlap).
 */
export function scheduleRespectsHardRules(
  sections: CourseSection[],
  preferences: StudentPreferences,
): boolean {
  for (const section of sections) {
    const others = sections.filter((s) => s.sectionID !== section.sectionID);
    if (!isSectionValid(section, others, preferences)) return false;
  }
  return true;
}

/**
 * Documented soft-score caps (FR15/FR20). Total display score is the sum, capped at 100.
 * Hard feasibility (blocked days, collisions, daily window) is enforced separately before scoring.
 */
export const SOFT_SCORE_CAP_CREDITS = 60;
export const SOFT_SCORE_CAP_PREFERRED_HOURS = 40;
export const SOFT_SCORE_CAP_INSTRUCTOR_BONUS = 12;

/** User-facing summary of how fit scores are built (UX-DR4 / UX-DR5 / UX-DR16). */
export const PLANNER_SOFT_SCORE_EXPLANATION =
  "Each option is ranked by a soft score: scheduled credits (up to 60 pts), alignment with your preferred daily window (up to 40 pts), and instructor preferences when you set them (up to 12 bonus pts). Proposals are sorted by score, then by fewer same-day gaps and earlier first class.";

/** Planning-aid disclaimer (UX-DR16). */
export const PLANNER_RANKING_NOT_ENROLLMENT_DISCLAIMER =
  "These rankings and scores are a planning aid only. They do not guarantee enrollment, seats, or registrar approval.";

export interface FitScoreBreakdown {
  /** Display total 0–100 (components may sum higher before cap). */
  total: number;
  creditPoints: number;
  preferredHoursPoints: number;
  instructorBonusPoints: number;
  currentCredits: number;
  maxPossibleCredits: number;
  lessonsOutsidePreferredWindow: number;
  totalLessons: number;
  instructorMatches: number;
  instructorCoursesConsidered: number;
}

/**
 * Soft scoring breakdown for transparency (same formula as {@link calculateFitScore}).
 */
export function computeFitScoreBreakdown(
  currentSections: CourseSection[],
  allSelectedCourses: Course[],
  preferences: StudentPreferences,
): FitScoreBreakdown {
  const empty: FitScoreBreakdown = {
    total: 0,
    creditPoints: 0,
    preferredHoursPoints: 0,
    instructorBonusPoints: 0,
    currentCredits: 0,
    maxPossibleCredits: 0,
    lessonsOutsidePreferredWindow: 0,
    totalLessons: 0,
    instructorMatches: 0,
    instructorCoursesConsidered: 0,
  };

  if (allSelectedCourses.length === 0) return empty;

  const maxPossibleCredits = allSelectedCourses.reduce(
    (sum, c) => sum + (c.credits || 0),
    0,
  );

  const currentCredits = currentSections.reduce((sum, section) => {
    const parentCourse = allSelectedCourses.find((c) =>
      c.availableSections.some((s) => s.sectionID === section.sectionID),
    );
    return sum + (parentCourse?.credits || 0);
  }, 0);

  const creditPoints =
    maxPossibleCredits > 0
      ? (currentCredits / maxPossibleCredits) * SOFT_SCORE_CAP_CREDITS
      : 0;

  const allLessons = currentSections.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;

  if (totalLessons === 0) {
    const total = Math.min(100, Math.round(creditPoints));
    return {
      ...empty,
      total,
      creditPoints,
      preferredHoursPoints: 0,
      instructorBonusPoints: 0,
      currentCredits,
      maxPossibleCredits,
      totalLessons: 0,
    };
  }

  const prefStart = parsePreferenceTimeToMinutes(preferences.startHour);
  const prefEnd = parsePreferenceTimeToMinutes(preferences.endHour);

  let lessonsOutsidePreferredWindow = 0;
  /** Lessons with parseable start/end times only; malformed catalog times are excluded from window scoring. */
  let lessonsForPreferredWindow = 0;

  for (const lesson of allLessons) {
    const start = parseLessonTimeToMinutes(lesson.startTime);
    const end = parseLessonTimeToMinutes(lesson.endTime);
    if (start < 0 || end < 0) continue;

    lessonsForPreferredWindow += 1;
    let isViolated = false;
    if (prefStart !== -1 && start < prefStart) isViolated = true;
    if (prefEnd !== -1 && end > prefEnd) isViolated = true;

    if (isViolated) {
      lessonsOutsidePreferredWindow += 1;
    }
  }

  const preferredHoursPoints =
    lessonsForPreferredWindow === 0
      ? 0
      : SOFT_SCORE_CAP_PREFERRED_HOURS *
        (1 - lessonsOutsidePreferredWindow / lessonsForPreferredWindow);

  const prefMap = preferences.preferredInstructorsByCourse;
  let instructorBonusPoints = 0;
  let instructorMatches = 0;
  let instructorCoursesConsidered = 0;

  if (prefMap && Object.keys(prefMap).length > 0) {
    for (const [courseId, prefRaw] of Object.entries(prefMap)) {
      const prefNorm = normalizeLecturerLabel(prefRaw);
      if (!prefNorm) continue;
      const idNeedle = courseId.trim();
      if (!idNeedle) continue;
      const course = allSelectedCourses.find(
        (c) => c.courseID.trim() === idNeedle,
      );
      if (!course) continue;
      const scheduledSection = currentSections.find((section) =>
        course.availableSections.some((s) => s.sectionID === section.sectionID),
      );
      if (!scheduledSection) continue;
      instructorCoursesConsidered += 1;
      const hit = scheduledSection.lessons.some(
        (lesson) => normalizeLecturerLabel(lesson.lecturer) === prefNorm,
      );
      if (hit) instructorMatches += 1;
    }
    if (instructorCoursesConsidered > 0) {
      instructorBonusPoints =
        (instructorMatches / instructorCoursesConsidered) *
        SOFT_SCORE_CAP_INSTRUCTOR_BONUS;
    }
  }

  const total = Math.min(
    100,
    Math.round(creditPoints + preferredHoursPoints + instructorBonusPoints),
  );

  return {
    total,
    creditPoints,
    preferredHoursPoints,
    instructorBonusPoints,
    currentCredits,
    maxPossibleCredits,
    lessonsOutsidePreferredWindow,
    totalLessons,
    instructorMatches,
    instructorCoursesConsidered,
  };
}

// פונקציית דירוג (אילוצים רכים) - מחזירה ציון 0-100
export function calculateFitScore(
  currentSections: CourseSection[],
  allSelectedCourses: Course[], // כל הקורסים שהסטודנט סימן ב-Checklist
  preferences: StudentPreferences,
): number {
  return computeFitScoreBreakdown(
    currentSections,
    allSelectedCourses,
    preferences,
  ).total;
}
