import type { SeatOpeningSignal } from "@/lib/enrollment-notification-logic";
import type { Course, CourseSection } from "@/types/courses";

/**
 * Whether a planner section should be treated as "full" for waitlist UI and seat-opening
 * transitions. When {@link CourseSection.remainingSeats} is present (from capacity − occupancy),
 * it wins over the {@link CourseSection.isFull} flag so stale flags cannot hide open seats.
 */
export function sectionAppearsFullForWaitlistUi(
  section: Pick<CourseSection, "remainingSeats" | "isFull">,
): boolean {
  if (
    typeof section.remainingSeats === "number" &&
    !Number.isNaN(section.remainingSeats)
  ) {
    return section.remainingSeats <= 0;
  }
  return section.isFull === true;
}

export type WaitlistSectionSnapshot = {
  sectionId: string;
  courseId: string;
  courseName: string;
  isFull: boolean;
  remainingSeats: number | null;
};

export type WaitlistSeatOpeningMatch = {
  sectionId: string;
  courseId: string;
  courseName: string;
  signal: SeatOpeningSignal;
};

export function collectWaitlistSectionSnapshots(
  courses: Course[],
): Map<string, WaitlistSectionSnapshot> {
  const snapshots = new Map<string, WaitlistSectionSnapshot>();
  for (const course of courses) {
    for (const section of course.availableSections) {
      snapshots.set(section.sectionID, {
        sectionId: section.sectionID,
        courseId: course.courseID,
        courseName: course.courseName,
        isFull: sectionAppearsFullForWaitlistUi(section),
        remainingSeats:
          typeof section.remainingSeats === "number" && !Number.isNaN(section.remainingSeats)
            ? Math.max(0, section.remainingSeats)
            : null,
      });
    }
  }
  return snapshots;
}

export function detectWaitlistSeatOpenings(input: {
  previousBySectionId: Map<string, WaitlistSectionSnapshot>;
  currentBySectionId: Map<string, WaitlistSectionSnapshot>;
  waitlistedSectionIds: Set<string>;
}): WaitlistSeatOpeningMatch[] {
  const matches: WaitlistSeatOpeningMatch[] = [];
  for (const sectionId of input.waitlistedSectionIds) {
    const previous = input.previousBySectionId.get(sectionId);
    const current = input.currentBySectionId.get(sectionId);
    if (!previous || !current) {
      continue;
    }
    if (!previous.isFull || current.isFull) {
      continue;
    }
    const previousRemaining = previous.remainingSeats;
    const currentRemaining = current.remainingSeats;
    matches.push({
      sectionId,
      courseId: current.courseId,
      courseName: current.courseName,
      signal: {
        previousRemaining,
        currentRemaining,
        remainingDelta:
          previousRemaining !== null && currentRemaining !== null
            ? currentRemaining - previousRemaining
            : null,
        shouldNotifyGenericEnrollment: true,
      },
    });
  }
  return matches;
}
