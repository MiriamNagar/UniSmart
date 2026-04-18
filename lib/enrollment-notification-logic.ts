import {
  remainingSeatsFromOfferingFields,
  type OfferingSeatCountFields,
} from "@/lib/bgu-catalog-to-courses";

/**
 * Outcome of comparing two offering snapshots (e.g. before/after registrar sync).
 * Remaining seats always use `capacity − occupancy` when both are set.
 */
export type SeatOpeningSignal = {
  previousRemaining: number | null;
  currentRemaining: number | null;
  /** Positive when more seats are available than before (`current − previous`). */
  remainingDelta: number | null;
  /** True when a generic (non-sensitive) enrollment push is appropriate. */
  shouldNotifyGenericEnrollment: boolean;
};

export type ComputeSeatOpeningOptions = {
  /**
   * When true, treat “no prior seat fields” as eligible for notify if current has seats.
   * Default false avoids noisy first-seen rows without a stored previous snapshot.
   */
  notifyWhenPreviousUnknown?: boolean;
};

export type GenericEnrollmentPushPayload = {
  title: string;
  body: string;
};

export type EnrollmentInAppAlertDetail = {
  courseId: string;
  courseName: string;
  sectionId: string;
  previousRemaining: number | null;
  currentRemaining: number | null;
  remainingDelta: number | null;
  createdAtMs: number;
};

export type EnrollmentNotificationEvent = {
  pushPayload: GenericEnrollmentPushPayload;
  inAppDetail: EnrollmentInAppAlertDetail;
};

export type EnrollmentNotificationContext = {
  courseId: string;
  courseName: string;
  sectionId: string;
  nowMs?: number;
};

/**
 * Decide whether to fire a **generic** enrollment notification from two offering snapshots.
 * Uses the same remaining-seat rule as the planner: `capacity − occupancy`.
 *
 * Default: notify only on a **known** transition from full (0 remaining) to having seats.
 * NFR-S4: callers should still send **generic** title/body in the push payload; details stay in-app.
 */
export function computeSeatOpeningSignal(
  previous: OfferingSeatCountFields | null | undefined,
  current: OfferingSeatCountFields | null | undefined,
  options?: ComputeSeatOpeningOptions,
): SeatOpeningSignal {
  const prevRem = previous ? remainingSeatsFromOfferingFields(previous) : null;
  const curRem = current ? remainingSeatsFromOfferingFields(current) : null;

  let remainingDelta: number | null = null;
  if (prevRem !== null && curRem !== null) {
    remainingDelta = curRem - prevRem;
  }

  const openedFromFull =
    curRem !== null && curRem > 0 && prevRem !== null && prevRem <= 0;

  const notifyWhenPreviousUnknown =
    options?.notifyWhenPreviousUnknown === true &&
    curRem !== null &&
    curRem > 0 &&
    prevRem === null;

  const shouldNotifyGenericEnrollment = openedFromFull || notifyWhenPreviousUnknown;

  return {
    previousRemaining: prevRem,
    currentRemaining: curRem,
    remainingDelta,
    shouldNotifyGenericEnrollment,
  };
}

/** NFR-S4: minimal text for the notification shade (no course codes or seat counts). */
export const GENERIC_ENROLLMENT_NOTIFICATION_TITLE = "Enrollment update";

export const GENERIC_ENROLLMENT_NOTIFICATION_BODY =
  "Something on your watch list may have changed. Open the app for details.";

export function buildEnrollmentNotificationEvent(
  signal: SeatOpeningSignal,
  context: EnrollmentNotificationContext,
): EnrollmentNotificationEvent | null {
  if (!signal.shouldNotifyGenericEnrollment) {
    return null;
  }
  return {
    pushPayload: {
      title: GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
      body: GENERIC_ENROLLMENT_NOTIFICATION_BODY,
    },
    inAppDetail: {
      courseId: context.courseId,
      courseName: context.courseName,
      sectionId: context.sectionId,
      previousRemaining: signal.previousRemaining,
      currentRemaining: signal.currentRemaining,
      remainingDelta: signal.remainingDelta,
      createdAtMs: context.nowMs ?? Date.now(),
    },
  };
}

export async function dispatchGenericEnrollmentNotification(
  event: EnrollmentNotificationEvent,
  dispatch: (payload: GenericEnrollmentPushPayload) => Promise<void>,
): Promise<void> {
  await dispatch(event.pushPayload);
}
