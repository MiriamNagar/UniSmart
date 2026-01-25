/**
 * Utility functions to transform frontend data format to/from API format
 */

import { ScheduleRequest, Preferences } from "@/types/api";

/**
 * Convert 12-hour time format ("9:00 AM") to 24-hour format ("09:00")
 */
export function convertTimeTo24Hour(timeStr: string): string {
  if (timeStr === "Any") {
    return "00:00"; // Default for start
  }

  // Parse "9:00 AM" or "6:00 PM"
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) {
    return "00:00"; // Default fallback
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();

  if (ampm === "PM" && hours !== 12) {
    hours += 12;
  } else if (ampm === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

/**
 * Convert end time ("Any" means end of day)
 */
export function convertEndTimeTo24Hour(timeStr: string): string {
  if (timeStr === "Any") {
    return "23:59"; // End of day
  }
  return convertTimeTo24Hour(timeStr);
}

/**
 * Map frontend day names to backend day numbers
 * Frontend: "MON", "TUE", "WED", "THU", "FRI", "SAT"
 * Backend: 1, 2, 3, 4, 5, 6 (Monday=1, Sunday=0)
 */
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  "MON": 1,
  "TUE": 2,
  "WED": 3,
  "THU": 4,
  "FRI": 5,
  "SAT": 6,
  "SUN": 0,
};

/**
 * Convert frontend selected days to day_off_requested
 * If multiple days selected, use the first one (or could be enhanced)
 */
export function convertSelectedDaysToDayOff(
  selectedDays: Set<string>
): number | undefined {
  if (selectedDays.size === 0) {
    return undefined;
  }
  // For now, use the first selected day
  // In the future, could handle multiple days differently
  const firstDay = Array.from(selectedDays)[0];
  return DAY_NAME_TO_NUMBER[firstDay];
}

/**
 * Map semester string to backend semester
 * "Sem 1" -> "A", "Sem 2" -> "B" (if needed)
 */
export function mapSemesterToBackend(semester: string): string {
  if (semester === "Sem 1") {
    return "A";
  }
  // Add more mappings if needed
  return "A"; // Default
}

/**
 * Create API request from frontend selection context
 */
export function createScheduleRequest(
  selectedCourseIds: string[],
  startHour: string,
  endHour: string,
  selectedDays: Set<string>,
  coursePreferences: Array<{ course_id: string; preferred_instructor_id: string }> = []
): ScheduleRequest {
  const preferences: Preferences = {
    preferred_start_time: convertTimeTo24Hour(startHour),
    preferred_end_time: convertEndTimeTo24Hour(endHour),
    day_off_requested: convertSelectedDaysToDayOff(selectedDays),
    course_preferences: coursePreferences,
  };

  return {
    selected_course_ids: selectedCourseIds,
    preferences,
    max_options: 5, // Default, could be configurable
  };
}




