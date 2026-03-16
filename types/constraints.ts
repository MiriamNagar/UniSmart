import { Days } from './courses';

export interface StudentPreferences {
	blockedDays: Days[];
	startHour: string; // Format: "HH:MM" or "Any"
	endHour: string;   // Format: "HH:MM" or "Any"
}