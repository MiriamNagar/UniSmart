import { ROUTES } from "@/constants/routes";
import { usePlannerCatalog } from "@/contexts/bgu-planner-catalog-context";
import { useSelection } from "@/contexts/selection-context";
import {
  buildSavedScheduleModalDetail,
  type PlannerCourseDetailPayload,
  type PlannerWeekCellLike,
} from "@/lib/planner-course-modal-detail";
import type { PlannerWeekDayKey } from "@/lib/planner-week-constants";
import {
  getSavedPlanByIdForCurrentUser,
  mapSavedPlanReadErrorToMessage,
  type SavedPlanRecord,
} from "@/lib/saved-schedule-firestore";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

function planIdFromRouteParam(raw: string | string[] | undefined): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
    return raw[0];
  }
  return "";
}

export type SavedPlanDetailPhase =
  | "missing"
  | "loading"
  | "error"
  | "ready";

export function useSavedPlanDetailViewModel() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const planId = planIdFromRouteParam(rawId);
  const { savedPlans } = useSelection();
  const { allCourses: catalogCourses } = usePlannerCatalog();

  const fromContext = useMemo(
    () => savedPlans.find((p) => p.id === planId),
    [savedPlans, planId],
  );

  const [plan, setPlan] = useState<SavedPlanRecord | null>(fromContext ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!fromContext && planId.length > 0);

  const navigateBackOrSaved = useCallback(() => {
    const navRouter = router as typeof router & { canGoBack?: () => boolean };
    if (typeof navRouter.canGoBack === "function" && navRouter.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.STUDENT.SAVED);
  }, []);

  useEffect(() => {
    if (fromContext) {
      setPlan(fromContext);
      setIsLoading(false);
      setLoadError(null);
      return;
    }
    if (!planId) {
      setPlan(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    void getSavedPlanByIdForCurrentUser(planId)
      .then((record) => {
        if (cancelled) {
          return;
        }
        setPlan(record);
      })
      .catch((e: unknown) => {
        if (cancelled) {
          return;
        }
        setLoadError(mapSavedPlanReadErrorToMessage(e));
        setPlan(null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fromContext, planId]);

  const [courseDetailModal, setCourseDetailModal] =
    useState<PlannerCourseDetailPayload | null>(null);

  const phase: SavedPlanDetailPhase = useMemo(() => {
    if (!planId) return "missing";
    if (isLoading) return "loading";
    if (loadError || !plan) return "error";
    return "ready";
  }, [planId, isLoading, loadError, plan]);

  const weekSchedule = useMemo(() => {
    if (!plan || phase !== "ready") {
      return null;
    }
    return plan.schedule as Record<
      PlannerWeekDayKey,
      PlannerWeekCellLike[]
    >;
  }, [plan, phase]);

  const onCellPress = useCallback(
    (cell: PlannerWeekCellLike, day: PlannerWeekDayKey) => {
      setCourseDetailModal(
        buildSavedScheduleModalDetail(cell, day, catalogCourses),
      );
    },
    [catalogCourses],
  );

  const errorMessage =
    phase === "error" ? (loadError ?? "We could not find this saved plan.") : null;

  return {
    phase,
    planId,
    navigateBackOrSaved,
    plan: phase === "ready" ? plan : null,
    weekSchedule,
    catalogCourses,
    courseDetailModal,
    setCourseDetailModal,
    onCellPress,
    errorMessage,
  };
}
