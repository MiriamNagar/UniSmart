/**
 * Transform API response format to frontend display format.
 * 
 * This module converts the backend API's schedule response format into
 * a format optimized for frontend display. The transformation includes:
 * - Grouping meetings by day of week
 * - Extracting course codes from section IDs
 * - Formatting times for display
 * - Adding display-friendly metadata
 * 
 * @module utils/schedule-transformer
 */

import { ScheduleOption, ScheduleItem } from "@/types/api";

interface FrontendCourse {
  courseCode: string;
  courseName: string;
  instructor: string;
  location: string; // Will be empty for now
  time: string; // "09:00-11:00"
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  type?: "Lecture" | "Recitation"; // Optional for display
}

interface FrontendSchedule {
  SUN: FrontendCourse[];
  MON: FrontendCourse[];
  TUE: FrontendCourse[];
  WED: FrontendCourse[];
  THU: FrontendCourse[];
  FRI: FrontendCourse[];
}

interface FrontendProposal {
  id: number;
  fitScore: number; // Percentage
  schedule: FrontendSchedule;
}

const DAY_NUMBER_TO_NAME: Record<number, keyof FrontendSchedule> = {
  0: "SUN",
  1: "MON",
  2: "TUE",
  3: "WED",
  4: "THU",
  5: "FRI",
  6: "SAT", // Not used in frontend, but handle it
};

/**
 * Extract course code from section ID.
 * 
 * Attempts to extract a short course code (e.g., "CS101") from a section ID
 * (e.g., "intro_l1") using known prefix patterns. Falls back to extracting
 * from course name if pattern matching fails.
 * 
 * @param {string} sectionId - Section identifier (e.g., "intro_l1", "calc1_t2")
 * @param {string} courseName - Full course name as fallback
 * 
 * @returns {string} Short course code (e.g., "CS101", "MATH101")
 * 
 * @private
 * 
 * @example
 * ```typescript
 * extractCourseCode("intro_l1", "Introduction to Computer Science") // "CS101"
 * extractCourseCode("calc1_t2", "Infinitesimal Calculus 1")          // "MATH101"
 * ```
 */
function extractCourseCode(sectionId: string, courseName: string): string {
  // Try to extract from section_id patterns
  // For now, return a shortened version or use course name
  // This could be enhanced with a mapping if needed
  
  // Map known section prefixes to course codes
  const sectionPrefixMap: Record<string, string> = {
    "intro": "CS101",
    "calc1": "MATH101",
    "algo1": "MATH102",
    "logic": "MATH103",
    "digi": "CS102",
  };

  const prefix = sectionId.split("_")[0];
  if (sectionPrefixMap[prefix]) {
    return sectionPrefixMap[prefix];
  }

  // Fallback: use first part of course name or section_id
  return courseName.split(" ")[0].toUpperCase();
}

/**
 * Transform a single API schedule option to frontend display format.
 * 
 * Converts one schedule option from the backend API format into a format
 * optimized for frontend rendering. Groups meetings by day, extracts course
 * codes, and formats all data for display.
 * 
 * @param {ScheduleOption} apiOption - Schedule option from API response
 * @param {number} index - Zero-based index of this option (used for ID generation)
 * 
 * @returns {FrontendProposal} Transformed schedule option with:
 *   - id: Sequential ID (index + 1)
 *   - fitScore: Score percentage (0-100)
 *   - schedule: Object with day keys (SUN, MON, TUE, etc.) containing arrays of courses
 * 
 * @example
 * ```typescript
 * const apiOption = {
 *   score: 85,
 *   schedule: [/* schedule items *\/]
 * };
 * const frontendOption = transformScheduleOption(apiOption, 0);
 * // Returns: { id: 1, fitScore: 85, schedule: { SUN: [...], MON: [...], ... } }
 * ```
 */
export function transformScheduleOption(
  apiOption: ScheduleOption,
  index: number
): FrontendProposal {
  const schedule: FrontendSchedule = {
    SUN: [],
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
  };

  // Group schedule items by day
  apiOption.schedule.forEach((item: ScheduleItem) => {
    const courseCode = extractCourseCode(item.section_id, item.course_name);

    item.meetings.forEach((meeting) => {
      const dayName = DAY_NUMBER_TO_NAME[meeting.day];
      if (!dayName || dayName === "SAT") {
        // Skip Saturday for now (not in frontend format)
        return;
      }

      const course: FrontendCourse = {
        courseCode,
        courseName: item.course_name.length > 20 
          ? item.course_name.substring(0, 17) + "..." 
          : item.course_name,
        instructor: item.instructor,
        location: "HALL A", // Placeholder - could be enhanced
        time: `${meeting.start}-${meeting.end}`,
        startTime: meeting.start,
        endTime: meeting.end,
        type: item.type,
      };

      schedule[dayName].push(course);
    });
  });

  return {
    id: index + 1,
    fitScore: apiOption.score,
    schedule,
  };
}

/**
 * Transform full API response to frontend proposals array.
 * 
 * Converts the complete API response into an array of frontend-friendly
 * schedule proposals. Handles error cases and empty responses gracefully.
 * 
 * @param {{status: string, options: ScheduleOption[]}} response - Complete API response
 * 
 * @returns {FrontendProposal[]} Array of transformed schedule proposals.
 *   Returns empty array if status is not "success" or options are missing.
 * 
 * @example
 * ```typescript
 * const apiResponse = {
 *   status: "success",
 *   options: [/* schedule options *\/]
 * };
 * const proposals = transformScheduleResponse(apiResponse);
 * // Returns array of FrontendProposal objects ready for display
 * ```
 */
export function transformScheduleResponse(
  response: { status: string; options: ScheduleOption[] }
): FrontendProposal[] {
  if (response.status !== "success" || !response.options) {
    return [];
  }

  return response.options.map((option, index) =>
    transformScheduleOption(option, index)
  );
}




