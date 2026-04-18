import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import {
  DEGREE_YEAR_PLANNER_OPTIONS,
  type DegreeYearTier,
} from "@/lib/planner-active-term";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";

export function usePlannerViewModel() {
  const {
    selectedSemester,
    setSelectedSemester,
    activeDegreeYearTier,
    setActiveDegreeYearTier,
    lastPlannerFlowRoute,
    setLastPlannerFlowRoute,
    setSelectedCourses,
    userInfo,
  } = useSelection();

  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.STUDENT_PLANNER,
  );

  const resetPlannerSelectionsForTermChange = () => {
    setSelectedCourses(new Set());
  };

  useFocusEffect(
    useCallback(() => {
      if (lastPlannerFlowRoute) {
        setLastPlannerFlowRoute(null);
      }
    }, [lastPlannerFlowRoute, setLastPlannerFlowRoute]),
  );

  const selectDegreeYear = (tier: DegreeYearTier) => {
    setActiveDegreeYearTier(tier);
    resetPlannerSelectionsForTermChange();
  };

  const selectSemester = (sem: "Sem 1" | "Sem 2") => {
    setSelectedSemester(sem);
    resetPlannerSelectionsForTermChange();
  };

  const beginCourseSelection = () => {
    setLastPlannerFlowRoute(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION);
    router.push(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION);
  };

  return {
    selectedSemester,
    activeDegreeYearTier,
    userInfo,
    scrollViewProps,
    degreeYearOptions: DEGREE_YEAR_PLANNER_OPTIONS,
    selectDegreeYear,
    selectSemester,
    beginCourseSelection,
  };
}
