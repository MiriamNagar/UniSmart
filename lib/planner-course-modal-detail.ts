import type { PlannerWeekDayKey } from "@/lib/planner-week-constants";
import {
  catalogCourseForSavedCell,
  hydrateSavedCellDisplayFromCatalog,
} from "@/lib/saved-schedule-catalog-hydrate";
import type { Course } from "@/types/courses";

/** Minimal cell shape for saved Firestore schedules and shared week grid. */
export type PlannerWeekCellLike = {
  courseCode?: string;
  courseName?: string;
  shortDescription?: string;
  lessonKindLabel?: string;
  instructor?: string;
  instructorsLine?: string;
  location?: string;
  time?: string;
  startTime: string;
  endTime: string;
  prerequisiteNames?: string[];
  prerequisiteAdvisoryNote?: string | null;
};

export type PlannerCourseDetailPayload = {
  courseCode: string;
  courseName: string;
  shortDescription?: string;
  lessonKindLabel: string;
  instructorsLine: string;
  location: string;
  time: string;
  calendarDay: string;
  prerequisiteNames: string[];
  prerequisiteAdvisoryNote: string | null;
  prerequisiteParentMissing: boolean;
};

export function buildSavedScheduleModalDetail(
  cell: PlannerWeekCellLike,
  day: PlannerWeekDayKey,
  catalogCourses: Course[],
): PlannerCourseDetailPayload {
  const hydrated = hydrateSavedCellDisplayFromCatalog(cell, catalogCourses);
  const catalogCourse = catalogCourseForSavedCell(cell, catalogCourses);
  const code = (cell.courseCode ?? "").trim();
  const prerequisiteParentMissing =
    !catalogCourse && code !== "" && code !== "??";

  const prereqFromCell = cell.prerequisiteNames;
  const prerequisiteNames =
    Array.isArray(prereqFromCell) && prereqFromCell.length > 0
      ? prereqFromCell
      : catalogCourse?.prerequisiteNames ?? [];

  return {
    courseCode: cell.courseCode ?? "??",
    courseName: hydrated.courseName,
    shortDescription: hydrated.shortDescription,
    lessonKindLabel: cell.lessonKindLabel ?? "—",
    instructorsLine: cell.instructorsLine ?? cell.instructor ?? "—",
    location: cell.location ?? "—",
    time: cell.time ?? `${cell.startTime}-${cell.endTime}`,
    calendarDay: day,
    prerequisiteNames,
    prerequisiteAdvisoryNote: cell.prerequisiteAdvisoryNote ?? null,
    prerequisiteParentMissing,
  };
}

/** Generated-options cells already carry catalog fields; map to modal payload. */
export function plannerModalDetailFromGenerated(cell: {
  courseCode: string;
  courseName: string;
  shortDescription?: string;
  lessonKindLabel: string;
  instructorsLine: string;
  location: string;
  time: string;
  calendarDay: string;
  prerequisiteNames: string[];
  prerequisiteAdvisoryNote: string | null;
  prerequisiteParentMissing?: boolean;
}): PlannerCourseDetailPayload {
  return {
    courseCode: cell.courseCode,
    courseName: cell.courseName,
    shortDescription: cell.shortDescription,
    lessonKindLabel: cell.lessonKindLabel,
    instructorsLine: cell.instructorsLine,
    location: cell.location,
    time: cell.time,
    calendarDay: cell.calendarDay,
    prerequisiteNames: cell.prerequisiteNames ?? [],
    prerequisiteAdvisoryNote: cell.prerequisiteAdvisoryNote,
    prerequisiteParentMissing: cell.prerequisiteParentMissing ?? false,
  };
}
