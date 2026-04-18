import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import {
    buildEnrollmentNotificationEvent,
    dispatchGenericEnrollmentNotification,
    GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
} from "@/lib/enrollment-notification-logic";
import { db } from "@/lib/firebase";
import { sendLocalNotification } from "@/lib/push-notification-runtime";
import {
    createWaitlistInterestForCurrentUser,
    listWaitlistInterestsForCurrentUser,
    mapWaitlistInterestErrorToMessage,
    removeWaitlistInterestForCurrentUser,
} from "@/lib/waitlist-interest-firestore";
import { sectionAppearsFullForWaitlistUi } from "@/lib/waitlist-seat-opening";
import type { Course, CourseSection } from "@/types/courses";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
    collection,
    getDocs,
    onSnapshot,
    query,
    where,
    type DocumentData,
    type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

import { PlannerCatalogStatusBanner } from "@/components/planner-catalog-status-banner";
import { usePlannerCatalog } from "@/contexts/bgu-planner-catalog-context";
import { coerceFirestoreFiniteNumber } from "@/lib/bgu-catalog-to-courses";
import {
    catalogLetterForDegreeTier,
    DEGREE_YEAR_PLANNER_OPTIONS,
    filterCoursesForPlannerTerm,
} from "@/lib/planner-active-term";
import { buildPlannerCatalogUiModel } from "@/lib/planner-catalog-ui-messages";
export default function CourseSelectionScreen() {
  const {
    selectedCourses,
    setSelectedCourses,
    setLastPlannerFlowRoute,
    userInfo,
    selectedSemester,
    activeDegreeYearTier,
    setAlerts,
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
    TAB_SCROLL_KEYS.PLANNER_FLOW_COURSE_SELECTION,
  );

  // Save this route as the last visited planner flow route
  useEffect(() => {
    setLastPlannerFlowRoute(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION);
  }, [setLastPlannerFlowRoute]);

  const semesterKey = selectedSemester === "Sem 1" ? "A" : "B";
  const catalogYearLetter = catalogLetterForDegreeTier(activeDegreeYearTier);

  const courses = useMemo(() => {
    return filterCoursesForPlannerTerm(
      catalogCourses,
      semesterKey,
      catalogYearLetter,
    );
  }, [semesterKey, catalogYearLetter, catalogCourses]);
  const [pendingWaitlistSectionId, setPendingWaitlistSectionId] = useState<
    string | null
  >(null);
  const [waitlistedSectionIds, setWaitlistedSectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [waitlistedSectionsByCourse, setWaitlistedSectionsByCourse] = useState<
    Map<string, Set<string>>
  >(() => new Map());
  const [firestoreCourseIdsForWaitlist, setFirestoreCourseIdsForWaitlist] =
    useState<Set<string>>(() => new Set());
  const waitlistedCourseIds = useMemo(
    () => new Set(waitlistedSectionsByCourse.keys()),
    [waitlistedSectionsByCourse],
  );
  const previousSectionIsFullRef = useRef<Map<string, boolean>>(new Map());
  const previousWaitlistedCourseAllFullRef = useRef<Map<string, boolean>>(
    new Map(),
  );
  const recentNotificationMsByKeyRef = useRef<Map<string, number>>(new Map());
  /** Avoid firing “seat opened” on first catalog snapshot or when waitlist membership changes. */
  const seatOpenNotifyBaselineReadyRef = useRef(false);
  const seatOpenNotifyBaselineWaitlistKeyRef = useRef("");
  const courseSeatOpenNotifyBaselineReadyRef = useRef(false);
  const courseSeatOpenNotifyBaselineWaitlistKeyRef = useRef("");

  const waitlistedSectionIdsKey = useMemo(
    () => Array.from(waitlistedSectionIds).sort().join(","),
    [waitlistedSectionIds],
  );
  const waitlistedCourseIdsKey = useMemo(
    () => Array.from(waitlistedCourseIds).sort().join(","),
    [waitlistedCourseIds],
  );

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

  const toggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const hasSelectedCourses = selectedCourses.size > 0;
  const waitlistSupportDetected = useMemo(
    () =>
      courses.some((course) =>
        course.availableSections.some((section) => section.waitlistSupported),
      ),
    [courses],
  );

  const waitlistSectionWhenAllFull = (course: Course): CourseSection | undefined => {
    const waitlistSupportedSections = course.availableSections.filter(
      (section) => section.waitlistSupported,
    );
    if (waitlistSupportedSections.length === 0) return undefined;
    const allSectionsFull = waitlistSupportedSections.every((section) =>
      sectionAppearsFullForWaitlistUi(section),
    );
    if (!allSectionsFull) return undefined;
    return waitlistSupportedSections[0];
  };

  const enrollmentOpenedMessage = (courseName: string, sectionId?: string) =>
    sectionId && sectionId !== "waitlist"
      ? `${courseName} (${sectionId}) now has open seats.`
      : `${courseName} now has open seats.`;

  const shouldEmitEnrollmentNotification = (
    courseId: string,
    sectionId: string,
  ) => {
    const now = Date.now();
    const ttlMs = 15000;
    const key = `${courseId}|${sectionId}|opened`;
    const recent = recentNotificationMsByKeyRef.current;
    for (const [k, ts] of Array.from(recent.entries())) {
      if (now - ts > ttlMs) {
        recent.delete(k);
      }
    }
    const lastTs = recent.get(key);
    if (typeof lastTs === "number" && now - lastTs < ttlMs) {
      return false;
    }
    recent.set(key, now);
    return true;
  };

  const handleJoinWaitlist = async (input: {
    courseId: string;
    courseName: string;
    sectionId: string;
  }) => {
    if (pendingWaitlistSectionId) return;
    const wasAlreadyWaitlisted = waitlistedSectionIds.has(input.sectionId);
    setPendingWaitlistSectionId(input.sectionId);
    try {
      if (wasAlreadyWaitlisted) {
        const result = await removeWaitlistInterestForCurrentUser({
          courseId: input.courseId,
          sectionId: input.sectionId,
          status: "waitlist",
        });
        setWaitlistedSectionIds((current) => {
          const next = new Set(current);
          next.delete(input.sectionId);
          return next;
        });
        setWaitlistedSectionsByCourse((current) => {
          const next = new Map(current);
          const sections = next.get(input.courseId);
          if (sections) {
            sections.delete(input.sectionId);
            if (sections.size === 0) {
              next.delete(input.courseId);
            } else {
              next.set(input.courseId, new Set(sections));
            }
          }
          return next;
        });
        Alert.alert(
          result.removedCount > 0 ? "Waitlist cancelled" : "Already removed",
          result.removedCount > 0
            ? `${input.courseName} (${input.sectionId}) was removed from your waitlist.`
            : `${input.courseName} (${input.sectionId}) is no longer in your waitlist.`,
        );
      } else {
        await createWaitlistInterestForCurrentUser({
          courseId: input.courseId,
          courseName: input.courseName,
          sectionId: input.sectionId,
          status: "waitlist",
        });
        setWaitlistedSectionIds((current) => {
          const next = new Set(current);
          next.add(input.sectionId);
          return next;
        });
        setWaitlistedSectionsByCourse((current) => {
          const next = new Map(current);
          const sections = new Set(next.get(input.courseId) ?? []);
          sections.add(input.sectionId);
          next.set(input.courseId, sections);
          return next;
        });
        Alert.alert(
          "Waitlist request sent",
          `${input.courseName} (${input.sectionId}) was added to your waitlist interests.`,
        );
      }
    } catch (error) {
      const defaultMessage = mapWaitlistInterestErrorToMessage(error);
      const permissionMessage =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code === "permission-denied"
          ? wasAlreadyWaitlisted
            ? "You do not have permission to cancel this waitlist right now. Please sign in again and try once more."
            : "You do not have permission to join this waitlist right now. Please sign in again and try once more."
          : defaultMessage;
      Alert.alert("Couldn't update waitlist", permissionMessage);
    } finally {
      setPendingWaitlistSectionId(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const records = await listWaitlistInterestsForCurrentUser();
        if (cancelled) return;
        const sectionIds = records
          .filter((record) => record.status === "waitlist")
          .map((record) => record.sectionId);
        setWaitlistedSectionIds(new Set(sectionIds));
        const sectionsByCourse = new Map<string, Set<string>>();
        for (const record of records) {
          if (record.status !== "waitlist") {
            continue;
          }
          const sections = new Set(sectionsByCourse.get(record.courseId) ?? []);
          sections.add(record.sectionId);
          sectionsByCourse.set(record.courseId, sections);
        }
        setWaitlistedSectionsByCourse(sectionsByCourse);
      } catch {
        if (cancelled) return;
        setWaitlistedSectionIds(new Set());
        setWaitlistedSectionsByCourse(new Map());
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!db || waitlistedCourseIds.size === 0) {
      setFirestoreCourseIdsForWaitlist(new Set());
      return;
    }
    let cancelled = false;
    void (async () => {
      const plannerCourseIds = Array.from(waitlistedCourseIds);
      const waitlistedCourseNames = plannerCourseIds
        .map((courseId) =>
          courses
            .find((course) => course.courseID === courseId)
            ?.courseName?.trim(),
        )
        .filter((name): name is string => Boolean(name));
      if (waitlistedCourseNames.length === 0) {
        if (!cancelled) {
          setFirestoreCourseIdsForWaitlist(new Set());
        }
        return;
      }

      const resolvedFirestoreIds = new Set<string>();
      for (let i = 0; i < waitlistedCourseNames.length; i += 10) {
        const chunk = waitlistedCourseNames.slice(i, i + 10);
        const snap = await getDocs(
          query(
            collection(db, "bgu_cs_courses"),
            where("displayName", "in", chunk),
          ),
        );
        for (const docSnap of snap.docs) {
          resolvedFirestoreIds.add(docSnap.id);
        }
      }

      if (!cancelled) {
        if (__DEV__) {
          console.log(
            "[waitlist] mapped planner waitlist courses to firestore ids",
            {
              plannerCourseIds,
              waitlistedCourseNames,
              firestoreCourseIds: Array.from(resolvedFirestoreIds),
            },
          );
        }
        setFirestoreCourseIdsForWaitlist(resolvedFirestoreIds);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courses, waitlistedCourseIds]);

  useEffect(() => {
    if (!db || firestoreCourseIdsForWaitlist.size === 0) {
      return;
    }
    const activeCourseIds = Array.from(firestoreCourseIdsForWaitlist);

    const chunks: string[][] = [];
    for (let i = 0; i < activeCourseIds.length; i += 10) {
      chunks.push(activeCourseIds.slice(i, i + 10));
    }
    const chunkInitialDone = chunks.map(() => false);
    const chunkLastSummaryKey = chunks.map(() => "");

    const stableRemainingSummaryKey = (
      summary: Record<string, number | null>,
    ) =>
      Object.keys(summary)
        .sort()
        .map((id) => `${id}:${summary[id]}`)
        .join("|");

    /** Every offering doc in this snapshot that belongs to our course ids — catches edits
     *  where max(remaining) across rows stays the same but one row (e.g. lecture) changed. */
    const offeringsSeatFingerprint = (
      snapDocs: readonly QueryDocumentSnapshot<DocumentData>[],
      courseIdSet: Set<string>,
    ): string => {
      const parts: string[] = [];
      for (const docSnap of snapDocs) {
        const data = docSnap.data() as {
          courseId?: unknown;
          capacity?: unknown;
          occupancy?: unknown;
        };
        if (typeof data.courseId !== "string") {
          continue;
        }
        const courseId = data.courseId.trim();
        if (!courseIdSet.has(courseId)) {
          continue;
        }
        const cap = coerceFirestoreFiniteNumber(data.capacity);
        const occ = coerceFirestoreFiniteNumber(data.occupancy);
        parts.push(`${docSnap.id}:${cap ?? "na"}:${occ ?? "na"}`);
      }
      parts.sort();
      return parts.join("|");
    };

    const unsubs = chunks.map((courseIdsChunk, chunkIndex) => {
      const courseIdSet = new Set(courseIdsChunk);
      return onSnapshot(
        query(
          collection(db, "bgu_cs_offerings"),
          where("courseId", "in", courseIdsChunk),
        ),
        { includeMetadataChanges: true },
        (snap) => {
          const remainingSummary: Record<string, number | null> = {};
          const currentRemainingByCourse = new Map<string, number | null>();
          for (const courseId of courseIdsChunk) {
            currentRemainingByCourse.set(courseId, null);
          }
          for (const docSnap of snap.docs) {
            const data = docSnap.data() as {
              courseId?: unknown;
              capacity?: unknown;
              occupancy?: unknown;
            };
            if (typeof data.courseId !== "string") {
              continue;
            }
            const courseId = data.courseId.trim();
            if (!currentRemainingByCourse.has(courseId)) {
              continue;
            }
            const capacity = coerceFirestoreFiniteNumber(data.capacity);
            const occupancy = coerceFirestoreFiniteNumber(data.occupancy);
            if (capacity === null || occupancy === null) {
              continue;
            }
            const remaining = Math.max(0, capacity - occupancy);
            const existing = currentRemainingByCourse.get(courseId);
            if (existing === null || remaining > existing) {
              currentRemainingByCourse.set(courseId, remaining);
            }
          }

          for (const [courseId, currentRemaining] of currentRemainingByCourse) {
            remainingSummary[courseId] = currentRemaining;
          }
          const summaryKey = stableRemainingSummaryKey(remainingSummary);
          const seatFingerprint = offeringsSeatFingerprint(
            snap.docs,
            courseIdSet,
          );
          const changes = snap.docChanges();
          if (__DEV__) {
            console.log(
              "[waitlist] offerings snapshot for waitlisted courses",
              {
                chunkIndex,
                remainingSummary,
                seatFingerprint,
                firstSnapshot: !chunkInitialDone[chunkIndex],
                docChanges: changes.map((change) => change.type),
                fromCache: snap.metadata.fromCache,
              },
            );
          }
          if (!chunkInitialDone[chunkIndex]) {
            chunkInitialDone[chunkIndex] = true;
            chunkLastSummaryKey[chunkIndex] = `${summaryKey}#${seatFingerprint}`;
            if (
              changes.length === 0 ||
              changes.every((change) => change.type === "added")
            ) {
              return;
            }
            void refreshCatalog();
            return;
          }
          const combinedKey = `${summaryKey}#${seatFingerprint}`;
          if (
            changes.length > 0 ||
            combinedKey !== chunkLastSummaryKey[chunkIndex]
          ) {
            void refreshCatalog();
          }
          chunkLastSummaryKey[chunkIndex] = combinedKey;
        },
      );
    });
    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [firestoreCourseIdsForWaitlist, refreshCatalog]);

  useEffect(() => {
    const previous = previousSectionIsFullRef.current;
    const sectionMeta = new Map<
      string,
      {
        catalogFull: boolean;
        remainingSeats: number | null;
        courseId: string;
        courseName: string;
      }
    >();
    for (const course of courses) {
      for (const section of course.availableSections) {
        sectionMeta.set(section.sectionID, {
          catalogFull: sectionAppearsFullForWaitlistUi(section),
          remainingSeats:
            typeof section.remainingSeats === "number" &&
            !Number.isNaN(section.remainingSeats)
              ? section.remainingSeats
              : null,
          courseId: course.courseID,
          courseName: course.courseName,
        });
      }
    }

    for (const trackedSectionId of Array.from(previous.keys())) {
      if (!waitlistedSectionIds.has(trackedSectionId)) {
        previous.delete(trackedSectionId);
      }
    }

    if (waitlistedSectionIdsKey.length === 0) {
      seatOpenNotifyBaselineReadyRef.current = false;
      seatOpenNotifyBaselineWaitlistKeyRef.current = "";
    } else if (
      seatOpenNotifyBaselineWaitlistKeyRef.current !== waitlistedSectionIdsKey
    ) {
      seatOpenNotifyBaselineWaitlistKeyRef.current = waitlistedSectionIdsKey;
      seatOpenNotifyBaselineReadyRef.current = false;
    }

    const canEmitSeatOpening = !catalogLoading;

    const emitSectionSeatOpenedIfNeeded = (
      waitlistedSectionId: string,
      current: {
        catalogFull: boolean;
        remainingSeats: number | null;
        courseId: string;
        courseName: string;
      },
      wasFull: boolean | undefined,
    ) => {
      if (wasFull !== true || current.catalogFull) {
        return;
      }
      if (__DEV__) {
        console.log("[waitlist] seat opening detected", {
          sectionId: waitlistedSectionId,
          courseId: current.courseId,
          previousRemaining: 0,
          currentRemaining: current.remainingSeats,
        });
      }
      const event = buildEnrollmentNotificationEvent(
        {
          previousRemaining: 0,
          currentRemaining: current.remainingSeats,
          remainingDelta:
            current.remainingSeats === null ? null : current.remainingSeats,
          shouldNotifyGenericEnrollment: true,
        },
        {
          courseId: current.courseId,
          courseName: current.courseName,
          sectionId: waitlistedSectionId,
        },
      );
      if (!event) {
        return;
      }
      if (
        !shouldEmitEnrollmentNotification(
          current.courseId,
          waitlistedSectionId,
        )
      ) {
        if (__DEV__) {
          console.log("[waitlist] duplicate notification suppressed", {
            courseId: current.courseId,
            sectionId: waitlistedSectionId,
          });
        }
        return;
      }
      const detailedMessage = enrollmentOpenedMessage(
        current.courseName,
        waitlistedSectionId,
      );
      const alertId = `enrollment-${waitlistedSectionId}-${event.inAppDetail.createdAtMs}`;
      void dispatchGenericEnrollmentNotification(event, async (payload) => {
        Alert.alert(payload.title, detailedMessage);
        await sendLocalNotification({
          title: payload.title,
          body: detailedMessage,
          data: {
            alertId,
            courseId: current.courseId,
            sectionId: waitlistedSectionId,
          },
        });
      });
      setAlerts((prevAlerts) => [
        {
          id: alertId,
          title: GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
          message: `${detailedMessage} Open planner for details.`,
          isRead: false,
          createdAtMs: event.inAppDetail.createdAtMs,
        },
        ...prevAlerts,
      ]);
    };

    if (canEmitSeatOpening && waitlistedSectionIds.size > 0) {
      if (!seatOpenNotifyBaselineReadyRef.current) {
        seatOpenNotifyBaselineReadyRef.current = true;
      }
      for (const waitlistedSectionId of waitlistedSectionIds) {
        const current = sectionMeta.get(waitlistedSectionId);
        if (!current) {
          continue;
        }
        emitSectionSeatOpenedIfNeeded(
          waitlistedSectionId,
          current,
          previous.get(waitlistedSectionId),
        );
      }
    }

    for (const waitlistedSectionId of waitlistedSectionIds) {
      const current = sectionMeta.get(waitlistedSectionId);
      if (!current) {
        continue;
      }
      previous.set(waitlistedSectionId, current.catalogFull);
    }
  }, [
    catalogLoading,
    courses,
    setAlerts,
    waitlistedSectionIds,
    waitlistedSectionIdsKey,
  ]);

  useEffect(() => {
    const previous = previousWaitlistedCourseAllFullRef.current;
    for (const trackedCourseId of Array.from(previous.keys())) {
      if (!waitlistedCourseIds.has(trackedCourseId)) {
        previous.delete(trackedCourseId);
      }
    }

    if (waitlistedCourseIdsKey.length === 0) {
      courseSeatOpenNotifyBaselineReadyRef.current = false;
      courseSeatOpenNotifyBaselineWaitlistKeyRef.current = "";
    } else if (
      courseSeatOpenNotifyBaselineWaitlistKeyRef.current !==
      waitlistedCourseIdsKey
    ) {
      courseSeatOpenNotifyBaselineWaitlistKeyRef.current = waitlistedCourseIdsKey;
      courseSeatOpenNotifyBaselineReadyRef.current = false;
    }

    const canEmitCourseSeatOpening = !catalogLoading;

    const emitCourseSeatOpenedIfNeeded = (
      waitlistedCourseId: string,
      course: Course,
      waitlistSupportedSections: CourseSection[],
      wasAllFull: boolean | undefined,
    ) => {
      const currentlyAllFull = waitlistSupportedSections.every((section) =>
        sectionAppearsFullForWaitlistUi(section),
      );
      if (wasAllFull !== true || currentlyAllFull) {
        return;
      }
      const currentRemaining = waitlistSupportedSections.reduce<
        number | null
      >((best, section) => {
        if (
          typeof section.remainingSeats !== "number" ||
          Number.isNaN(section.remainingSeats)
        ) {
          return best;
        }
        if (best === null || section.remainingSeats > best) {
          return section.remainingSeats;
        }
        return best;
      }, null);
      if (__DEV__) {
        console.log("[waitlist] course-level full->open detected", {
          courseId: waitlistedCourseId,
          courseName: course.courseName,
          currentRemaining,
        });
      }
      const fallbackSectionId =
        Array.from(
          waitlistedSectionsByCourse.get(waitlistedCourseId) ?? [],
        )[0] ?? "waitlist";
      const event = buildEnrollmentNotificationEvent(
        {
          previousRemaining: 0,
          currentRemaining,
          remainingDelta: currentRemaining === null ? null : currentRemaining,
          shouldNotifyGenericEnrollment: true,
        },
        {
          courseId: waitlistedCourseId,
          courseName: course.courseName,
          sectionId: fallbackSectionId,
        },
      );
      if (!event) {
        return;
      }
      if (
        !shouldEmitEnrollmentNotification(
          waitlistedCourseId,
          fallbackSectionId,
        )
      ) {
        if (__DEV__) {
          console.log("[waitlist] duplicate notification suppressed", {
            courseId: waitlistedCourseId,
            sectionId: fallbackSectionId,
          });
        }
        return;
      }
      const detailedMessage = enrollmentOpenedMessage(
        course.courseName,
        fallbackSectionId,
      );
      const alertId = `enrollment-course-${waitlistedCourseId}-${event.inAppDetail.createdAtMs}`;
      void dispatchGenericEnrollmentNotification(event, async (payload) => {
        Alert.alert(payload.title, detailedMessage);
        await sendLocalNotification({
          title: payload.title,
          body: detailedMessage,
          data: {
            alertId,
            courseId: waitlistedCourseId,
            sectionId: fallbackSectionId,
          },
        });
      });
      setAlerts((prevAlerts) => [
        {
          id: alertId,
          title: GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
          message: `${detailedMessage} Open planner for details.`,
          isRead: false,
          createdAtMs: event.inAppDetail.createdAtMs,
        },
        ...prevAlerts,
      ]);
    };

    if (canEmitCourseSeatOpening && waitlistedCourseIds.size > 0) {
      if (!courseSeatOpenNotifyBaselineReadyRef.current) {
        courseSeatOpenNotifyBaselineReadyRef.current = true;
      }
      for (const waitlistedCourseId of waitlistedCourseIds) {
        const course = courses.find(
          (item) => item.courseID === waitlistedCourseId,
        );
        if (!course) {
          continue;
        }
        const waitlistSupportedSections = course.availableSections.filter(
          (section) => section.waitlistSupported,
        );
        if (waitlistSupportedSections.length === 0) {
          continue;
        }
        emitCourseSeatOpenedIfNeeded(
          waitlistedCourseId,
          course,
          waitlistSupportedSections,
          previous.get(waitlistedCourseId),
        );
      }
    }

    for (const waitlistedCourseId of waitlistedCourseIds) {
      const course = courses.find(
        (item) => item.courseID === waitlistedCourseId,
      );
      if (!course) {
        continue;
      }
      const waitlistSupportedSections = course.availableSections.filter(
        (section) => section.waitlistSupported,
      );
      if (waitlistSupportedSections.length === 0) {
        continue;
      }
      const currentlyAllFull = waitlistSupportedSections.every((section) =>
        sectionAppearsFullForWaitlistUi(section),
      );
      previous.set(waitlistedCourseId, currentlyAllFull);
    }
  }, [
    catalogLoading,
    courses,
    setAlerts,
    waitlistedCourseIds,
    waitlistedCourseIdsKey,
    waitlistedSectionsByCourse,
  ]);

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>UniSmart</ThemedText>
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
        {/* Curriculum Filter */}
        <View style={styles.curriculumFilter}>
          <ThemedText style={styles.filterLabel}>CURRICULUM FILTER</ThemedText>
          <ThemedText style={styles.filterTitle}>
            {userInfo.major || "Computer Science"}
            {userInfo.academicLevel ? ` — ${userInfo.academicLevel}` : ""}
          </ThemedText>
          <ThemedText style={styles.filterSemester}>
            Active term: {activeTermSummary}
          </ThemedText>
          <PlannerCatalogStatusBanner
            ui={catalogUi}
            loading={catalogLoading}
            onRetry={refreshCatalog}
          />
        </View>

        {/* Course List */}
        <View style={styles.courseListSection}>
          <ThemedText style={styles.sectionLabel}>COURSE LIST</ThemedText>
          {!waitlistSupportDetected ? (
            <View style={styles.waitlistUnavailableCard}>
              <ThemedText style={styles.waitlistUnavailableTitle}>
                Waitlist unavailable in this build
              </ThemedText>
              <ThemedText style={styles.waitlistUnavailableBody}>
                This catalog does not expose full-section waitlist support yet,
                so waitlist actions are disabled (no dead taps).
              </ThemedText>
            </View>
          ) : null}
          {!catalogLoading && courses.length === 0 ? (
            <View style={styles.emptyCatalog}>
              <ThemedText style={styles.emptyCatalogTitle}>
                No courses for this term
              </ThemedText>
              <ThemedText style={styles.emptyCatalogBody}>
                {catalogUi.showRetry
                  ? `No courses in the loaded catalog match ${activeTermSummary}. If you expected classes here, try another degree year or semester on the planner home screen, or retry loading the catalog from Firestore.`
                  : `No courses in the loaded catalog match ${activeTermSummary}. Try another degree year or semester on the planner home screen.`}
              </ThemedText>
              {catalogUi.showRetry ? (
                <TouchableOpacity
                  style={[
                    styles.emptyRetry,
                    catalogLoading ? styles.emptyRetryDisabled : null,
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
                  <ThemedText style={styles.emptyRetryText}>
                    Retry Firestore
                  </ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
          {courses.map((course) => {
            const isSelected = selectedCourses.has(course.courseID);
            const fullSection = waitlistSectionWhenAllFull(course);
            const isWaitlistPending =
              fullSection !== undefined &&
              pendingWaitlistSectionId === fullSection.sectionID;
            const isAlreadyWaitlisted =
              fullSection !== undefined &&
              waitlistedSectionIds.has(fullSection.sectionID);
            return (
              <View key={course.courseID} style={styles.courseCardWrapper}>
                <TouchableOpacity
                  style={styles.courseCard}
                  onPress={() => toggleCourse(course.courseID)}
                  activeOpacity={0.7}
                >
                  <View style={styles.courseCardContent}>
                    <View style={styles.courseInfo}>
                      <ThemedText style={styles.courseCode}>
                        {course.courseID}
                      </ThemedText>
                      <ThemedText style={styles.courseName}>
                        {course.courseName}
                      </ThemedText>
                      <ThemedText style={styles.courseCredits}>
                        {course.credits} Credits
                      </ThemedText>
                    </View>
                    <View
                      style={[
                        styles.checkIcon,
                        isSelected && styles.checkIconSelected,
                      ]}
                    >
                      {isSelected && (
                        <MaterialIcons name="check" size={20} color="#FFFFFF" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                {fullSection ? (
                  <TouchableOpacity
                    style={[
                      styles.waitlistButton,
                      isAlreadyWaitlisted ? styles.waitlistButtonActive : null,
                      isWaitlistPending ? styles.waitlistButtonDisabled : null,
                    ]}
                    onPress={() =>
                      void handleJoinWaitlist({
                        courseId: course.courseID,
                        courseName: course.courseName,
                        sectionId: fullSection.sectionID,
                      })
                    }
                    disabled={
                      isWaitlistPending || pendingWaitlistSectionId !== null
                    }
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isAlreadyWaitlisted
                        ? `Cancel waitlist for ${course.courseName}`
                        : `Join waitlist for ${course.courseName}`
                    }
                    accessibilityState={{
                      disabled:
                        isWaitlistPending || pendingWaitlistSectionId !== null,
                    }}
                  >
                    <ThemedText style={styles.waitlistButtonText}>
                      {isWaitlistPending
                        ? isAlreadyWaitlisted
                          ? "CANCELLING WAITLIST..."
                          : "JOINING WAITLIST..."
                        : isAlreadyWaitlisted
                          ? "ALREADY IN WAITLIST · TAP TO CANCEL"
                          : "JOIN WAITLIST"}
                    </ThemedText>
                  </TouchableOpacity>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setLastPlannerFlowRoute(null);
            router.push(ROUTES.STUDENT.PLANNER);
          }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.solverButton,
            !hasSelectedCourses && styles.solverButtonDisabled,
          ]}
          activeOpacity={hasSelectedCourses ? 0.8 : 1}
          disabled={!hasSelectedCourses}
          onPress={() => {
            if (hasSelectedCourses) {
              router.push(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES);
            }
          }}
        >
          <ThemedText
            style={[
              styles.solverButtonText,
              !hasSelectedCourses && styles.solverButtonTextDisabled,
            ]}
          >
            SOLVER SETUP
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
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
  curriculumFilter: {
    backgroundColor: "#5B4C9D",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  filterSemester: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  emptyCatalog: {
    paddingVertical: 20,
    paddingHorizontal: 4,
  },
  emptyCatalogTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyCatalogBody: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyRetry: {
    alignSelf: "flex-start",
    backgroundColor: "#5B4C9D",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  emptyRetryDisabled: {
    opacity: 0.55,
  },
  emptyRetryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  courseListSection: {
    marginBottom: 32,
  },
  waitlistUnavailableCard: {
    backgroundColor: "#FFF4E5",
    borderColor: "#FFD8A8",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  waitlistUnavailableTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9C5B16",
    marginBottom: 6,
  },
  waitlistUnavailableBody: {
    fontSize: 12,
    color: "#7A5A2A",
    lineHeight: 17,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  courseCardWrapper: {
    marginBottom: 12,
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 16,
  },
  courseCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5B4C9D",
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  courseCredits: {
    fontSize: 14,
    color: "#9B9B9B",
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIconSelected: {
    backgroundColor: "#5B4C9D",
    borderColor: "#5B4C9D",
  },
  waitlistButton: {
    marginTop: 8,
    backgroundColor: "#5B4C9D",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  waitlistButtonDisabled: {
    opacity: 0.6,
  },
  waitlistButtonActive: {
    backgroundColor: "#F4B26B",
  },
  waitlistButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  backButton: {
    width: 56,
    height: 56,
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  solverButton: {
    flex: 1,
    height: 56,
    backgroundColor: "#5B4C9D",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  solverButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  solverButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  solverButtonTextDisabled: {
    color: "#9B9B9B",
  },
});
