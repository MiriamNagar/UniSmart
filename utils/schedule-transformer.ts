/**
 * Transform API response format to frontend display format
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
 * Extract course code from section_id
 * Examples: "intro_l1" -> "CS101", "calc1_t2" -> "MATH101"
 * For now, we'll try to map from known patterns or use the first part
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
 * Transform API schedule option to frontend format
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
 * Transform full API response to frontend proposals array
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




