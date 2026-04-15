import { PlannerCourseDetailModal } from "@/components/planner-course-detail-modal";
import { PlannerFullWeekSchedule } from "@/components/planner-full-week-schedule";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { usePlannerCatalog } from "@/contexts/bgu-planner-catalog-context";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import {
  buildSavedScheduleModalDetail,
  type PlannerCourseDetailPayload,
  type PlannerWeekCellLike,
} from "@/lib/planner-course-modal-detail";
import type { PlannerWeekDayKey } from "@/lib/planner-week-constants";
import {
  deleteSavedPlanForCurrentUser,
  listSavedPlansForCurrentUser,
  mapSavedPlanDeleteErrorToMessage,
  mapSavedPlanReadErrorToMessage,
} from "@/lib/saved-schedule-firestore";
import { MaterialIcons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function SavedScreen() {
  const { savedPlans, setSavedPlans } = useSelection();
  const { allCourses: catalogCourses } = usePlannerCatalog();
  const isFocused = useIsFocused();
  const { scrollViewProps } = usePersistedTabScroll(TAB_SCROLL_KEYS.STUDENT_SAVED);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
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
      setSavedPlans((previousPlans) => previousPlans.filter((entry) => entry.id !== planId));
    } catch (error: unknown) {
      console.error("[UniSmart] Failed to delete saved plan", error);
      setDeleteErrorMessage(mapSavedPlanDeleteErrorToMessage(error));
    } finally {
      setDeletingPlanId(null);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>MY WORKSPACE</ThemedText>
      </View>

      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>My Workspace</ThemedText>
          <ThemedText style={styles.subtitle}>FINALIZED PLANS</ThemedText>
        </View>

        {isLoadingPlans ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              Loading saved plans...
            </ThemedText>
          </View>
        ) : loadErrorMessage ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>{loadErrorMessage}</ThemedText>
            <TouchableOpacity
              style={styles.createButton}
              activeOpacity={0.8}
              onPress={() => {
                setLoadErrorMessage(null);
                setReloadNonce((prev) => prev + 1);
              }}
            >
              <ThemedText style={styles.createButtonText}>TRY AGAIN</ThemedText>
            </TouchableOpacity>
          </View>
        ) : savedPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>
              No saved plans.
            </ThemedText>
            <TouchableOpacity
              style={styles.createButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION)
              }
            >
              <ThemedText style={styles.createButtonText}>
                CREATE NEW PLAN
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {deleteErrorMessage ? (
              <View style={styles.deleteErrorContainer}>
                <ThemedText style={styles.deleteErrorText}>
                  {deleteErrorMessage}
                </ThemedText>
              </View>
            ) : null}
            {savedPlans.map((plan) => {
            const weekSchedule = plan.schedule as Record<
              PlannerWeekDayKey,
              PlannerWeekCellLike[]
            >;
            return (
              <View key={plan.id} style={styles.planCard}>
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => router.push(ROUTES.STUDENT.savedDetail(plan.id))}
                  accessibilityRole="button"
                  accessibilityLabel={`Open saved plan from ${plan.date}`}
                >
                  <View style={styles.planHeader}>
                    <ThemedText style={styles.compiledText}>
                      COMPILED {plan.date}
                    </ThemedText>
                    {plan.fitScore > 0 ? (
                      <ThemedText style={styles.fitScore}>Fit {plan.fitScore}</ThemedText>
                    ) : null}
                  </View>
                  <ThemedText style={styles.planHint}>
                    Tap to open full plan — or scroll and tap a course for quick details.
                  </ThemedText>
                </TouchableOpacity>
                <PlannerFullWeekSchedule
                  schedule={weekSchedule}
                  hydrateFromCatalog
                  catalogCourses={catalogCourses}
                  onCellPress={(cell, day) =>
                    setCourseDetailModal(
                      buildSavedScheduleModalDetail(cell, day, catalogCourses),
                    )
                  }
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[
                    styles.deletePlanButton,
                    deletingPlanId === plan.id ? styles.deletePlanButtonDisabled : null,
                  ]}
                  disabled={deletingPlanId !== null}
                  onPress={() => confirmDeletePlan(plan.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete saved plan from ${plan.date}`}
                >
                  <View style={styles.deletePlanButtonInner}>
                    <MaterialIcons name="delete-outline" size={14} color="#B3261E" />
                    <ThemedText style={styles.deletePlanButtonText}>
                      {deletingPlanId === plan.id ? "Deleting..." : "Delete plan"}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            );
            })}
          </>
        )}
      </ScrollView>
      {!isLoadingPlans && !loadErrorMessage && savedPlans.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          activeOpacity={0.8}
          onPress={() =>
            router.push(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION)
          }
        >
          <MaterialIcons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "flex-start",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerTitleSmart: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5B4C9D",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  titleSection: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  emptyState: {
    paddingTop: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9B9B9B",
  },
  createButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: "#5B4C9D",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  compiledText: {
    fontSize: 12,
    color: "#9B9B9B",
    fontWeight: "500",
  },
  fitScore: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B4C9D",
  },
  planHint: {
    fontSize: 12,
    color: "#6C6C80",
    marginBottom: 12,
    lineHeight: 16,
  },
  deleteErrorContainer: {
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  deleteErrorText: {
    fontSize: 13,
    color: "#C62828",
    textAlign: "center",
    lineHeight: 18,
  },
  deletePlanButton: {
    marginTop: 10,
    alignSelf: "flex-end",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E4A9A4",
    backgroundColor: "#FFF6F5",
  },
  deletePlanButtonDisabled: {
    opacity: 0.6,
  },
  deletePlanButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deletePlanButtonText: {
    color: "#B3261E",
    fontSize: 11,
    fontWeight: "600",
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#5B4C9D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});
