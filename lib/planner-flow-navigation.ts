import { ROUTES } from '@/constants/routes';
import { router, type Href } from 'expo-router';

/**
 * Navigate within the planner-flow stack without growing history (modal stack).
 */
export function plannerFlowPopOrReplace(href: Href): void {
	router.replace(href);
}

/**
 * Exit planner-flow and return to the main planner hub. Callers should still clear
 * `lastPlannerFlowRoute` via selection context when leaving the flow entirely.
 */
export function dismissPlannerFlowToPlannerHub(): void {
	router.dismissTo(ROUTES.STUDENT.PLANNER);
}
