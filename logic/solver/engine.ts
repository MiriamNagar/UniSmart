import { StudentPreferences } from "@/types/constraints";
import { Course, CourseSection } from "@/types/courses";
import { PlannerResult, schedule } from "@/types/planner-result";
import {
  DEFAULT_MAX_PLANNER_PROPOSALS,
  MAX_SOLVER_BACKTRACK_CALLS,
  MAX_SOLVER_COLLECTED_COMPLETE_SCHEDULES,
} from "./limits";
import {
  calculateFitScore,
  computeScheduleLayoutMetrics,
  isSectionValid,
  lessonMultisetFingerprint,
  scheduleRespectsHardRules,
} from "./utils";

function sumScheduledCredits(
  sections: CourseSection[],
  allCourses: Course[],
): number {
  return sections.reduce((sum, section) => {
    const parentCourse = allCourses.find((c) =>
      c.availableSections.some((s) => s.sectionID === section.sectionID),
    );
    return sum + (parentCourse?.credits ?? 0);
  }, 0);
}

/** Stable tie-breaker for ordering (fit score already primary). */
function scheduleTieKey(s: schedule): string {
  return s.sections.map((sec) => sec.sectionID).sort().join("|");
}

function stableScheduleId(sections: CourseSection[]): string {
  return `sched-${sections.map((s) => s.sectionID).sort().join("+")}`;
}

export function generateSchedules(
  courses: Course[],
  preferences: StudentPreferences,
  maxResults: number = DEFAULT_MAX_PLANNER_PROPOSALS,
): PlannerResult {
  const validSchedules: schedule[] = [];
  /** Same multiset of sections can be reached via different skip/assign paths when optionals exist. */
  const seenCompleteScheduleKeys = new Set<string>();
  let backtrackCalls = 0;

  // סידור הקורסים כך שקורסי חובה ישובצו קודם
  // זה מייעל את הגיזום בעץ הקומבינטורי
  const sortedCourses = [...courses].sort((a, b) => {
    if (a.isMandatory === b.isMandatory) return 0;
    return a.isMandatory ? -1 : 1;
  });

  /*
   * Stopping rules (work cap, AC #2): do not enumerate every feasible schedule.
   * Search stops when either (1) enough complete schedules are collected, or
   * (2) MAX_SOLVER_BACKTRACK_CALLS is exceeded — whichever comes first. Only valid
   * complete schedules are pushed to `validSchedules`; output is still sorted by fit
   * score and trimmed to `maxResults`.
   */
  function backtrack(courseIndex: number, currentSections: CourseSection[]) {
    backtrackCalls += 1;
    if (backtrackCalls > MAX_SOLVER_BACKTRACK_CALLS) {
      return;
    }
    if (validSchedules.length >= MAX_SOLVER_COLLECTED_COMPLETE_SCHEDULES) {
      return;
    }

    // תנאי עצירה: עברנו על כל הקורסים
    if (courseIndex === sortedCourses.length) {
      if (validSchedules.length >= MAX_SOLVER_COLLECTED_COMPLETE_SCHEDULES) {
        return;
      }
      if (!scheduleRespectsHardRules(currentSections, preferences)) {
        return;
      }
      const dedupKey = stableScheduleId(currentSections);
      if (seenCompleteScheduleKeys.has(dedupKey)) {
        return;
      }
      seenCompleteScheduleKeys.add(dedupKey);
      const newSchedule: schedule = {
        id: dedupKey,
        sections: [...currentSections],
        fitScore: calculateFitScore(
          currentSections,
          sortedCourses,
          preferences,
        ),
        totalCredits: sumScheduledCredits(currentSections, sortedCourses),
      };
      validSchedules.push(newSchedule);
      return;
    }

    const currentCourse = sortedCourses[courseIndex];

    // ענף 1: נסיון לדלג על הקורס (רק אם הוא קורס בחירה)
    if (!currentCourse.isMandatory) {
      backtrack(courseIndex + 1, currentSections);
    }

    if (validSchedules.length >= MAX_SOLVER_COLLECTED_COMPLETE_SCHEDULES) {
      return;
    }
    if (backtrackCalls > MAX_SOLVER_BACKTRACK_CALLS) {
      return;
    }

    // ענף 2: נסיון לשבץ את אחת מקבוצות הרישום של הקורס הנוכחי
    for (const section of currentCourse.availableSections) {
      if (validSchedules.length >= MAX_SOLVER_COLLECTED_COMPLETE_SCHEDULES) {
        break;
      }
      if (backtrackCalls > MAX_SOLVER_BACKTRACK_CALLS) {
        break;
      }
      if (isSectionValid(section, currentSections, preferences)) {
        currentSections.push(section); // הוספה למערכת הזמנית
        backtrack(courseIndex + 1, currentSections); // קריאה רקורסיבית
        currentSections.pop(); // Backtrack - הסרה והמשך נסיון לקבוצה הבאה
      }
    }
  }

  // הפעלת האלגוריתם
  backtrack(0, []);

  const n =
    Number.isFinite(maxResults) && maxResults >= 0
      ? Math.floor(maxResults)
      : DEFAULT_MAX_PLANNER_PROPOSALS;

  // מיון: ציון התאמה (גבוה → נמוך), ואם שווה — קודם פחות "חורים" בין שיעורים
  // באותו יום, ואז התחלה מוקדמת יותר של השיעור הראשון. אחרי זה מפתח יציב.
  validSchedules.sort((a, b) => {
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
    const ma = computeScheduleLayoutMetrics(a.sections);
    const mb = computeScheduleLayoutMetrics(b.sections);
    if (ma.totalInterLessonGapMinutes !== mb.totalInterLessonGapMinutes) {
      return ma.totalInterLessonGapMinutes - mb.totalInterLessonGapMinutes;
    }
    if (ma.earliestStartMinutes !== mb.earliestStartMinutes) {
      return ma.earliestStartMinutes - mb.earliestStartMinutes;
    }
    return scheduleTieKey(a).localeCompare(scheduleTieKey(b));
  });

  // Drop proposals that look identical on the calendar (e.g. two section IDs with same lesson times).
  const seenVisual = new Set<string>();
  const uniqueByVisualTimetable: schedule[] = [];
  for (const s of validSchedules) {
    const fp = lessonMultisetFingerprint(s.sections, sortedCourses);
    if (seenVisual.has(fp)) continue;
    seenVisual.add(fp);
    uniqueByVisualTimetable.push(s);
  }

  // עד maxResults הצעות — לא ממלאים בדמה אם יש פחות מערכות תקינות
  return {
    proposals: uniqueByVisualTimetable.slice(0, n),
  };
}
