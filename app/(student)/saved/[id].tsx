import { PlannerCourseDetailModal } from "@/components/planner-course-detail-modal";
import { PlannerFullWeekSchedule } from "@/components/planner-full-week-schedule";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useSavedPlanDetailViewModel } from "@/view-models/use-saved-plan-detail-view-model";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function SavedPlanDetailScreen() {
  const {
    phase,
    navigateBackOrSaved,
    plan,
    weekSchedule,
    catalogCourses,
    courseDetailModal,
    setCourseDetailModal,
    onCellPress,
    errorMessage,
  } = useSavedPlanDetailViewModel();

  if (phase === "missing") {
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

  if (phase === "loading") {
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

  if (phase === "error") {
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
          <ThemedText style={styles.muted}>{errorMessage}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!plan || !weekSchedule) {
    return null;
  }

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
          onCellPress={onCellPress}
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
