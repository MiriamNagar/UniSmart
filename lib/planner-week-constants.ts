export const PLANNER_WEEK_TIME_SLOTS = [
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
] as const;

export const PLANNER_WEEK_DAYS = [
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
] as const;

export type PlannerWeekDayKey = (typeof PLANNER_WEEK_DAYS)[number];
