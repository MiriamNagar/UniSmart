import type { Course } from "@/types/courses";

/**
 * Find a course in a planner-scoped list by the ID stored in selection state.
 * Trims whitespace so modal / Set values stay aligned with catalog rows.
 */
export function findPlannerCourseById(
  courses: Course[],
  selectedCourseId: string,
): Course | undefined {
  const id = selectedCourseId.trim();
  if (!id) return undefined;
  return (
    courses.find((c) => c.courseID === id) ??
    courses.find((c) => c.courseID.trim() === id)
  );
}

/** Distinct lecturers for one selected course ID, or [] if the course is not in the list. */
export function collectDistinctLecturersForCourseId(
  courses: Course[],
  selectedCourseId: string,
): string[] {
  const course = findPlannerCourseById(courses, selectedCourseId);
  return course ? collectDistinctLecturersFromCourse(course) : [];
}

/**
 * Unique lecturer names listed on any section of a course (catalog / mock).
 * Order is first-seen; empty or whitespace-only labels are skipped.
 */
export function collectDistinctLecturersFromCourse(course: Course): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const section of course.availableSections) {
    for (const lesson of section.lessons) {
      const raw = lesson.lecturer?.trim() ?? "";
      if (!raw) continue;
      const key = raw.toLowerCase().replace(/\s+/g, " ");
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(raw);
    }
  }
  return out;
}
