export enum Days {
	Sun = 'Sun',
	Mon = 'Mon',
	Tue = 'Tue',
	Wed = 'Wed',
	Thu = 'Thu',
	Fri = 'Fri',
}

//There are 2 types of information here: 1. necessery info for the algorithm, 2. additional info for the user (like lecturer name, location, etc.). The algorithm only needs the first type, but we want to keep the second type for display purposes. marked as ADD for "Additional Data".

export interface Lesson { // A single lesson within a course section - could be a lecture, tutorial, or lab
	day: Days;
	lecturer: string; // ADD
	location: string; // ADD
	type: 'Lecture' | 'Tutorial' | 'Lab'; // ADD
	startTime: string; // Format: "HH:MM"
	endTime: string;   // Format: "HH:MM"
}

export interface CourseSection { // A specific section of a course: A course can have multiple sections, each with its own schedule and lecturer
	sectionID: string;
	lessons: Lesson[];
}

export interface Course {
	courseID: string;
	courseName: string; // ADD
	isMandatory: boolean;
	credits: number;
	semester: 'A' | 'B' | 'summer'; // ADD
	/** BGU catalog degree year (Hebrew letter: א–ד). Present for catalog-derived courses. */
	degreeCatalogYear?: string;
	availableSections: CourseSection[];
	/** Catalog prerequisite course names (same language as in the catalog). Shown in planner detail UI; selection is not blocked when unmet. */
	prerequisiteNames?: string[];
}

