/**
 * TypeScript interfaces matching the FastAPI backend API contract
 */

export interface Meeting {
  day: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  start: string; // "HH:MM" format
  end: string; // "HH:MM" format
}

export interface ScheduleItem {
  course_name: string;
  section_id: string;
  type: "Lecture" | "Recitation";
  instructor: string;
  meetings: Meeting[];
}

export interface ScheduleOption {
  score: number; // Percentage 0-100
  schedule: ScheduleItem[];
}

export interface ScheduleResponse {
  status: string;
  options: ScheduleOption[];
}

export interface CoursePreference {
  course_id: string;
  preferred_instructor_id: string;
}

export interface Preferences {
  preferred_start_time: string; // "HH:MM" format
  preferred_end_time: string; // "HH:MM" format
  day_off_requested?: number; // 0=Sunday, 5=Friday, null if not requested
  course_preferences: CoursePreference[];
}

export interface ScheduleRequest {
  selected_course_ids: string[];
  preferences: Preferences;
  max_options: number; // 1-20
}




