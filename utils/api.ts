/**
 * API service for communicating with the FastAPI backend.
 * 
 * This module handles all HTTP requests to the backend API, including
 * schedule generation and course retrieval. It abstracts away the
 * platform-specific URL handling and error management.
 * 
 * @module utils/api
 */

import { ScheduleRequest, ScheduleResponse } from "@/types/api";
import { Platform } from "react-native";

/**
 * Base URL for the backend API.
 * 
 * Platform-specific handling:
 * - Android emulator: Use 10.0.2.2 instead of localhost
 * - iOS simulator and web: localhost works
 * - Physical devices: Use your computer's IP address
 * 
 * Note: Update this to match your backend server's IP address.
 * For production, this should be configured via environment variables.
 */
const API_BASE_URL = Platform.OS === "android" 
  ? "http://192.168.1.249:8080" 
  : "http://192.168.1.249:8080";

/**
 * Generate schedules by calling the backend API.
 * 
 * Sends a POST request to the /generate-schedules endpoint with the
 * user's course selections and preferences. The backend uses constraint
 * programming to generate optimal schedule options.
 * 
 * @param {ScheduleRequest} request - The schedule generation request containing:
 *   - selected_course_ids: Array of course IDs to include
 *   - preferences: User preferences (times, day-off, instructors)
 *   - max_options: Maximum number of schedule options to return
 * 
 * @returns {Promise<ScheduleResponse>} Promise that resolves to the API response
 *   containing status and an array of schedule options with scores.
 * 
 * @throws {Error} Throws an error if:
 *   - Network request fails
 *   - Server returns non-2xx status code
 *   - Response cannot be parsed as JSON
 * 
 * @example
 * ```typescript
 * const request: ScheduleRequest = {
 *   selected_course_ids: ["CS101", "MATH101"],
 *   preferences: {
 *     preferred_start_time: "09:00",
 *     preferred_end_time: "17:00",
 *     day_off_requested: 5,
 *     course_preferences: []
 *   },
 *   max_options: 5
 * };
 * 
 * const response = await generateSchedules(request);
 * console.log(response.options); // Array of schedule options
 * ```
 */
export async function generateSchedules(
  request: ScheduleRequest
): Promise<ScheduleResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-schedules`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `API request failed with status ${response.status}`
      );
    }

    const data: ScheduleResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate schedules");
  }
}

