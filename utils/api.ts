/**
 * API service for communicating with the FastAPI backend
 */

import { ScheduleRequest, ScheduleResponse } from "@/types/api";
import { Platform } from "react-native";

// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator and web, localhost works
// For physical devices, use your computer's IP address
const API_BASE_URL = Platform.OS === "android" 
  ? "http://192.168.1.249:8080" 
  : "http://192.168.1.249:8080";

/**
 * Generate schedules by calling the backend API
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

