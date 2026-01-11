export const ROUTES = {
  AUTH: {
    WELCOME: '/(auth)/welcome',
    STUDENT_SESSION: '/(auth)/student-session',
    STUDENT_LOGIN: '/(auth)/student-login',
    ADMIN_LOGIN: '/(auth)/admin-login',
    ADMIN_SESSION: '/(auth)/admin-session',
    NEW_MEMBER: '/(auth)/new-member',
  },
  ONBOARDING: {
    IDENTITY_HUB: '/(onboarding)/identity-hub',
    DEPARTMENT: '/(onboarding)/department',
    ACADEMIC_LEVEL: '/(onboarding)/academic-level',
    SETUP_COMPLETE: '/(onboarding)/setup-complete',
  },
  STUDENT: {
    PLANNER: '/(student)/planner',
    SAVED: '/(student)/saved',
    NOTES: '/(student)/notes',
    ALERTS: '/(student)/alerts',
    ACCOUNT: '/(student)/account',
    FOLDER_CONTENT: '/(student)/folder-content',
    PLANNER_FLOW: {
      COURSE_SELECTION: '/(student)/(planner-flow)/course-selection',
      CUSTOM_RULES: '/(student)/(planner-flow)/custom-rules',
      GENERATED_OPTIONS: '/(student)/(planner-flow)/generated-options',
    },
  },
  ADMIN: {
    DASHBOARD: '/(admin)/admin-dashboard',
  },
} as const;

