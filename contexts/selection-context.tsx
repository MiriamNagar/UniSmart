/**
 * Selection Context for UniSmart Application.
 * 
 * This module provides a React Context for managing global application state
 * including course selections, user preferences, saved plans, alerts, and user
 * information. The context is used throughout the application to share state
 * between components without prop drilling.
 * 
 * @module contexts/selection-context
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Represents a saved schedule plan.
 * 
 * @interface SavedPlan
 */
interface SavedPlan {
  /** Unique identifier for the saved plan */
  id: string;
  /** Date when the plan was saved (ISO format string) */
  date: string;
  /** Fit score percentage (0-100) for this plan */
  fitScore: number;
  /** Schedule organized by day of week */
  schedule: {
    SUN: any[];
    MON: any[];
    TUE: any[];
    WED: any[];
    THU: any[];
    FRI: any[];
  };
}

/**
 * Represents a user alert/notification.
 * 
 * @interface Alert
 */
interface Alert {
  /** Unique identifier for the alert */
  id: string;
  /** Alert title/heading */
  title: string;
  /** Alert message content */
  message: string;
  /** Whether the alert has been read by the user */
  isRead: boolean;
}

/**
 * User profile information.
 * 
 * @interface UserInfo
 */
interface UserInfo {
  /** User's full name */
  fullName: string;
  /** User's age */
  age: string;
  /** User's faculty/department */
  faculty: string;
  /** User's major/field of study */
  major: string;
  /** Academic level (e.g., "Freshman", "Sophomore") */
  academicLevel: string;
  /** User type: 'student' or 'admin' */
  userType?: 'student' | 'admin';
}

/**
 * Selection Context Type Definition.
 * 
 * Defines all state and setter functions available through the SelectionContext.
 * 
 * @interface SelectionContextType
 */
interface SelectionContextType {
  selectedCourses: Set<string>;
  setSelectedCourses: (courses: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  selectedDays: Set<string>;
  setSelectedDays: (days: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  startHour: string;
  setStartHour: (hour: string) => void;
  endHour: string;
  setEndHour: (hour: string) => void;
  selectedSemester: string;
  setSelectedSemester: (semester: string) => void;
  savedPlans: SavedPlan[];
  setSavedPlans: (plans: SavedPlan[] | ((prev: SavedPlan[]) => SavedPlan[])) => void;
  customFolders: string[];
  setCustomFolders: (folders: string[] | ((prev: string[]) => string[])) => void;
  alerts: Alert[];
  setAlerts: (alerts: Alert[] | ((prev: Alert[]) => Alert[])) => void;
  userInfo: UserInfo;
  setUserInfo: (info: UserInfo) => void;
  lastPlannerFlowRoute: string | null;
  setLastPlannerFlowRoute: (route: string | null) => void;
}

/** React Context for selection state management */
const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

/**
 * Selection Context Provider Component.
 * 
 * Provides selection state to all child components. Manages:
 * - Course selections
 * - Time preferences
 * - Day-off preferences
 * - Semester selection
 * - Saved plans
 * - Custom folders
 * - User alerts
 * - User information
 * - Navigation state
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to the context
 * 
 * @returns {JSX.Element} Context provider wrapping children
 * 
 * @example
 * ```tsx
 * <SelectionProvider>
 *   <App />
 * </SelectionProvider>
 * ```
 */
export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedCourses, setSelectedCoursesState] = useState<Set<string>>(new Set());
  const [selectedDays, setSelectedDaysState] = useState<Set<string>>(new Set());
  const [startHour, setStartHour] = useState('Any');
  const [endHour, setEndHour] = useState('Any');
  const [selectedSemester, setSelectedSemester] = useState('Sem 1');
  const [savedPlans, setSavedPlansState] = useState<SavedPlan[]>([]);
  const [customFolders, setCustomFoldersState] = useState<string[]>([]);
  const [alerts, setAlertsState] = useState<Alert[]>([
    {
      id: '1',
      title: 'REGISTRATION OPEN',
      message: 'Enrollment for Semester 2 is now officially open for Engineering students.',
      isRead: false,
    },
    {
      id: '2',
      title: 'SCHEDULE CONFLICT',
      message: 'Your current draft for ENG205 has a professor update. Review your preferences.',
      isRead: false,
    },
  ]);
  const [userInfo, setUserInfoState] = useState<UserInfo>({
    fullName: '',
    age: '',
    faculty: '',
    major: '',
    academicLevel: '',
    userType: undefined,
  });
  const [lastPlannerFlowRoute, setLastPlannerFlowRoute] = useState<string | null>(null);

  const setUserInfo = (info: UserInfo) => {
    setUserInfoState(info);
  };

  const setAlerts = (alerts: Alert[] | ((prev: Alert[]) => Alert[])) => {
    if (typeof alerts === 'function') {
      setAlertsState(alerts);
    } else {
      setAlertsState(alerts);
    }
  };

  const setCustomFolders = (
    folders: string[] | ((prev: string[]) => string[])
  ) => {
    if (typeof folders === 'function') {
      setCustomFoldersState(folders);
    } else {
      setCustomFoldersState(folders);
    }
  };

  const setSavedPlans = (
    plans: SavedPlan[] | ((prev: SavedPlan[]) => SavedPlan[])
  ) => {
    if (typeof plans === 'function') {
      setSavedPlansState(plans);
    } else {
      setSavedPlansState(plans);
    }
  };

  const setSelectedCourses = (courses: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof courses === 'function') {
      setSelectedCoursesState((prev) => new Set(courses(prev)));
    } else {
      setSelectedCoursesState(new Set(courses));
    }
  };

  const setSelectedDays = (days: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    if (typeof days === 'function') {
      setSelectedDaysState((prev) => new Set(days(prev)));
    } else {
      setSelectedDaysState(new Set(days));
    }
  };

  return (
    <SelectionContext.Provider
      value={{
        selectedCourses,
        setSelectedCourses,
        selectedDays,
        setSelectedDays,
        startHour,
        setStartHour,
        endHour,
        setEndHour,
        selectedSemester,
        setSelectedSemester,
        savedPlans,
        setSavedPlans,
        customFolders,
        setCustomFolders,
      alerts,
      setAlerts,
      userInfo,
      setUserInfo,
      lastPlannerFlowRoute,
      setLastPlannerFlowRoute,
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

/**
 * Custom hook to access selection context.
 * 
 * Provides access to all selection state and setter functions. Must be used
 * within a SelectionProvider component.
 * 
 * @returns {SelectionContextType} The selection context value containing all state and setters
 * 
 * @throws {Error} Throws error if used outside of SelectionProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { selectedCourses, setSelectedCourses } = useSelection();
 *   // Use context values...
 * }
 * ```
 */
export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}

