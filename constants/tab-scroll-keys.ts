/** Stable keys for persisting vertical scroll offset when switching primary tabs. */
export const TAB_SCROLL_KEYS = {
  STUDENT_PLANNER: "student-tab-planner",
  STUDENT_SAVED: "student-tab-saved",
  STUDENT_NOTES: "student-tab-notes",
  STUDENT_ALERTS: "student-tab-alerts",
  STUDENT_ACCOUNT: "student-tab-account",
  studentFolder: (folderDisplayName: string) =>
    `student-tab-folder:${folderDisplayName}`,
  PLANNER_FLOW_COURSE_SELECTION: "student-pf-course-selection",
  PLANNER_FLOW_CUSTOM_RULES: "student-pf-custom-rules",
  PLANNER_FLOW_GENERATED_OPTIONS: "student-pf-generated-options",
  ADMIN_DASHBOARD: "admin-tab-dashboard",
} as const;
