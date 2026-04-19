import { Days } from "./courses";

/** Passed to `generateSchedules` (FR12). Times use planner UI strings: "Any" or "h:mm AM/PM". */
export interface StudentPreferences {
  blockedDays: Days[];
  startHour: string;
  endHour: string;
  /** Preferred lecturer display name per course ID (FR13 soft scoring). Omitted when catalog has no faculty. */
  preferredInstructorsByCourse?: Record<string, string>;
}
