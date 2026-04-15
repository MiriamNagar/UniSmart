import { PlannerCourseDetailModal } from "@/components/planner-course-detail-modal";
import { PlannerFullWeekSchedule } from "@/components/planner-full-week-schedule";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

function planIdFromRouteParam(raw: string | string[] | undefined): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
    return raw[0];
  }
  return "";
}

export default function SavedPlanDetailScreen() {
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

  const navigateBackOrSaved = () => {
    const navRouter = router as typeof router & { canGoBack?: () => boolean };
    if (typeof navRouter.canGoBack === "function" && navRouter.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ROUTES.STUDENT.SAVED);
  };

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

  if (!planId) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={navigateBackOrSaved}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerMessage}>
          <ThemedText style={styles.muted}>Missing plan id.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={navigateBackOrSaved}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerMessage}>
          <ThemedText style={styles.muted}>Loading plan…</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (loadError || !plan) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={navigateBackOrSaved}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
        </View>
        <View style={styles.centerMessage}>
          <ThemedText style={styles.muted}>
            {loadError ?? "We could not find this saved plan."}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const weekSchedule = plan.schedule as Record<PlannerWeekDayKey, PlannerWeekCellLike[]>;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={navigateBackOrSaved}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <ThemedText style={styles.topBarTitle}>Saved plan</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <ThemedText style={styles.compiledText}>COMPILED {plan.date}</ThemedText>
          {plan.fitScore > 0 ? (
            <ThemedText style={styles.fitScore}>Fit {plan.fitScore}</ThemedText>
          ) : null}
        </View>
        <ThemedText style={styles.fullWeekHint}>
          Full week — Sun–Fri at once. Scroll vertically for hours. Tap a block for full
          details.
        </ThemedText>

        <PlannerFullWeekSchedule
          schedule={weekSchedule}
          hydrateFromCatalog
          catalogCourses={catalogCourses}
          onCellPress={(cell, day) =>
            setCourseDetailModal(buildSavedScheduleModalDetail(cell, day, catalogCourses))
          }
        />
      </ScrollView>

      <PlannerCourseDetailModal
        visible={courseDetailModal !== null}
        detail={courseDetailModal}
        onClose={() => setCourseDetailModal(null)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topBar: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 16,
  },
  compiledText: {
    fontSize: 12,
    color: "#9B9B9B",
    fontWeight: "500",
  },
  fitScore: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B4C9D",
  },
  fullWeekHint: {
    fontSize: 13,
    color: "#6C6C80",
    lineHeight: 18,
    marginBottom: 14,
  },
  centerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  muted: {
    fontSize: 16,
    color: "#9B9B9B",
    textAlign: "center",
  },
});
