import React, { createContext, ReactNode, useContext, useState } from 'react';

import { BGU_DEGREE_YEAR_OPTIONS } from '@/lib/planner-active-term';

interface SavedPlan {
  id: string;
  date: string;
  fitScore: number;
  schedule: {
    SUN: any[];
    MON: any[];
    TUE: any[];
    WED: any[];
    THU: any[];
    FRI: any[];
  };
}

interface Alert {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
}

interface UserInfo {
  fullName: string;
  age: string;
  faculty: string;
  major: string;
  academicLevel: string;
  userType?: 'student' | 'admin';
}

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
  /** BGU catalog degree year (Hebrew letter א–ד). Drives catalog filtering with `selectedSemester`. */
  activeDegreeYear: string;
  setActiveDegreeYear: (year: string) => void;
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
  professorPreferences: Map<string, string>;
  setProfessorPreferences: (prefs: Map<string, string> | ((prev: Map<string, string>) => Map<string, string>)) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedCourses, setSelectedCoursesState] = useState<Set<string>>(new Set());
  const [selectedDays, setSelectedDaysState] = useState<Set<string>>(new Set());
  const [startHour, setStartHour] = useState('Any');
  const [endHour, setEndHour] = useState('Any');
  const [selectedSemester, setSelectedSemester] = useState('Sem 1');
  const [activeDegreeYear, setActiveDegreeYearState] = useState<(typeof BGU_DEGREE_YEAR_OPTIONS)[number]>(
    'א',
  );

  const setActiveDegreeYear = (year: string) => {
    if (!(BGU_DEGREE_YEAR_OPTIONS as readonly string[]).includes(year)) return;
    setActiveDegreeYearState(year as (typeof BGU_DEGREE_YEAR_OPTIONS)[number]);
  };
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
  const [professorPreferences, setProfessorPreferencesState] = useState<Map<string, string>>(new Map());

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

  const setProfessorPreferences = (
    prefs: Map<string, string> | ((prev: Map<string, string>) => Map<string, string>)
  ) => {
    if (typeof prefs === 'function') {
      setProfessorPreferencesState((prev) => new Map(prefs(prev)));
    } else {
      setProfessorPreferencesState(new Map(prefs));
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
        activeDegreeYear,
        setActiveDegreeYear,
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
      professorPreferences,
      setProfessorPreferences,
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}

