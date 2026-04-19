import { PlannerCourseDetailModal } from "@/components/planner-course-detail-modal";
import { PlannerFullWeekSchedule } from "@/components/planner-full-week-schedule";
import { PlannerConstraintSummaryStrip } from "@/components/planner-constraint-summary-strip";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { MaterialIcons } from "@expo/vector-icons";
import {
  PLANNER_RANKING_NOT_ENROLLMENT_DISCLAIMER,
  PLANNER_SOFT_SCORE_EXPLANATION,
  SOFT_SCORE_CAP_CREDITS,
  SOFT_SCORE_CAP_PREFERRED_HOURS,
} from "@/logic/solver";
import { plannerModalDetailFromGenerated } from "@/lib/planner-course-modal-detail";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useGeneratedOptionsViewModel,
  type GeneratedOptionScheduleCell,
} from "@/view-models/use-generated-options-view-model";

export default function GeneratedOptionsScreen() {
  const {
    catalogLoading,
    refreshCatalog,
    scrollViewProps,
    courseDetailModal,
    setCourseDetailModal,
    savingProposalId,
    catalogUi,
    availabilityValidation,
    proposals,
    generationFeedbackPanel,
    constraintCount,
    constraintSummary,
    handleSavePlan,
    requestGeneratedBatchClear,
    goToCustomRules,
  } = useGeneratedOptionsViewModel();

  return (
    <ThemedView style={styles.container}>
      {/* Header*/}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>
          INTELLIGENCE PLANNER
        </ThemedText>
      </View>

      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>Generated Options</ThemedText>
          <ThemedText style={styles.subtitle}>
            BASED ON {constraintCount}{" "}
            {constraintCount === 1 ? "CONSTRAINT" : "CONSTRAINTS"}
          </ThemedText>
        </View>
        <PlannerConstraintSummaryStrip
          blockedDaysLabel={constraintSummary.blockedDaysLabel}
          timeWindowLabel={constraintSummary.timeWindowLabel}
          preferencesLabel={constraintSummary.preferencesLabel}
        />

        <View style={styles.catalogNotice} accessibilityRole="text">
          <ThemedText style={styles.catalogNoticeTitle}>
            {catalogUi.headline}
          </ThemedText>
          {catalogUi.bodyLines.map((line, i) => (
            <ThemedText
              key={`catalog-body-${i}`}
              style={[
                styles.catalogNoticeBody,
                i > 0 ? styles.catalogNoticeBodyFollow : null,
              ]}
            >
              {line}
            </ThemedText>
          ))}
          {catalogLoading ? (
            <ThemedText
              style={[styles.catalogNoticeBody, styles.catalogNoticeBodyFollow]}
            >
              {catalogUi.compactNonEnrollmentNote}
            </ThemedText>
          ) : null}
          {catalogUi.showRetry ? (
            <TouchableOpacity
              style={[
                styles.catalogRetry,
                catalogLoading ? styles.catalogRetryDisabled : null,
              ]}
              onPress={() => {
                if (catalogLoading) return;
                void refreshCatalog();
              }}
              disabled={catalogLoading}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Retry loading catalog from Firestore"
              accessibilityState={{ disabled: catalogLoading }}
            >
              <ThemedText style={styles.catalogRetryText}>
                Retry Firestore
              </ThemedText>
            </TouchableOpacity>
          ) : null}
        </View>

        {availabilityValidation.ok && proposals.length > 0 ? (
          <View style={styles.rankingDisclosure} accessibilityRole="text">
            <ThemedText style={styles.rankingDisclosureTitle}>
              How options are ranked
            </ThemedText>
            <ThemedText style={styles.rankingDisclosureBody}>
              {PLANNER_SOFT_SCORE_EXPLANATION}
            </ThemedText>
            <ThemedText
              style={[
                styles.rankingDisclosureBody,
                styles.rankingDisclosureBodyFollow,
              ]}
            >
              {PLANNER_RANKING_NOT_ENROLLMENT_DISCLAIMER}
            </ThemedText>
          </View>
        ) : null}

        {!availabilityValidation.ok ? (
          <View style={styles.availabilityNotice} accessibilityRole="alert">
            <ThemedText style={styles.availabilityNoticeTitle}>
              Availability needs a fix
            </ThemedText>
            <ThemedText style={styles.availabilityNoticeBody}>
              {availabilityValidation.message}
            </ThemedText>
            <ThemedText
              style={[
                styles.availabilityNoticeBody,
                styles.availabilityNoticeBodyFollow,
              ]}
            >
              Go back and adjust earliest start / latest end, then run the
              optimizer again.
            </ThemedText>
          </View>
        ) : null}

        {generationFeedbackPanel ? (
          <View style={styles.generationFeedbackPanel} accessibilityRole="alert">
            <MaterialIcons
              name={
                generationFeedbackPanel.kind === "no-feasible-schedule"
                  ? "event-busy"
                  : "error-outline"
              }
              size={34}
              color="#B00020"
            />
            <ThemedText style={styles.generationFeedbackTitle}>
              {generationFeedbackPanel.title}
            </ThemedText>
            <ThemedText style={styles.generationFeedbackDescription}>
              {generationFeedbackPanel.description}
            </ThemedText>
            {generationFeedbackPanel.actions.map((action, idx) => (
              <ThemedText
                key={`generation-feedback-${idx}`}
                style={styles.generationFeedbackAction}
              >
                • {action}
              </ThemedText>
            ))}
          </View>
        ) : availabilityValidation.ok ? (
          proposals.map((proposal, proposalIndex) => (
            <View key={proposal.id} style={styles.proposalContainer}>
              <View style={styles.proposalHeader}>
                <View style={styles.proposalInfo}>
                  <ThemedText style={styles.proposalLabel}>
                    PROPOSAL {proposalIndex + 1}
                  </ThemedText>
                  <ThemedText style={styles.fitScore}>
                    Fit score: {proposal.fitScore}%
                  </ThemedText>
                  <ThemedText style={styles.fitScoreBreakdown}>
                    Credits{" "}
                    {Math.round(proposal.scoreBreakdown.creditPoints)}/
                    {SOFT_SCORE_CAP_CREDITS} · Preferred hours{" "}
                    {Math.round(proposal.scoreBreakdown.preferredHoursPoints)}/
                    {SOFT_SCORE_CAP_PREFERRED_HOURS}
                    {proposal.scoreBreakdown.instructorCoursesConsidered > 0
                      ? ` · Instructor +${Math.round(proposal.scoreBreakdown.instructorBonusPoints)} (${proposal.scoreBreakdown.instructorMatches}/${proposal.scoreBreakdown.instructorCoursesConsidered} courses)`
                      : ""}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    void handleSavePlan(proposal);
                  }}
                  disabled={savingProposalId !== null}
                >
                  <ThemedText style={styles.saveButtonText}>
                    {savingProposalId === proposal.id ? "SAVING..." : "SAVE PLAN"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <ThemedText style={styles.generatedWeekHint}>
                Full week — Sun–Fri at once. Scroll for hours. Tap a block for details.
              </ThemedText>
              <PlannerFullWeekSchedule
                schedule={proposal.schedule}
                hydrateFromCatalog={false}
                catalogCourses={[]}
                slotHeight={55}
                onCellPress={(cell, _day) =>
                  setCourseDetailModal(cell as GeneratedOptionScheduleCell)
                }
              />
            </View>
          ))
        ) : null}
      </ScrollView>

      <PlannerCourseDetailModal
        visible={courseDetailModal !== null}
        detail={
          courseDetailModal
            ? plannerModalDetailFromGenerated(courseDetailModal)
            : null
        }
        onClose={() => setCourseDetailModal(null)}
      />

      {/* Bottom Buttons */}
      <View style={styles.adjustButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={goToCustomRules}
        >
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => requestGeneratedBatchClear("button")}
        >
          <ThemedText style={styles.adjustButtonText}>
            START OVER
          </ThemedText>
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
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
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 12,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  catalogNotice: {
    backgroundColor: "#F5F3FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E0FF",
    padding: 14,
    marginBottom: 20,
  },
  catalogNoticeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B4C9D",
    marginBottom: 8,
  },
  catalogNoticeBody: {
    fontSize: 12,
    color: "#444444",
    lineHeight: 17,
  },
  catalogNoticeBodyFollow: {
    marginTop: 8,
  },
  rankingDisclosure: {
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C5D9F0",
    padding: 14,
    marginBottom: 20,
  },
  rankingDisclosureTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A4A7A",
    marginBottom: 8,
  },
  rankingDisclosureBody: {
    fontSize: 12,
    color: "#444444",
    lineHeight: 17,
  },
  rankingDisclosureBodyFollow: {
    marginTop: 8,
  },
  catalogRetry: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#5B4C9D",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  catalogRetryDisabled: {
    opacity: 0.55,
  },
  catalogRetryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
  availabilityNotice: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    padding: 14,
    marginBottom: 20,
  },
  availabilityNoticeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B00020",
    marginBottom: 8,
  },
  availabilityNoticeBody: {
    fontSize: 13,
    color: "#5D4037",
    lineHeight: 18,
  },
  availabilityNoticeBodyFollow: {
    marginTop: 8,
  },
  proposalContainer: {
    marginBottom: 32,
  },
  proposalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  proposalInfo: {
    flex: 1,
  },
  proposalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B4C9D",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fitScore: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  fitScoreBreakdown: {
    marginTop: 6,
    fontSize: 11,
    color: "#666666",
    lineHeight: 15,
    maxWidth: 220,
  },
  saveButton: {
    backgroundColor: "#5B4C9D",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  generatedWeekHint: {
    fontSize: 12,
    color: "#6C6C80",
    lineHeight: 16,
    marginBottom: 10,
  },
  adjustButtonContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    width: 56,
    height: 56,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  adjustButton: {
    flex: 1,
    height: 56,
    backgroundColor: "#2C2C2C",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  generationFeedbackPanel: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFEBEE",
    padding: 16,
    marginBottom: 24,
  },
  generationFeedbackTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#B00020",
  },
  generationFeedbackDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#5D4037",
  },
  generationFeedbackAction: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: "#5D4037",
  },
});