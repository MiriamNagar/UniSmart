/**
 * TypeScript interfaces matching the FastAPI backend API contract.
 * 
 * This module defines all TypeScript types that correspond to the backend
 * Pydantic models. These types ensure type safety when communicating with
 * the FastAPI backend and provide IntelliSense support in the frontend.
 * 
 * All types match the backend models defined in backend/models.py.
 * 
 * @module types/api
 */

/**
 * Represents a single meeting time slot for a course section.
 * 
 * @interface Meeting
 */
export interface Meeting {
  /** Day of week as integer: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday */
  day: number;
  /** Start time in 24-hour format: "HH:MM" (e.g., "09:00", "17:30") */
  start: string;
  /** End time in 24-hour format: "HH:MM" (e.g., "11:00", "19:00") */
  end: string;
}

/**
 * Represents a single course section in a schedule.
 * 
 * @interface ScheduleItem
 */
export interface ScheduleItem {
  /** Full name of the course (e.g., "Introduction to Computer Science") */
  course_name: string;
  /** Unique identifier for the section (e.g., "intro_l1") */
  section_id: string;
  /** Type of section: "Lecture" for main lectures, "Recitation" for tutorials */
  type: "Lecture" | "Recitation";
  /** Full name of the instructor (e.g., "Prof. Ben-Moshe Boaz") */
  instructor: string;
  /** Array of meeting times for this section */
  meetings: Meeting[];
}

/**
 * Represents a complete schedule option with fit score.
 * 
 * @interface ScheduleOption
 */
export interface ScheduleOption {
  /** Fit score as percentage (0-100). Higher indicates better match to preferences. */
  score: number;
  /** Array of all course sections in this schedule */
  schedule: ScheduleItem[];
}

/**
 * Complete API response from schedule generation endpoint.
 * 
 * @interface ScheduleResponse
 */
export interface ScheduleResponse {
  /** Status of the request. "success" for successful requests. */
  status: string;
  /** Array of generated schedule options, sorted by score (best first) */
  options: ScheduleOption[];
}

/**
 * Instructor preference for a specific course.
 * 
 * @interface CoursePreference
 */
export interface CoursePreference {
  /** Course ID (e.g., "CS101") */
  course_id: string;
  /** Preferred instructor ID (e.g., "inst-1") */
  preferred_instructor_id: string;
}

/**
 * User preferences for schedule generation.
 * 
 * @interface Preferences
 */
export interface Preferences {
  /** Preferred earliest start time in 24-hour format: "HH:MM" */
  preferred_start_time: string;
  /** Preferred latest end time in 24-hour format: "HH:MM" */
  preferred_end_time: string;
  /** Optional day to avoid classes: 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday */
  day_off_requested?: number;
  /** Array of per-course instructor preferences */
  course_preferences: CoursePreference[];
}

/**
 * Complete request object for schedule generation.
 * 
 * @interface ScheduleRequest
 */
export interface ScheduleRequest {
  /** Array of course IDs to include in the schedule */
  selected_course_ids: string[];
  /** User preferences for schedule optimization */
  preferences: Preferences;
  /** Maximum number of schedule options to return (1-20) */
  max_options: number;
}




