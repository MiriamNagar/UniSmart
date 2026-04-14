import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { PlannerConstraintSummaryStrip } from "@/components/planner-constraint-summary-strip";
import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import { buildConstraintSummary } from "@/lib/planner-constraint-summary";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { usePlannerCatalog } from "@/contexts/bgu-planner-catalog-context";
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

export default function CustomRulesScreen() {
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

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>
          INTELLIGENCE PLANNER
        </ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <ThemedText style={styles.title}>Availability</ThemedText>
        <ThemedText style={styles.screenHint}>
          Block weekdays you cannot attend, then optionally set your earliest
          start and latest end time.
        </ThemedText>
        <PlannerConstraintSummaryStrip
          blockedDaysLabel={constraintSummary.blockedDaysLabel}
          timeWindowLabel={constraintSummary.timeWindowLabel}
          preferencesLabel={constraintSummary.preferencesLabel}
        />

        {/* Time Slots Card */}
        <View style={styles.card}>
          <ThemedText style={styles.cardLabel}>TIME SLOTS</ThemedText>
          <ThemedText style={styles.avoidText}>Blocked weekdays</ThemedText>

          {/* Day Buttons */}
          <View style={styles.daysContainer}>
            {days.map((day) => {
              const isSelected = selectedDays.has(day);
              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    isSelected && styles.dayButtonSelected,
                  ]}
                  onPress={() => toggleDay(day)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.dayButtonText,
                      isSelected && styles.dayButtonTextSelected,
                    ]}
                  >
                    {day.toUpperCase()}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hour Dropdowns */}
          <View style={styles.hourContainer}>
            <View style={styles.hourDropdown}>
              <ThemedText style={styles.hourLabel}>Earliest start</ThemedText>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.7}
                onPress={() => setShowStartPicker(true)}
              >
                <ThemedText style={styles.dropdownText}>{startHour}</ThemedText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#1A1A1A"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.hourDropdown}>
              <ThemedText style={styles.hourLabel}>Latest end</ThemedText>
              <TouchableOpacity
                style={styles.dropdown}
                activeOpacity={0.7}
                onPress={() => setShowEndPicker(true)}
              >
                <ThemedText style={styles.dropdownText}>{endHour}</ThemedText>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={24}
                  color="#1A1A1A"
                />
              </TouchableOpacity>
            </View>
          </View>
          {availabilityError ? (
            <ThemedText
              style={styles.availabilityError}
              accessibilityRole="alert"
            >
              {availabilityError}
            </ThemedText>
          ) : null}
        </View>

        {/* Instructor preferences — only when the catalog lists lecturers (FR13) */}
        {showInstructorPreferences ? (
          <View style={[styles.card, styles.instructorPreferencesCard]}>
            <ThemedText style={styles.cardLabel}>
              INSTRUCTOR PREFERENCES
            </ThemedText>
            <ThemedText style={styles.avoidText}>
              Preferred instructors (from the catalog) for ranking
            </ThemedText>

            {visibleProfessorPreferences.map(([courseId, professor]) => {
              const { primary, secondary } = getCoursePresentation(courseId);
              return (
                <View key={courseId} style={styles.preferenceItem}>
                  <View style={styles.preferenceInfo}>
                    <ThemedText style={styles.preferenceCourseTitle}>
                      {primary}
                    </ThemedText>
                    {secondary ? (
                      <ThemedText style={styles.preferenceCourseCode}>
                        {secondary}
                      </ThemedText>
                    ) : null}
                    <ThemedText style={styles.preferenceProfessor}>
                      {professor}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveProfessorPreference(courseId)}
                    style={styles.removeButton}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="close" size={20} color="#9B9B9B" />
                  </TouchableOpacity>
                </View>
              );
            })}

            {getAvailableCourses().length > 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddProfessorPreference}
                activeOpacity={0.7}
              >
                <MaterialIcons name="add" size={24} color="#5B4C9D" />
                <ThemedText style={styles.addButtonText}>
                  Add instructor preference
                </ThemedText>
              </TouchableOpacity>
            ) : null}

            {visibleProfessorPreferences.length === 0 &&
            getAvailableCourses().length === 0 ? (
              <ThemedText style={styles.emptyText}>
                {selectedCourses.size === 0
                  ? "Select courses first to add instructor preferences."
                  : "All eligible courses with catalog instructors already have a preference, or none remain."}
              </ThemedText>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Start Hour Picker Modal */}
      <Modal
        visible={showStartPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStartPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                Select Start Hour
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowStartPicker(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {hourOptions.map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.modalOption,
                    startHour === hour && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setStartHour(hour);
                    setShowStartPicker(false);
                    // Reset end hour if it's now invalid
                    if (hour !== "Any" && endHour !== "Any") {
                      const startIndex = hourOptions.indexOf(hour);
                      const endIndex = hourOptions.indexOf(endHour);
                      if (endIndex <= startIndex) {
                        setEndHour("Any");
                      }
                    }
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      startHour === hour && styles.modalOptionTextSelected,
                    ]}
                  >
                    {hour}
                  </ThemedText>
                  {startHour === hour && (
                    <MaterialIcons name="check" size={20} color="#5B4C9D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* End Hour Picker Modal */}
      <Modal
        visible={showEndPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEndPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select End Hour</ThemedText>
              <TouchableOpacity
                onPress={() => setShowEndPicker(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {getAvailableEndHours().map((hour) => (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.modalOption,
                    endHour === hour && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setEndHour(hour);
                    setShowEndPicker(false);
                  }}
                >
                  <ThemedText
                    style={[
                      styles.modalOptionText,
                      endHour === hour && styles.modalOptionTextSelected,
                    ]}
                  >
                    {hour}
                  </ThemedText>
                  {endHour === hour && (
                    <MaterialIcons name="check" size={20} color="#5B4C9D" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Instructor preference modal */}
      <Modal
        visible={showProfessorModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowProfessorModal(false);
          setSelectedCourseForProfessor(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {selectedCourseForProfessor
                  ? "Select instructor"
                  : "Select course"}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowProfessorModal(false);
                  setSelectedCourseForProfessor(null);
                }}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#1A1A1A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalOptions}>
              {!selectedCourseForProfessor ? (
                // Show available courses
                getAvailableCourses().map((courseId) => {
                  const { primary, secondary } =
                    getCoursePresentation(courseId);
                  return (
                    <TouchableOpacity
                      key={courseId}
                      style={styles.modalOption}
                      onPress={() => handleSelectCourse(courseId)}
                      accessibilityLabel={`${primary}${secondary ? `, ${secondary}` : ""}`}
                    >
                      <View style={styles.modalOptionContent}>
                        <ThemedText style={styles.modalCoursePrimary}>
                          {primary}
                        </ThemedText>
                        {secondary ? (
                          <ThemedText style={styles.modalCourseCode}>
                            {secondary}
                          </ThemedText>
                        ) : null}
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="#9B9B9B"
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                // Show instructors for selected course
                <>
                  <TouchableOpacity
                    style={styles.modalBackButton}
                    onPress={() => setSelectedCourseForProfessor(null)}
                  >
                    <MaterialIcons
                      name="arrow-back"
                      size={20}
                      color="#5B4C9D"
                    />
                    <View style={styles.modalBackTextBlock}>
                      <ThemedText style={styles.modalBackTitle}>
                        {professorModalCoursePres?.primary}
                      </ThemedText>
                      {professorModalCoursePres?.secondary ? (
                        <ThemedText style={styles.modalBackCode}>
                          {professorModalCoursePres.secondary}
                        </ThemedText>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                  {lecturerChoicesForModal.length > 0 ? (
                    lecturerChoicesForModal.map((professor) => (
                      <TouchableOpacity
                        key={professor}
                        style={[
                          styles.modalOption,
                          getInstructorPreferenceForCourse(
                            professorPreferences,
                            selectedCourseForProfessor,
                          ) === professor && styles.modalOptionSelected,
                        ]}
                        onPress={() => handleSelectProfessor(professor)}
                      >
                        <ThemedText
                          style={[
                            styles.modalOptionText,
                            getInstructorPreferenceForCourse(
                              professorPreferences,
                              selectedCourseForProfessor,
                            ) === professor && styles.modalOptionTextSelected,
                          ]}
                        >
                          {professor}
                        </ThemedText>
                        {getInstructorPreferenceForCourse(
                          professorPreferences,
                          selectedCourseForProfessor,
                        ) === professor && (
                          <MaterialIcons
                            name="check"
                            size={20}
                            color="#5B4C9D"
                          />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.emptyModalContent}>
                      <ThemedText style={styles.emptyText}>
                        No instructors listed for this course in the catalog
                      </ThemedText>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION)
          }
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.optimizerButton,
            availabilityError ? styles.optimizerButtonDisabled : null,
          ]}
          activeOpacity={0.8}
          disabled={!!availabilityError}
          accessibilityRole="button"
          accessibilityLabel={
            availabilityError
              ? "Run optimizer, unavailable until availability is fixed"
              : "Run optimizer"
          }
          accessibilityState={{ disabled: !!availabilityError }}
          onPress={() => {
            const check = validatePlannerAvailabilityPreferences({
              startHour,
              endHour,
            });
            if (!check.ok) {
              Alert.alert("Fix availability", check.message);
              return;
            }
            router.push(ROUTES.STUDENT.PLANNER_FLOW.GENERATED_OPTIONS);
          }}
        >
          <ThemedText
            style={[
              styles.optimizerButtonText,
              availabilityError ? styles.optimizerButtonTextDisabled : null,
            ]}
          >
            RUN OPTIMIZER
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
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginTop: 20,
    marginBottom: 8,
  },
  screenHint: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 20,
  },
  availabilityError: {
    marginTop: 12,
    fontSize: 13,
    color: "#B00020",
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  /** Breathing room between TIME SLOTS and instructor preferences */
  instructorPreferencesCard: {
    marginTop: 24,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 16,
  },
  avoidText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    minWidth: 60,
    alignItems: "center",
  },
  dayButtonSelected: {
    backgroundColor: "#E8E6F7",
    borderWidth: 2,
    borderColor: "#5B4C9D",
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  dayButtonTextSelected: {
    color: "#5B4C9D",
  },
  hourContainer: {
    flexDirection: "row",
    gap: 12,
  },
  hourDropdown: {
    flex: 1,
  },
  hourLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: "#1A1A1A",
  },
  backButton: {
    width: 56,
    height: 56,
    backgroundColor: "#2C2C2C",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  optimizerButton: {
    flex: 1,
    height: 56,
    backgroundColor: "#5B4C9D",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  optimizerButtonDisabled: {
    backgroundColor: "#9B8FC9",
  },
  optimizerButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  optimizerButtonTextDisabled: {
    color: "#F0F0F0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalOptions: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalOptionSelected: {
    backgroundColor: "#F8F8F8",
  },
  modalCoursePrimary: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  modalCourseCode: {
    fontSize: 12,
    color: "#9B9B9B",
    marginTop: 4,
  },
  modalOptionText: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  modalOptionTextSelected: {
    color: "#5B4C9D",
    fontWeight: "600",
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    marginBottom: 8,
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceCourseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  preferenceCourseCode: {
    fontSize: 12,
    color: "#9B9B9B",
    marginBottom: 6,
  },
  preferenceProfessor: {
    fontSize: 14,
    color: "#5B4C9D",
  },
  removeButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B4C9D",
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9B9B9B",
    textAlign: "center",
    paddingVertical: 16,
  },
  modalBackButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 8,
  },
  modalBackTextBlock: {
    flex: 1,
    marginLeft: 8,
  },
  modalBackTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  modalBackCode: {
    fontSize: 12,
    color: "#9B9B9B",
    marginTop: 2,
  },
  modalOptionContent: {
    flex: 1,
  },
  modalOptionSubtext: {
    fontSize: 12,
    color: "#9B9B9B",
    marginTop: 2,
  },
  emptyModalContent: {
    paddingVertical: 32,
    alignItems: "center",
  },
});
