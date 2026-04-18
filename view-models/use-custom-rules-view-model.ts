import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePlannerCatalog } from "@/contexts/bgu-planner-catalog-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import { buildConstraintSummary } from "@/lib/planner-constraint-summary";
import {
  evaluateRunOptimizerPress,
  getRunOptimizerCtaState,
} from "@/lib/planner-optimizer-cta";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import {
  catalogLetterForDegreeTier,
  filterCoursesForPlannerTerm,
} from "@/lib/planner-active-term";
import {
  collectDistinctLecturersForCourseId,
  collectDistinctLecturersFromCourse,
  findPlannerCourseById,
} from "@/lib/planner-instructor-options";
import { validatePlannerAvailabilityPreferences } from "@/logic/solver";
import { Days } from "@/types/courses";

/** Resolve Map keys after trim so modal state stays aligned with legacy spacing in keys. */
function getInstructorPreferenceForCourse(
  map: Map<string, string>,
  courseId: string,
): string | undefined {
  const needle = courseId.trim();
  if (!needle) return undefined;
  const direct = map.get(needle);
  if (direct !== undefined) return direct;
  for (const [k, v] of map) {
    if (k.trim() === needle) return v;
  }
  return undefined;
}

function hasInstructorPreferenceForCourse(
  map: Map<string, string>,
  courseId: string,
): boolean {
  return getInstructorPreferenceForCourse(map, courseId) !== undefined;
}

export function useCustomRulesViewModel() {
  const {
    selectedDays,
    setSelectedDays,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    setLastPlannerFlowRoute,
    selectedCourses,
    professorPreferences,
    setProfessorPreferences,
    selectedSemester,
    activeDegreeYearTier,
  } = useSelection();

  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.PLANNER_FLOW_CUSTOM_RULES,
  );

  const { allCourses: catalogCourses, loading: catalogLoading } =
    usePlannerCatalog();

  const semesterKey = selectedSemester === "Sem 1" ? "A" : "B";
  const catalogYearLetter = catalogLetterForDegreeTier(activeDegreeYearTier);

  const plannerCoursesForPreferences = useMemo(() => {
    const inTerm = filterCoursesForPlannerTerm(
      catalogCourses,
      semesterKey,
      catalogYearLetter,
    );
    return inTerm.filter((course) => selectedCourses.has(course.courseID));
  }, [catalogCourses, selectedCourses, semesterKey, catalogYearLetter]);

  const showInstructorPreferences =
    !catalogLoading &&
    plannerCoursesForPreferences.some(
      (c) => collectDistinctLecturersFromCourse(c).length > 0,
    );

  /** Catalog title large, internal solver id small (e.g. bgu-…). */
  const getCoursePresentation = (courseId: string) => {
    const c = findPlannerCourseById(plannerCoursesForPreferences, courseId);
    const raw = courseId.trim();
    if (!c) return { primary: raw, secondary: null as string | null };

    const id = c.courseID;
    const name = c.courseName?.trim();
    if (name && name.length > 0) {
      return { primary: name, secondary: id };
    }
    return { primary: id, secondary: null };
  };

  const visibleProfessorPreferences = useMemo(
    () =>
      Array.from(selectedCourses).flatMap((courseId) => {
        const preferredInstructor = getInstructorPreferenceForCourse(
          professorPreferences,
          courseId,
        );
        if (!preferredInstructor) return [];
        return [[courseId, preferredInstructor] as const];
      }),
    [professorPreferences, selectedCourses],
  );
  const constraintSummary = useMemo(
    () =>
      buildConstraintSummary({
        blockedDays: selectedDays,
        startHour,
        endHour,
        preferredInstructorCount: visibleProfessorPreferences.length,
      }),
    [selectedDays, startHour, endHour, visibleProfessorPreferences.length],
  );

  // Save this route as the last visited planner flow route
  useEffect(() => {
    setLastPlannerFlowRoute(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES);
  }, [setLastPlannerFlowRoute]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showProfessorModal, setShowProfessorModal] = useState(false);
  const [selectedCourseForProfessor, setSelectedCourseForProfessor] = useState<
    string | null
  >(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );
  const [isStartingOptimizer, setIsStartingOptimizer] = useState(false);
  const [optimizerCtaError, setOptimizerCtaError] = useState<string | null>(
    null,
  );
  const optimizerPressLockRef = useRef(false);

  const professorModalCoursePres = selectedCourseForProfessor
    ? getCoursePresentation(selectedCourseForProfessor)
    : null;

  useEffect(() => {
    const result = validatePlannerAvailabilityPreferences({
      startHour,
      endHour,
    });
    setAvailabilityError(result.ok ? null : result.message);
  }, [startHour, endHour]);

  // Generate hour options from 8 AM to 9 PM
  const hourOptions = [
    "Any",
    "8:00 AM",
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "1:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
    "6:00 PM",
    "7:00 PM",
    "8:00 PM",
    "9:00 PM",
  ];

  const getAvailableEndHours = () => {
    if (startHour === "Any") {
      return hourOptions;
    }
    const startIndex = hourOptions.indexOf(startHour);
    if (startIndex === -1) return hourOptions;
    // End hour should be after start hour, or "Any"
    return ["Any", ...hourOptions.slice(startIndex + 1)];
  };

  const days = [Days.Mon, Days.Tue, Days.Wed, Days.Thu, Days.Fri];

  const toggleDay = (day: string) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(day)) {
      newSelected.delete(day);
    } else {
      newSelected.add(day);
    }
    setSelectedDays(newSelected);
  };

  const handleAddProfessorPreference = () => {
    setSelectedCourseForProfessor(null);
    setShowProfessorModal(true);
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseForProfessor(courseId.trim());
  };

  const handleSelectProfessor = (professor: string) => {
    if (selectedCourseForProfessor) {
      setProfessorPreferences((prev) => {
        const newMap = new Map(prev);
        newMap.set(selectedCourseForProfessor, professor);
        return newMap;
      });
      setShowProfessorModal(false);
      setSelectedCourseForProfessor(null);
    }
  };

  const handleRemoveProfessorPreference = (courseId: string) => {
    setProfessorPreferences((prev) => {
      const newMap = new Map(prev);
      const normalizedCourseId = courseId.trim();
      const keysToDelete = Array.from(newMap.keys()).filter(
        (key) => key.trim() === normalizedCourseId,
      );
      for (const key of keysToDelete) {
        newMap.delete(key);
      }
      return newMap;
    });
  };

  const getAvailableCourses = () => {
    return Array.from(selectedCourses).filter((courseId) => {
      if (hasInstructorPreferenceForCourse(professorPreferences, courseId))
        return false;
      return (
        collectDistinctLecturersForCourseId(
          plannerCoursesForPreferences,
          courseId,
        ).length > 0
      );
    });
  };

  const lecturerChoicesForModal = selectedCourseForProfessor
    ? collectDistinctLecturersForCourseId(
        plannerCoursesForPreferences,
        selectedCourseForProfessor,
      )
    : [];
  const runOptimizerCtaState = getRunOptimizerCtaState({
    hasAvailabilityError: !!availabilityError,
    isSubmitting: isStartingOptimizer,
    errorMessage: optimizerCtaError,
  });

  useFocusEffect(
    useCallback(() => {
      optimizerPressLockRef.current = false;
      setIsStartingOptimizer(false);
    }, []),
  );

  const handleRunOptimizerPress = () => {
    const check = validatePlannerAvailabilityPreferences({
      startHour,
      endHour,
    });

    const pressDecision = evaluateRunOptimizerPress({
      isPressLocked: optimizerPressLockRef.current,
      ctaDisabled: runOptimizerCtaState.disabled,
      availabilityCheckOk: check.ok,
    });

    if (pressDecision === "ignore") {
      return;
    }

    if (pressDecision === "validation-error") {
      if (!check.ok) {
        Alert.alert("Fix availability", check.message);
      }
      return;
    }

    optimizerPressLockRef.current = true;
    setOptimizerCtaError(null);
    setIsStartingOptimizer(true);

    try {
      router.push(ROUTES.STUDENT.PLANNER_FLOW.GENERATED_OPTIONS);
    } catch {
      optimizerPressLockRef.current = false;
      setIsStartingOptimizer(false);
      setOptimizerCtaError(
        "Could not open generated options. Please retry running the optimizer.",
      );
    }
  };


  const goToCourseSelection = () => {
    router.push(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION);
  };

  return {
    scrollViewProps,
    constraintSummary,
    days,
    selectedDays,
    toggleDay,
    showStartPicker,
    setShowStartPicker,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    setShowEndPicker,
    availabilityError,
    showInstructorPreferences,
    visibleProfessorPreferences,
    getCoursePresentation,
    handleRemoveProfessorPreference,
    getAvailableCourses,
    handleAddProfessorPreference,
    selectedCourses,
    hourOptions,
    showEndPicker,
    getAvailableEndHours,
    showProfessorModal,
    setShowProfessorModal,
    selectedCourseForProfessor,
    setSelectedCourseForProfessor,
    getInstructorPreferenceForCourse,
    professorPreferences,
    handleSelectCourse,
    handleSelectProfessor,
    professorModalCoursePres,
    lecturerChoicesForModal,
    runOptimizerCtaState,
    handleRunOptimizerPress,
    goToCourseSelection,
  };
}
