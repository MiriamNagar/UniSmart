# UniSmart Navigation Flow Diagram

```mermaid
flowchart TD
    Start([App Launch]) --> Splash[index.tsx<br/>Splash Screen]
    Splash --> AuthCheck{User Type?}
    
    AuthCheck -->|Student| StudentSession[student-session<br/>Check Session]
    AuthCheck -->|Admin| AdminSession[admin-session<br/>Check Session]
    AuthCheck -->|New User| Welcome[welcome<br/>Welcome Screen]
    
    Welcome --> NewMember[new-member<br/>Create Account]
    NewMember --> Onboarding
    
    StudentSession -->|Not Logged In| StudentLogin[student-login<br/>Login Form]
    StudentLogin -->|Success| StudentFlow
    
    AdminSession -->|Not Logged In| AdminLogin[admin-login<br/>Login Form]
    AdminLogin -->|Success| AdminDashboard[admin-dashboard<br/>Admin Dashboard]
    
    Onboarding --> IdentityHub[identity-hub<br/>Identity Setup]
    IdentityHub --> Department[department<br/>Select Department]
    Department --> AcademicLevel[academic-level<br/>Select Level]
    AcademicLevel --> SetupComplete[setup-complete<br/>Complete]
    SetupComplete --> StudentFlow
    
    StudentFlow --> Planner[planner<br/>Course Planner]
    StudentFlow --> Saved[saved<br/>Saved Schedules]
    StudentFlow --> Notes[notes<br/>Notes]
    StudentFlow --> Alerts[alerts<br/>Notifications]
    StudentFlow --> Account[account<br/>Profile]
    
    Planner --> CourseSelection[course-selection<br/>Select Courses]
    CourseSelection --> CustomRules[custom-rules<br/>Set Preferences]
    CustomRules --> GeneratedOptions[generated-options<br/>View Schedules]
    GeneratedOptions --> Saved
    
    Saved --> FolderContent[folder-content<br/>View Details]
    
    style Start fill:#5B4C9D,stroke:#fff,color:#fff
    style Splash fill:#B8B3E0,stroke:#5B4C9D
    style StudentFlow fill:#90EE90,stroke:#006400
    style AdminDashboard fill:#FFB6C1,stroke:#8B0000
    style Onboarding fill:#FFD700,stroke:#FF8C00
```

## Route Structure

```mermaid
graph TB
    Root[Root Layout<br/>_layout.tsx] --> Index[index.tsx]
    Root --> AuthGroup[(auth) Group]
    Root --> OnboardingGroup[(onboarding) Group]
    Root --> StudentGroup[(student) Group]
    Root --> AdminGroup[(admin) Group]
    Root --> Modal[modal.tsx]
    
    AuthGroup --> WelcomeRoute[welcome]
    AuthGroup --> StudentSessionRoute[student-session]
    AuthGroup --> StudentLoginRoute[student-login]
    AuthGroup --> AdminSessionRoute[admin-session]
    AuthGroup --> AdminLoginRoute[admin-login]
    AuthGroup --> NewMemberRoute[new-member]
    
    OnboardingGroup --> IdentityHubRoute[identity-hub]
    OnboardingGroup --> DepartmentRoute[department]
    OnboardingGroup --> AcademicLevelRoute[academic-level]
    OnboardingGroup --> SetupCompleteRoute[setup-complete]
    
    StudentGroup --> PlannerRoute[planner]
    StudentGroup --> SavedRoute[saved]
    StudentGroup --> NotesRoute[notes]
    StudentGroup --> AlertsRoute[alerts]
    StudentGroup --> AccountRoute[account]
    StudentGroup --> FolderContentRoute[folder-content]
    StudentGroup --> PlannerFlowGroup[(planner-flow) Group]
    
    PlannerFlowGroup --> CourseSelectionRoute[course-selection]
    PlannerFlowGroup --> CustomRulesRoute[custom-rules]
    PlannerFlowGroup --> GeneratedOptionsRoute[generated-options]
    
    AdminGroup --> AdminDashboardRoute[admin-dashboard]
    
    style Root fill:#5B4C9D,stroke:#fff,color:#fff
    style AuthGroup fill:#FF6B6B,stroke:#8B0000
    style OnboardingGroup fill:#FFD700,stroke:#FF8C00
    style StudentGroup fill:#90EE90,stroke:#006400
    style AdminGroup fill:#FFB6C1,stroke:#8B0000
    style PlannerFlowGroup fill:#87CEEB,stroke:#006400
```

## User Journey Flow

```mermaid
stateDiagram-v2
    [*] --> Splash: App Launch
    Splash --> AuthCheck: After 2s or tap
    
    AuthCheck --> Welcome: New User
    AuthCheck --> StudentSession: Returning Student
    AuthCheck --> AdminSession: Admin
    
    Welcome --> NewMember: Sign Up
    NewMember --> OnboardingFlow: Account Created
    
    state OnboardingFlow {
        [*] --> IdentityHub
        IdentityHub --> Department
        Department --> AcademicLevel
        AcademicLevel --> SetupComplete
        SetupComplete --> [*]
    }
    
    StudentSession --> StudentLogin: Not Authenticated
    StudentLogin --> StudentApp: Authenticated
    
    AdminSession --> AdminLogin: Not Authenticated
    AdminLogin --> AdminDashboard: Authenticated
    
    state StudentApp {
        [*] --> Planner
        Planner --> CourseSelection
        CourseSelection --> CustomRules
        CustomRules --> GeneratedOptions
        GeneratedOptions --> Saved
        Saved --> Notes
        Saved --> Alerts
        Saved --> Account
    }
    
    OnboardingFlow --> StudentApp: Setup Complete
    StudentApp --> [*]: Logout
    AdminDashboard --> [*]: Logout
```


