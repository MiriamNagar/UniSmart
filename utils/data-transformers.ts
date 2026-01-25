/**
 * Utility functions to transform frontend data format to/from API format.
 * 
 * This module provides conversion functions between the frontend's user-friendly
 * format (12-hour time, day names) and the backend API's format (24-hour time,
 * day numbers). These transformations ensure data compatibility between the
 * React Native frontend and the FastAPI backend.
 * 
 * @module utils/data-transformers
 */

import { ScheduleRequest, Preferences } from "@/types/api";

/**
 * Convert 12-hour time format ("9:00 AM") to 24-hour format ("09:00").
 * 
 * Converts user-friendly 12-hour time strings with AM/PM to 24-hour format
 * required by the backend API. Handles edge cases like "12:00 AM" (midnight)
 * and "12:00 PM" (noon).
 * 
 * @param {string} timeStr - Time string in 12-hour format (e.g., "9:00 AM", "6:00 PM")
 *   Special case: "Any" returns "00:00" as default
 * 
 * @returns {string} Time string in 24-hour format (e.g., "09:00", "18:00")
 *   Returns "00:00" if input is "Any" or cannot be parsed
 * 
 * @example
 * ```typescript
 * convertTimeTo24Hour("9:00 AM")  // "09:00"
 * convertTimeTo24Hour("6:00 PM")  // "18:00"
 * convertTimeTo24Hour("12:00 AM") // "00:00"
 * convertTimeTo24Hour("12:00 PM") // "12:00"
 * convertTimeTo24Hour("Any")       // "00:00"
 * ```
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
 * Convert end time, handling "Any" as end of day.
 * 
 * Similar to convertTimeTo24Hour, but treats "Any" as "23:59" (end of day)
 * instead of "00:00". This is used for preferred end time preferences.
 * 
 * @param {string} timeStr - Time string in 12-hour format or "Any"
 * 
 * @returns {string} Time string in 24-hour format.
 *   Returns "23:59" if input is "Any", otherwise same as convertTimeTo24Hour
 * 
 * @example
 * ```typescript
 * convertEndTimeTo24Hour("6:00 PM") // "18:00"
 * convertEndTimeTo24Hour("Any")      // "23:59"
 * ```
 */
export function convertEndTimeTo24Hour(timeStr: string): string {
  if (timeStr === "Any") {
    return "23:59"; // End of day
  }
  return convertTimeTo24Hour(timeStr);
}

/**
 * Mapping from frontend day names to backend day numbers.
 * 
 * Frontend uses abbreviated day names (MON, TUE, etc.) while backend uses
 * integers (0=Sunday, 1=Monday, ..., 6=Saturday).
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
 * Convert frontend selected days to backend day_off_requested format.
 * 
 * Converts a set of selected day names to a single day number for the
 * backend API. Currently uses the first selected day if multiple are selected.
 * 
 * @param {Set<string>} selectedDays - Set of day name strings (e.g., "MON", "FRI")
 * 
 * @returns {number | undefined} Day number (0-6) for backend, or undefined if no days selected.
 *   0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 * 
 * @example
 * ```typescript
 * convertSelectedDaysToDayOff(new Set(["FRI"]))     // 5
 * convertSelectedDaysToDayOff(new Set(["MON", "FRI"])) // 1 (uses first)
 * convertSelectedDaysToDayOff(new Set())            // undefined
 * ```
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
 * Map frontend semester string to backend semester code.
 * 
 * Converts user-friendly semester names to backend semester codes.
 * Currently only handles "Sem 1" -> "A", but can be extended for other semesters.
 * 
 * @param {string} semester - Frontend semester string (e.g., "Sem 1", "Sem 2")
 * 
 * @returns {string} Backend semester code (e.g., "A", "B")
 *   Defaults to "A" if no mapping exists
 * 
 * @example
 * ```typescript
 * mapSemesterToBackend("Sem 1") // "A"
 * mapSemesterToBackend("Sem 2") // "A" (default, can be extended)
 * ```
 */
export function mapSemesterToBackend(semester: string): string {
  if (semester === "Sem 1") {
    return "A";
  }
  // Add more mappings if needed
  return "A"; // Default
}

/**
 * Create API request object from frontend selection context.
 * 
 * Combines all user selections and preferences into a properly formatted
 * ScheduleRequest object that can be sent to the backend API. Handles all
 * necessary format conversions (time, days, etc.).
 * 
 * @param {string[]} selectedCourseIds - Array of course IDs selected by user
 * @param {string} startHour - Preferred start time in 12-hour format (e.g., "9:00 AM")
 * @param {string} endHour - Preferred end time in 12-hour format (e.g., "6:00 PM")
 * @param {Set<string>} selectedDays - Set of day names to avoid (e.g., Set(["FRI"]))
 * @param {Array<{course_id: string, preferred_instructor_id: string}>} coursePreferences - 
 *   Optional array of instructor preferences per course. Defaults to empty array.
 * 
 * @returns {ScheduleRequest} Fully formatted request object ready for API call
 * 
 * @example
 * ```typescript
 * const request = createScheduleRequest(
 *   ["CS101", "MATH101"],
 *   "9:00 AM",
 *   "6:00 PM",
 *   new Set(["FRI"]),
 *   [{ course_id: "CS101", preferred_instructor_id: "inst-1" }]
 * );
 * // Returns ScheduleRequest with all fields properly formatted
 * ```
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




