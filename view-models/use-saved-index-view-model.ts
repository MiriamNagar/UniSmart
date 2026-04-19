import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { usePlannerCatalog } from "@/contexts/bgu-planner-catalog-context";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import {
    extractCourseFoldersFromSchedules,
    mapNoteFolderErrorToMessage,
    syncDefaultNoteFoldersForCurrentUser,
} from "@/lib/note-folders-firestore";
import type { PlannerCourseDetailPayload } from "@/lib/planner-course-modal-detail";
import {
    deleteSavedPlanForCurrentUser,
    listSavedPlansForCurrentUser,
    mapSavedPlanDeleteErrorToMessage,
    mapSavedPlanReadErrorToMessage,
} from "@/lib/saved-schedule-firestore";
import { useIsFocused } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

function mergeFolderNames(
  previous: string[],
  generatedFolderNames: string[],
): string[] {
  const existing = new Set(previous.map((name) => name.trim().toLowerCase()));
  const merged = [...previous];
  generatedFolderNames.forEach((name) => {
    const key = name.trim().toLowerCase();
    if (!existing.has(key)) {
      existing.add(key);
      merged.push(name);
    }
  });
  return merged;
}

export function useSavedIndexViewModel() {
  const {
    savedPlans,
    setSavedPlans,
    setCustomFolders,
    bumpNoteFoldersSyncVersion,
  } = useSelection();
  const { allCourses: catalogCourses } = usePlannerCatalog();
  const isFocused = useIsFocused();
  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.STUDENT_SAVED,
  );
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(
    null,
  );
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [generatingFoldersPlanId, setGeneratingFoldersPlanId] = useState<
    string | null
  >(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const [courseDetailModal, setCourseDetailModal] =
    useState<PlannerCourseDetailPayload | null>(null);

  useEffect(() => {
    if (!isFocused) {
      return;
    }

    let isCancelled = false;
    setIsLoadingPlans(true);
    setLoadErrorMessage(null);
    setDeleteErrorMessage(null);

    void listSavedPlansForCurrentUser()
      .then((plans) => {
        if (isCancelled) {
          return;
        }
        setSavedPlans(plans);
      })
      .catch((error: unknown) => {
        if (isCancelled) {
          return;
        }
        console.error("[UniSmart] Failed to load saved plans", error);
        setLoadErrorMessage(mapSavedPlanReadErrorToMessage(error));
      })
      .finally(() => {
        if (isCancelled) {
          return;
        }
        setIsLoadingPlans(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isFocused, reloadNonce, setSavedPlans]);

  function confirmDeletePlan(planId: string) {
    if (deletingPlanId !== null) {
      return;
    }

    Alert.alert(
      "Delete saved plan?",
      "This removes the saved schedule from your account. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void deletePlan(planId);
          },
        },
      ],
    );
  }

  async function deletePlan(planId: string) {
    setDeletingPlanId(planId);
    setDeleteErrorMessage(null);
    try {
      await deleteSavedPlanForCurrentUser(planId);
      setSavedPlans((previousPlans) =>
        previousPlans.filter((entry) => entry.id !== planId),
      );
    } catch (error: unknown) {
      console.error("[UniSmart] Failed to delete saved plan", error);
      setDeleteErrorMessage(mapSavedPlanDeleteErrorToMessage(error));
    } finally {
      setDeletingPlanId(null);
    }
  }

  async function generateFoldersFromPlan(
    plan: (typeof savedPlans)[number],
  ): Promise<void> {
    if (generatingFoldersPlanId !== null) {
      return;
    }
    setGeneratingFoldersPlanId(plan.id);
    try {
      const folders = extractCourseFoldersFromSchedules([
        plan.schedule as Record<string, unknown>,
      ]);
      if (folders.length === 0) {
        Alert.alert(
          "No folders generated",
          "This schedule has no course entries to turn into note folders.",
        );
        return;
      }
      const syncResult = await syncDefaultNoteFoldersForCurrentUser(folders);
      const generatedFolderNames = folders.map((course) => {
        const cleanCourseName = course.courseName.replace(/\.\.\.$/, "");
        return `${course.courseCode}: ${cleanCourseName}`;
      });
      setCustomFolders((previous) =>
        mergeFolderNames(previous, generatedFolderNames),
      );
      if (syncResult.addedCount > 0) {
        bumpNoteFoldersSyncVersion();
      }
      Alert.alert(
        "Folders generated",
        syncResult.addedCount > 0
          ? `Added ${syncResult.addedCount} new folder${syncResult.addedCount === 1 ? "" : "s"} from this schedule.`
          : "All folders from this schedule already exist.",
      );
    } catch (error) {
      Alert.alert("Folder generation failed", mapNoteFolderErrorToMessage(error));
    } finally {
      setGeneratingFoldersPlanId(null);
    }
  }

  return {
    savedPlans,
    setSavedPlans,
    setCustomFolders,
    bumpNoteFoldersSyncVersion,
    catalogCourses,
    isFocused,
    scrollViewProps,
    isLoadingPlans,
    loadErrorMessage,
    setLoadErrorMessage,
    deleteErrorMessage,
    deletingPlanId,
    generatingFoldersPlanId,
    reloadNonce,
    setReloadNonce,
    courseDetailModal,
    setCourseDetailModal,
    confirmDeletePlan,
    deletePlan,
    generateFoldersFromPlan,
  };
}
