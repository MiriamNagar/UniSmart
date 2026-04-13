import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { usePlannerCatalog } from "@/contexts/bgu-planner-catalog-context";
import {
    catalogLetterForDegreeTier,
    DEGREE_YEAR_PLANNER_OPTIONS,
    filterCoursesForPlannerTerm,
} from "@/lib/planner-active-term";
import { buildPlannerCatalogUiModel } from "@/lib/planner-catalog-ui-messages";
import {
    lessonKindShortLabel,
    uniqueLecturersForLessonSlot,
} from "@/lib/planner-schedule-display";
import {
    isCourseEligibleForSemester,
    virtualCompletedCourseNamesForDegreeTier,
} from "@/lib/planner-prerequisite-eligibility";
import {
    computeFitScoreBreakdown,
    DEFAULT_MAX_PLANNER_PROPOSALS,
    generateSchedules,
    lessonMultisetFingerprint,
    PLANNER_RANKING_NOT_ENROLLMENT_DISCLAIMER,
    PLANNER_SOFT_SCORE_EXPLANATION,
    SOFT_SCORE_CAP_CREDITS,
    SOFT_SCORE_CAP_PREFERRED_HOURS,
    validatePlannerAvailabilityPreferences,
} from "@/logic/solver";
import { Days } from "@/types/courses";

type PlannerDayKey = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI";

type GeneratedOptionScheduleCell = {
  id: string;
  courseCode: string;
  courseName: string;
  lessonKindLabel: string;
  instructorsLine: string;
  location: string;
  time: string;
  startTime: string;
  endTime: string;
  calendarDay: string;
};

function emptyWeekSchedule(): Record<PlannerDayKey, GeneratedOptionScheduleCell[]> {
  return {
    SUN: [],
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
  };
}

export default function GeneratedOptionsScreen() {
  const {
    selectedCourses,
    selectedDays,
    startHour,
    endHour,
    setSavedPlans,
    setLastPlannerFlowRoute,
    professorPreferences,
    selectedSemester,
    activeDegreeYearTier,
  } = useSelection();

  const {
    allCourses: catalogCourses,
    loading: catalogLoading,
    source: catalogSource,
    loadError: catalogLoadError,
    hasFirebaseDb,
    refresh: refreshCatalog,
  } = usePlannerCatalog();

  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.PLANNER_FLOW_GENERATED_OPTIONS,
  );

  const virtualCompletedCourseNames = useMemo(
    () =>
      virtualCompletedCourseNamesForDegreeTier(
        catalogCourses,
        activeDegreeYearTier,
      ),
    [catalogCourses, activeDegreeYearTier],
  );

  // מצב למעקב אחרי ריחוף עכבר
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  /** Full details for a timetable cell (tap / short blocks). */
  const [courseDetailModal, setCourseDetailModal] = useState<{
    id: string;
    courseCode: string;
    courseName: string;
    lessonKindLabel: string;
    instructorsLine: string;
    location: string;
    time: string;
    calendarDay: string;
  } | null>(null);

  useEffect(() => {
    setLastPlannerFlowRoute(ROUTES.STUDENT.PLANNER_FLOW.GENERATED_OPTIONS);
  }, [setLastPlannerFlowRoute]);

  const activeTermSummary = useMemo(() => {
    const yearLabel =
      DEGREE_YEAR_PLANNER_OPTIONS.find((o) => o.tier === activeDegreeYearTier)
        ?.label ?? "Year 1";
    const semLabel = selectedSemester === "Sem 1" ? "Semester A" : "Semester B";
    return `${yearLabel} · ${semLabel}`;
  }, [activeDegreeYearTier, selectedSemester]);

  const catalogUi = useMemo(
    () =>
      buildPlannerCatalogUiModel({
        hasFirebaseDb,
        source: catalogSource,
        loadError: catalogLoadError,
        loading: catalogLoading,
        activeTermSummary,
      }),
    [
      hasFirebaseDb,
      catalogSource,
      catalogLoadError,
      catalogLoading,
      activeTermSummary,
    ],
  );

  const availabilityValidation = useMemo(
    () => validatePlannerAvailabilityPreferences({ startHour, endHour }),
    [startHour, endHour],
  );

  const proposals = useMemo(() => {
    if (!availabilityValidation.ok) {
      return [];
    }

    const semesterKey = selectedSemester === "Sem 1" ? "A" : "B";
    const catalogYearLetter = catalogLetterForDegreeTier(activeDegreeYearTier);

    const inTerm = filterCoursesForPlannerTerm(
      catalogCourses,
      semesterKey,
      catalogYearLetter,
    );
    const coursesToSchedule = inTerm.filter(
      (course) =>
        selectedCourses.has(course.courseID) &&
        isCourseEligibleForSemester(course, semesterKey, catalogCourses, {
          completedCourseNames: virtualCompletedCourseNames,
        }),
    );

    const preferredInstructorsByCourse: Record<string, string> = {};
    for (const c of coursesToSchedule) {
      const pref = professorPreferences.get(c.courseID)?.trim();
      if (pref) preferredInstructorsByCourse[c.courseID] = pref;
    }

    const preferences = {
      blockedDays: Array.from(selectedDays) as Days[],
      startHour,
      endHour,
      ...(Object.keys(preferredInstructorsByCourse).length > 0
        ? { preferredInstructorsByCourse }
        : {}),
    };

    const solverResult = generateSchedules(
      coursesToSchedule,
      preferences,
      DEFAULT_MAX_PLANNER_PROPOSALS,
    );

    const seenVisual = new Set<string>();
    const proposalsDeduped = solverResult.proposals.filter((p) => {
      const key = lessonMultisetFingerprint(p.sections, coursesToSchedule);
      if (seenVisual.has(key)) return false;
      seenVisual.add(key);
      return true;
    });

    return proposalsDeduped.map((proposal) => {
      const scoreBreakdown = computeFitScoreBreakdown(
        proposal.sections,
        coursesToSchedule,
        preferences,
      );

      const transformedSchedule = emptyWeekSchedule();
      proposal.sections.forEach((section) => {
        const parentCourse = catalogCourses.find((c) =>
          c.availableSections.some((s) => s.sectionID === section.sectionID),
        );

        section.lessons.forEach((lesson) => {
          const dayKey = lesson.day.toUpperCase() as PlannerDayKey;
          if (transformedSchedule[dayKey]) {
            const lecturers = uniqueLecturersForLessonSlot(
              parentCourse,
              lesson,
            );
            transformedSchedule[dayKey].push({
              id: `${section.sectionID}-${lesson.day}-${lesson.startTime}-${lesson.type}`,
              courseCode: parentCourse?.courseID || "??",
              courseName: parentCourse?.courseName || "Unknown",
              lessonKindLabel: lessonKindShortLabel(lesson.type),
              instructorsLine: lecturers.join(" · "),
              location: lesson.location,
              time: `${lesson.startTime}-${lesson.endTime}`,
              startTime: lesson.startTime,
              endTime: lesson.endTime,
              calendarDay: dayKey,
            });
          }
        });
      });

      return {
        id: proposal.id,
        fitScore: scoreBreakdown.total,
        scoreBreakdown,
        schedule: transformedSchedule,
      };
    });
  }, [
    selectedCourses,
    professorPreferences,
    selectedDays,
    startHour,
    endHour,
    selectedSemester,
    activeDegreeYearTier,
    catalogCourses,
    virtualCompletedCourseNames,
    availabilityValidation,
  ]);

  const constraintCount =
    selectedDays.size +
    (startHour !== "Any" ? 1 : 0) +
    (endHour !== "Any" ? 1 : 0);

  const timeSlots = [
    "8:00",
    "9:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ];
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI"];

  // לוגיקת מיקום משופרת
  const HOUR_HEIGHT = 55; // הגדלתי למראה פחות צפוף
  const START_HOUR_INT = 8;

  const getTopOffset = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return (hours - START_HOUR_INT + minutes / 60) * HOUR_HEIGHT;
  };

  const getBlockHeight = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const duration = endH * 60 + endM - (startH * 60 + startM);
    return (duration / 60) * HOUR_HEIGHT;
  };

  const getTimeSlotIndex = (time: string) => {
    const hour = parseInt(time.split(":")[0]);
    return timeSlots.findIndex((slot) => parseInt(slot.split(":")[0]) === hour);
  };

  const getTimeSlotSpan = (startTime: string, endTime: string) => {
    const start = getTimeSlotIndex(startTime);
    const end = getTimeSlotIndex(endTime);
    return { start, end, span: end - start };
  };

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

        {availabilityValidation.ok && proposals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-busy" size={64} color="#9B9B9B" />
            <ThemedText style={styles.emptyStateText}>
              No valid schedules found.
            </ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>
              Try removing some constraints or days.
            </ThemedText>
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
                    const newPlan = {
                      id: `plan-${Date.now()}`,
                      date: new Date().toLocaleDateString("en-GB"),
                      fitScore: proposal.fitScore,
                      schedule: proposal.schedule,
                    };
                    setSavedPlans((prev) => [...prev, newPlan]);
                    router.push(ROUTES.STUDENT.SAVED);
                  }}
                >
                  <ThemedText style={styles.saveButtonText}>
                    SAVE PLAN
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleCard}>
                <View style={styles.scheduleContainer}>
                  {/* Time Column */}
                  <View style={styles.fixedTimeSection}>
                    <View style={styles.timeHeaderFixed}>
                      <ThemedText style={styles.gridHeaderText}>
                        TIME
                      </ThemedText>
                    </View>
                    <View style={styles.timeColumnFixed}>
                      {timeSlots.map((time, index) => (
                        <View
                          key={index}
                          style={[styles.timeSlot, { height: HOUR_HEIGHT }]}
                        >
                          <ThemedText style={styles.timeText}>
                            {time}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Scrollable Days */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    style={styles.daysScrollView}
                  >
                    <View style={{ flexDirection: "column" }}>
                      <View style={styles.daysHeaderContainer}>
                        {days.map((day, index) => (
                          <View
                            key={day}
                            style={[
                              styles.dayHeader,
                              index === days.length - 1 && styles.dayHeaderLast,
                            ]}
                          >
                            <ThemedText style={styles.gridHeaderText}>
                              {day}
                            </ThemedText>
                          </View>
                        ))}
                      </View>

                      <View style={styles.daysBodyContainer}>
                        {days.map((day, dayIndex) => (
                          <View
                            key={day}
                            style={[
                              styles.dayColumn,
                              { position: "relative", width: 130 },
                              dayIndex === days.length - 1 &&
                                styles.dayColumnLast,
                            ]}
                          >
                            {/* Background Grid Lines */}
                            {timeSlots.map((_, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.gridCell,
                                  { height: HOUR_HEIGHT },
                                ]}
                              >
                                <View style={styles.gridLine} />
                              </View>
                            ))}

                            {/* Absolute Positioned Courses */}
                            {proposal.schedule[day]?.map((course: any) => {
                              const isHovered = hoveredCourseId === course.id;
                              return (
                                <Pressable
                                  key={course.id}
                                  accessibilityRole="button"
                                  accessibilityLabel={`${course.courseCode}, ${course.courseName}, ${course.lessonKindLabel}. Tap for full details.`}
                                  onPress={() => setCourseDetailModal(course)}
                                  onHoverIn={() =>
                                    setHoveredCourseId(course.id)
                                  }
                                  onHoverOut={() => setHoveredCourseId(null)}
                                  style={[
                                    styles.courseBlock,
                                    {
                                      position: "absolute",
                                      top: getTopOffset(course.startTime) + 2,
                                      height:
                                        getBlockHeight(
                                          course.startTime,
                                          course.endTime,
                                        ) - 4,
                                      left: 4,
                                      right: 4,
                                      zIndex: isHovered ? 100 : 10,
                                      // אפקט ויזואלי לריחוף
                                      transform: [
                                        { scale: isHovered ? 1.02 : 1 },
                                      ],
                                      shadowOpacity: isHovered ? 0.2 : 0.08,
                                      elevation: isHovered ? 8 : 3,
                                      backgroundColor: isHovered
                                        ? "#EFEEFF"
                                        : "#E0E0FF",
                                    },
                                  ]}
                                >
                                  <View style={styles.courseContent}>
                                    <ThemedText
                                      style={styles.courseCode}
                                      numberOfLines={1}
                                    >
                                      {course.courseCode}
                                    </ThemedText>
                                    <ThemedText
                                      style={[
                                        styles.courseName,
                                        { fontSize: isHovered ? 12 : 11 },
                                      ]}
                                      numberOfLines={isHovered ? 3 : 2}
                                    >
                                      {course.courseName}
                                    </ThemedText>
                                    <ThemedText
                                      style={styles.lessonKindTag}
                                      numberOfLines={1}
                                    >
                                      {course.lessonKindLabel}
                                    </ThemedText>
                                    <ThemedText
                                      style={styles.instructorsLine}
                                      numberOfLines={isHovered ? 4 : 2}
                                    >
                                      {course.instructorsLine || "—"}
                                    </ThemedText>

                                    {isHovered ? (
                                      <View
                                        style={[
                                          styles.courseDetails,
                                          { marginTop: 4 },
                                        ]}
                                      >
                                        <View
                                          style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 2,
                                          }}
                                        >
                                          <MaterialIcons
                                            name="location-on"
                                            size={10}
                                            color="#5B4C9D"
                                          />
                                          <ThemedText
                                            style={styles.courseDetailTextBold}
                                          >
                                            {course.location}
                                          </ThemedText>
                                        </View>
                                      </View>
                                    ) : null}
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          ))
        ) : null}
      </ScrollView>

      {courseDetailModal ? (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setCourseDetailModal(null)}
        >
          <View style={styles.courseDetailModalRoot}>
            <Pressable
              style={styles.courseDetailModalBackdrop}
              onPress={() => setCourseDetailModal(null)}
              accessibilityRole="button"
              accessibilityLabel="Close details"
            />
            <View
              style={styles.courseDetailModalCard}
              accessibilityViewIsModal
            >
              <View style={styles.courseDetailModalHeader}>
                <ThemedText style={styles.courseDetailModalTitle}>
                  {courseDetailModal.courseCode} · {courseDetailModal.courseName}
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setCourseDetailModal(null)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <MaterialIcons name="close" size={22} color="#666666" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.courseDetailModalBody}
                showsVerticalScrollIndicator={false}
              >
                <ThemedText style={styles.courseDetailModalMeta}>
                  {courseDetailModal.calendarDay} · {courseDetailModal.time}
                </ThemedText>
                <ThemedText style={styles.courseDetailModalRowLabel}>
                  Session
                </ThemedText>
                <ThemedText style={styles.courseDetailModalRowValue}>
                  {courseDetailModal.lessonKindLabel}
                </ThemedText>
                <ThemedText style={styles.courseDetailModalRowLabel}>
                  Instructors
                </ThemedText>
                <ThemedText style={styles.courseDetailModalRowValue}>
                  {courseDetailModal.instructorsLine || "—"}
                </ThemedText>
                <ThemedText style={styles.courseDetailModalRowLabel}>
                  Location
                </ThemedText>
                <ThemedText style={styles.courseDetailModalRowValue}>
                  {courseDetailModal.location || "—"}
                </ThemedText>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Bottom Buttons */}
      <View style={styles.adjustButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES)}
        >
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => {
            setLastPlannerFlowRoute(null);
            router.push(ROUTES.STUDENT.PLANNER);
          }}
        >
          <ThemedText style={styles.adjustButtonText}>
            ADJUST SELECTION
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
  scheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  scheduleContainer: {
    flexDirection: "row",
  },
  fixedTimeSection: {
    borderRightWidth: 2,
    borderRightColor: "#E0E0E0",
  },
  timeHeaderFixed: {
    width: 60,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },
  daysScrollView: {
    flex: 1,
  },
  daysHeaderContainer: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },
  dayHeader: {
    width: 130,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    alignItems: "center",
  },
  dayHeaderLast: {
    borderRightWidth: 0,
  },
  dayColumnLast: {
    borderRightWidth: 0,
  },
  gridHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  daysBodyContainer: {
    flexDirection: "row",
  },
  timeColumnFixed: {
    width: 60,
    backgroundColor: "#FAFAFA",
  },
  timeSlot: {
    justifyContent: "center",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  timeText: {
    fontSize: 11,
    color: "#9B9B9B",
  },
  dayColumn: {
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  gridCell: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  gridLine: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  courseBlock: {
    borderRadius: 8,
    padding: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    overflow: "hidden",
    borderLeftWidth: 4,
    borderLeftColor: "#5B4C9D",
  },
  courseContent: {
    padding: 6,
  },
  courseCode: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#5B4C9D",
    marginBottom: 2,
  },
  courseName: {
    color: "#4A4A6A",
    fontWeight: "600",
    lineHeight: 14,
  },
  lessonKindTag: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: "700",
    color: "#5B4C9D",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  instructorsLine: {
    marginTop: 1,
    fontSize: 9,
    color: "#555555",
    lineHeight: 12,
  },
  courseDetails: {
    gap: 2,
  },
  courseDetailText: {
    fontSize: 10,
    color: "#9B9B9B",
  },
  courseDetailTextBold: {
    fontSize: 10,
    color: "#4A4A6A",
    fontWeight: "700",
  },
  courseDetailModalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  courseDetailModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  courseDetailModalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
    zIndex: 2,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  courseDetailModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  courseDetailModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 22,
  },
  courseDetailModalBody: {
    maxHeight: 360,
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 12,
  },
  courseDetailModalMeta: {
    fontSize: 13,
    color: "#5B4C9D",
    fontWeight: "600",
    marginBottom: 16,
  },
  courseDetailModalRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9B9B9B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  courseDetailModalRowValue: {
    fontSize: 15,
    color: "#333333",
    lineHeight: 22,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#9B9B9B",
    textAlign: "center",
    marginTop: 8,
  },
});
