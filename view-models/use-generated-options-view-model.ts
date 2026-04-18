import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

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
  buildPlannerGenerationFeedback,
  classifyGenerationTimeout,
} from "@/lib/planner-generation-feedback";
import {
    prerequisiteScheduleDisclosure,
    virtualCompletedCourseNamesForDegreeTier,
} from "@/lib/planner-prerequisite-eligibility";
import {
    computeFitScoreBreakdown,
    DEFAULT_MAX_PLANNER_PROPOSALS,
    generateSchedules,
    lessonMultisetFingerprint,
    validatePlannerAvailabilityPreferences,
} from "@/logic/solver";
import { Days } from "@/types/courses";
import { buildConstraintSummary } from "@/lib/planner-constraint-summary";
import {
  mapSavedPlanWriteErrorToMessage,
  saveGeneratedPlanForCurrentUser,
} from "@/lib/saved-schedule-firestore";
import {
  buildRestartPlannerState,
  createInitialClapDetectionState,
  decideGeneratedBatchClearPolicy,
  evaluateClapSample,
  shouldProcessGeneratedBatchClear,
  shouldTriggerShakeGesture,
  type GeneratedBatchClearTrigger,
} from "@/lib/planner-generated-batch-clear";

type PlannerDayKey = "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI";

export type GeneratedOptionScheduleCell = {
  id: string;
  courseCode: string;
  courseName: string;
  shortDescription?: string;
  lessonKindLabel: string;
  instructorsLine: string;
  location: string;
  time: string;
  startTime: string;
  endTime: string;
  calendarDay: string;
  /** Catalog prerequisite names when present; selection is not blocked when unmet. */
  prerequisiteNames: string[];
  prerequisiteAdvisoryNote: string | null;
  /** True when the scheduled section could not be resolved to a catalog course (prereqs unknown). */
  prerequisiteParentMissing?: boolean;
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

export function useGeneratedOptionsViewModel() {
  const isFocused = useIsFocused();
  const {
    selectedCourses,
    setSelectedCourses,
    selectedDays,
    setSelectedDays,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    setSavedPlans,
    setLastPlannerFlowRoute,
    professorPreferences,
    setProfessorPreferences,
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

  /** Full details for a timetable cell (tap / short blocks). */
  const [courseDetailModal, setCourseDetailModal] = useState<
    GeneratedOptionScheduleCell | null
  >(null);
  const [isClearingBatch, setIsClearingBatch] = useState(false);
  const [savingProposalId, setSavingProposalId] = useState<string | null>(null);
  const isSaveInFlightRef = useRef(false);
  const clapStateRef = useRef(createInitialClapDetectionState());
  const shakeLastTriggeredAtRef = useRef(0);
  const clapPermissionDeniedRef = useRef(false);
  const isClearDialogOpenRef = useRef(false);

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

  const generationResult = useMemo(() => {
    if (!availabilityValidation.ok) {
      return {
        proposals: [] as {
          id: string;
          fitScore: number;
          scoreBreakdown: ReturnType<typeof computeFitScoreBreakdown>;
          schedule: Record<PlannerDayKey, GeneratedOptionScheduleCell[]>;
        }[],
        generationError: null as string | null,
        generationTimedOut: false,
      };
    }
    try {
      const semesterKey = selectedSemester === "Sem 1" ? "A" : "B";
      const catalogYearLetter = catalogLetterForDegreeTier(activeDegreeYearTier);

      const inTerm = filterCoursesForPlannerTerm(
        catalogCourses,
        semesterKey,
        catalogYearLetter,
      );
      const coursesToSchedule = inTerm.filter((course) =>
        selectedCourses.has(course.courseID),
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

      const generationStartedAt = Date.now();
      const solverResult = generateSchedules(
        coursesToSchedule,
        preferences,
        DEFAULT_MAX_PLANNER_PROPOSALS,
      );
      const generationDurationMs = Date.now() - generationStartedAt;
      const generationTimedOut = classifyGenerationTimeout(generationDurationMs);

      const seenVisual = new Set<string>();
      const proposalsDeduped = solverResult.proposals.filter((p) => {
        const key = lessonMultisetFingerprint(p.sections, coursesToSchedule);
        if (seenVisual.has(key)) return false;
        seenVisual.add(key);
        return true;
      });

      return {
        proposals: proposalsDeduped.map((proposal) => {
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
            const prereqDisclosure = parentCourse
              ? prerequisiteScheduleDisclosure(
                  parentCourse,
                  semesterKey,
                  catalogCourses,
                  { completedCourseNames: virtualCompletedCourseNames },
                )
              : {
                  names: [] as string[],
                  advisoryNote: null as string | null,
                };
            const prerequisiteParentMissing = !parentCourse;

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
                  shortDescription: parentCourse?.shortDescription,
                  lessonKindLabel: lessonKindShortLabel(lesson.type),
                  instructorsLine: lecturers.join(" · "),
                  location: lesson.location,
                  time: `${lesson.startTime}-${lesson.endTime}`,
                  startTime: lesson.startTime,
                  endTime: lesson.endTime,
                  calendarDay: dayKey,
                  prerequisiteNames: prereqDisclosure.names,
                  prerequisiteAdvisoryNote: prereqDisclosure.advisoryNote,
                  prerequisiteParentMissing,
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
        }),
        generationError: null as string | null,
          generationTimedOut,
      };
    } catch (error) {
      return {
        proposals: [] as {
          id: string;
          fitScore: number;
          scoreBreakdown: ReturnType<typeof computeFitScoreBreakdown>;
          schedule: Record<PlannerDayKey, GeneratedOptionScheduleCell[]>;
        }[],
        generationError: error instanceof Error ? "GENERATION_FAILED" : "UNKNOWN_GENERATION_ERROR",
        generationTimedOut: false,
      };
    }
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
  const proposals = generationResult.proposals;
  const generationFeedbackPanel = useMemo(
    () =>
      buildPlannerGenerationFeedback({
        availabilityValid: availabilityValidation.ok,
        catalogRetryAvailable: catalogUi.showRetry,
        proposalCount: proposals.length,
        generationError: generationResult.generationError,
        generationTimedOut: generationResult.generationTimedOut,
      }),
    [
      availabilityValidation.ok,
      catalogUi.showRetry,
      proposals.length,
      generationResult.generationError,
      generationResult.generationTimedOut,
    ],
  );

  const selectedCourseInstructorPreferenceCount = useMemo(
    () =>
      Array.from(professorPreferences.keys()).filter((courseId) =>
        selectedCourses.has(courseId),
      ).length,
    [professorPreferences, selectedCourses],
  );
  const constraintCount =
    selectedDays.size +
    (startHour !== "Any" ? 1 : 0) +
    (endHour !== "Any" ? 1 : 0) +
    selectedCourseInstructorPreferenceCount;
  const constraintSummary = useMemo(
    () =>
      buildConstraintSummary({
        blockedDays: selectedDays,
        startHour,
        endHour,
        preferredInstructorCount: selectedCourseInstructorPreferenceCount,
      }),
    [selectedDays, startHour, endHour, selectedCourseInstructorPreferenceCount],
  );
  const shouldConfirmGeneratedBatchClear = true;
  const hasGeneratedBatchVisible =
    isFocused && availabilityValidation.ok && proposals.length > 0;

  const handleSavePlan = useCallback(
    async (proposal: {
      id: string;
      fitScore: number;
      schedule: Record<PlannerDayKey, GeneratedOptionScheduleCell[]>;
    }) => {
      if (isSaveInFlightRef.current) {
        return;
      }
      isSaveInFlightRef.current = true;
      setSavingProposalId(proposal.id);
      try {
        const savedPlan = await saveGeneratedPlanForCurrentUser({
          fitScore: proposal.fitScore,
          schedule: proposal.schedule,
        });
        setSavedPlans((prev) => [...prev, savedPlan]);
        router.push(
          ROUTES.STUDENT.savedDetail(savedPlan.id) as import("expo-router").Href,
        );
      } catch (error) {
        console.error("[UniSmart] Save plan failed", error);
        Alert.alert("Couldn't save this plan", mapSavedPlanWriteErrorToMessage(error));
      } finally {
        isSaveInFlightRef.current = false;
        setSavingProposalId(null);
      }
    },
    [setSavedPlans],
  );

  const clearGeneratedBatchAndRestart = useCallback(() => {
    if (isClearingBatch) return;
    setIsClearingBatch(true);

    const restartState = buildRestartPlannerState();
    setSelectedCourses(restartState.selectedCourses);
    setSelectedDays(restartState.selectedDays);
    setStartHour(restartState.startHour);
    setEndHour(restartState.endHour);
    setProfessorPreferences(restartState.professorPreferences);
    setLastPlannerFlowRoute(restartState.lastPlannerFlowRoute);
    router.replace(ROUTES.STUDENT.PLANNER);
  }, [
    isClearingBatch,
    setEndHour,
    setLastPlannerFlowRoute,
    setProfessorPreferences,
    setSelectedCourses,
    setSelectedDays,
    setStartHour,
  ]);

  const requestGeneratedBatchClear = useCallback(
    (trigger: GeneratedBatchClearTrigger) => {
      if (
        !shouldProcessGeneratedBatchClear({
          trigger,
          hasGeneratedBatchVisible,
          isClearingBatch,
        })
      ) {
        return;
      }
      if (isClearDialogOpenRef.current) return;

      const decision = decideGeneratedBatchClearPolicy({
        trigger,
        requireConfirmation: shouldConfirmGeneratedBatchClear,
      });

      if (!decision.requireConfirmation) {
        clearGeneratedBatchAndRestart();
        return;
      }

      isClearDialogOpenRef.current = true;
      Alert.alert(
        "Clear generated options?",
        `This will discard the current generated schedule batch (${decision.triggerLabel}) and restart planner setup.`,
        [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              isClearDialogOpenRef.current = false;
            },
          },
          {
            text: "Clear and restart",
            style: "destructive",
            onPress: () => {
              isClearDialogOpenRef.current = false;
              clearGeneratedBatchAndRestart();
            },
          },
        ],
        {
          cancelable: true,
          onDismiss: () => {
            isClearDialogOpenRef.current = false;
          },
        },
      );
    },
    [
      clearGeneratedBatchAndRestart,
      hasGeneratedBatchVisible,
      isClearingBatch,
      shouldConfirmGeneratedBatchClear,
    ],
  );

  useEffect(() => {
    if (!hasGeneratedBatchVisible) return;

    let isMounted = true;
    let shakeSubscription: { remove: () => void } | null = null;

    const startShakeListener = async () => {
      try {
        const sensorModule = await import("expo-sensors");
        if (!isMounted) return;
        const Accelerometer = sensorModule.Accelerometer;
        if (!Accelerometer) return;

        Accelerometer.setUpdateInterval?.(220);
        shakeSubscription = Accelerometer.addListener(
          ({ x, y, z }: { x: number; y: number; z: number }) => {
            const verdict = shouldTriggerShakeGesture({
              x,
              y,
              z,
              nowMs: Date.now(),
              lastTriggeredAtMs: shakeLastTriggeredAtRef.current,
            });
            if (!verdict.shouldTrigger) return;
            shakeLastTriggeredAtRef.current = verdict.lastTriggeredAtMs;
            requestGeneratedBatchClear("shake");
          },
        );
      } catch {
        // Motion sensor path is optional; button restart remains available.
      }
    };

    void startShakeListener();

    return () => {
      isMounted = false;
      shakeSubscription?.remove();
      shakeSubscription = null;
    };
  }, [hasGeneratedBatchVisible, requestGeneratedBatchClear]);

  useEffect(() => {
    if (!hasGeneratedBatchVisible) return;

    let isMounted = true;
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let recording: {
      prepareToRecordAsync: (options: unknown) => Promise<void>;
      startAsync: () => Promise<void>;
      stopAndUnloadAsync: () => Promise<void>;
      getStatusAsync: () => Promise<unknown>;
    } | null = null;
    let Audio: {
      getPermissionsAsync: () => Promise<{ granted: boolean; canAskAgain?: boolean }>;
      requestPermissionsAsync: () => Promise<{ granted: boolean }>;
      setAudioModeAsync: (mode: {
        allowsRecordingIOS: boolean;
        playsInSilentModeIOS?: boolean;
      }) => Promise<void>;
      Recording: new () => {
        prepareToRecordAsync: (options: unknown) => Promise<void>;
        startAsync: () => Promise<void>;
        stopAndUnloadAsync: () => Promise<void>;
        getStatusAsync: () => Promise<unknown>;
      };
      RecordingOptionsPresets: {
        LOW_QUALITY: {
          android?: Record<string, unknown>;
          ios?: Record<string, unknown>;
          [key: string]: unknown;
        };
      };
    } | null = null;
    let isPollingMetering = false;

    const startClapListener = async () => {
      try {
        const expoAvModule = await import("expo-av");
        Audio = expoAvModule.Audio as unknown as NonNullable<typeof Audio>;
        if (!isMounted || !Audio || clapPermissionDeniedRef.current) return;

        const currentPermission = await Audio.getPermissionsAsync();
        if (!isMounted) return;
        let permissionGranted = currentPermission.granted;
        if (!permissionGranted && currentPermission.canAskAgain) {
          const requestedPermission = await Audio.requestPermissionsAsync();
          if (!isMounted) return;
          permissionGranted = requestedPermission.granted;
        }
        if (!permissionGranted) {
          clapPermissionDeniedRef.current = true;
          Alert.alert(
            "Clap reset unavailable",
            "Microphone access is disabled. You can still clear generated options with START OVER.",
          );
          return;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: false,
        });
        if (!isMounted) return;

        recording = new Audio.Recording();
        await recording.prepareToRecordAsync({
          ...Audio.RecordingOptionsPresets.LOW_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.LOW_QUALITY.android,
            isMeteringEnabled: true,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.LOW_QUALITY.ios,
            isMeteringEnabled: true,
          },
        });
        if (!isMounted) return;
        await recording.startAsync();

        pollingInterval = setInterval(async () => {
          if (isPollingMetering || !recording) return;
          isPollingMetering = true;
          try {
            const status = await recording.getStatusAsync();
            if (!isMounted) return;
            if (!(status as { isRecording?: boolean }).isRecording) return;
            const metering = (status as { metering?: number }).metering;
            if (typeof metering !== "number") {
              return;
            }

            const verdict = evaluateClapSample({
              state: clapStateRef.current,
              metering,
              nowMs: Date.now(),
            });
            clapStateRef.current = verdict.nextState;
            if (verdict.shouldTrigger) {
              requestGeneratedBatchClear("clap");
            }
          } catch {
            // Keep UI functional if metering polling fails.
          } finally {
            isPollingMetering = false;
          }
        }, 180);
      } catch {
        // Audio sensor path is optional; keep planner fully usable without it.
      }
    };

    void startClapListener();

    return () => {
      isMounted = false;
      clapStateRef.current = createInitialClapDetectionState();
      if (pollingInterval) clearInterval(pollingInterval);
      pollingInterval = null;
      if (recording) {
        void recording.stopAndUnloadAsync().catch(() => {
          // Ignore stop errors from already-stopped recorders.
        });
      }
      if (Audio) {
        void Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        }).catch(() => {
          // Ignore audio mode reset errors.
        });
      }
    };
  }, [hasGeneratedBatchVisible, requestGeneratedBatchClear]);

  const goToCustomRules = () => {
    router.push(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES);
  };

  return {
    isFocused,
    selectedCourses,
    setSelectedCourses,
    selectedDays,
    setSelectedDays,
    startHour,
    setStartHour,
    endHour,
    setEndHour,
    setSavedPlans,
    setLastPlannerFlowRoute,
    professorPreferences,
    setProfessorPreferences,
    selectedSemester,
    activeDegreeYearTier,
    catalogCourses,
    catalogLoading,
    catalogSource,
    catalogLoadError,
    hasFirebaseDb,
    refreshCatalog,
    scrollViewProps,
    virtualCompletedCourseNames,
    courseDetailModal,
    setCourseDetailModal,
    isClearingBatch,
    setIsClearingBatch,
    savingProposalId,
    setSavingProposalId,
    isSaveInFlightRef,
    clapStateRef,
    shakeLastTriggeredAtRef,
    clapPermissionDeniedRef,
    isClearDialogOpenRef,
    activeTermSummary,
    catalogUi,
    availabilityValidation,
    generationResult,
    proposals,
    generationFeedbackPanel,
    selectedCourseInstructorPreferenceCount,
    constraintCount,
    constraintSummary,
    shouldConfirmGeneratedBatchClear,
    hasGeneratedBatchVisible,
    handleSavePlan,
    clearGeneratedBatchAndRestart,
    requestGeneratedBatchClear,
    goToCustomRules,
  };
}
