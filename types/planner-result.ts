import { CourseSection } from "./courses";

export interface schedule {
	id: string;
	sections: CourseSection[];
	fitScore: number; //(0-100)
	totalCredits: number;
}

export interface PlannerResult {
	proposals: schedule[];
}