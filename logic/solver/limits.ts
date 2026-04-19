/**
 * Planner solver limits — single documented constants shared by the engine and UI.
 *
 * - Result cap (N): max distinct complete schedules returned from `generateSchedules`.
 * - Work caps: stop search before enumerating every feasible completion (see engine).
 */

/** Default and canonical max number of distinct complete schedules exposed to the UI. */
export const DEFAULT_MAX_PLANNER_PROPOSALS = 5;

/**
 * Hard cap on how many *complete* valid schedules the backtracker may collect before
 * stopping. Sorting and slicing to `maxResults` happen after collection; this bounds work.
 */
export const MAX_SOLVER_COLLECTED_COMPLETE_SCHEDULES = 2000;

/**
 * Hard cap on backtrack invocations (recursive expansions). Acts as a second stop rule
 * so pathological inputs cannot burn CPU indefinitely even if completions are sparse.
 */
export const MAX_SOLVER_BACKTRACK_CALLS = 100_000;
