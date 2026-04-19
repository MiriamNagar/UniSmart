import type { Course, Lesson } from "@/types/courses";

function lessonSlotKey(lesson: Lesson): string {
  return `${lesson.day}|${lesson.startTime}|${lesson.endTime}|${lesson.type}`;
}

/**
 * Collects distinct lecturer names from every section of the course that has a lesson
 * matching the same calendar slot (day/time/type) as the scheduled lesson — so
 * alternative instructors for the same hour appear together.
 */
export function uniqueLecturersForLessonSlot(
  course: Course | undefined,
  scheduledLesson: Lesson,
): string[] {
  if (!course?.availableSections?.length) {
    const one = scheduledLesson.lecturer?.trim();
    return one ? [one] : [];
  }

  const target = lessonSlotKey(scheduledLesson);
  const seen = new Set<string>();
  const out: string[] = [];

  for (const section of course.availableSections) {
    for (const les of section.lessons) {
      if (lessonSlotKey(les) !== target) continue;
      const raw = les.lecturer?.trim();
      if (!raw) continue;
      const norm = raw.toLowerCase();
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(raw);
    }
  }

  if (out.length === 0) {
    const fallback = scheduledLesson.lecturer?.trim();
    return fallback ? [fallback] : [];
  }

  return out;
}

/** Short label for schedule blocks: lecture vs exercise/tutorial vs lab. */
export function lessonKindShortLabel(type: Lesson["type"]): string {
  switch (type) {
    case "Lecture":
      return "Lecture";
    case "Tutorial":
      return "Exercise";
    case "Lab":
      return "Lab";
    default:
      return type;
  }
}
