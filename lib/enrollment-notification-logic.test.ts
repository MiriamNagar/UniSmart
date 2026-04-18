import {
  buildEnrollmentNotificationEvent,
  computeSeatOpeningSignal,
  dispatchGenericEnrollmentNotification,
  GENERIC_ENROLLMENT_NOTIFICATION_BODY,
  GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
} from "@/lib/enrollment-notification-logic";

describe("computeSeatOpeningSignal", () => {
  it("notifies when remaining goes from 0 to positive using capacity minus occupancy", () => {
    const signal = computeSeatOpeningSignal(
      { capacity: 30, occupancy: 30 },
      { capacity: 30, occupancy: 29 },
    );
    expect(signal.previousRemaining).toBe(0);
    expect(signal.currentRemaining).toBe(1);
    expect(signal.remainingDelta).toBe(1);
    expect(signal.shouldNotifyGenericEnrollment).toBe(true);
  });

  it("does not notify when remaining stays zero", () => {
    const signal = computeSeatOpeningSignal(
      { capacity: 20, occupancy: 20 },
      { capacity: 20, occupancy: 20 },
    );
    expect(signal.shouldNotifyGenericEnrollment).toBe(false);
  });

  it("does not notify when previous snapshot is unknown (default)", () => {
    const signal = computeSeatOpeningSignal(undefined, { capacity: 10, occupancy: 5 });
    expect(signal.currentRemaining).toBe(5);
    expect(signal.shouldNotifyGenericEnrollment).toBe(false);
  });

  it("can notify on first snapshot when option is set", () => {
    const signal = computeSeatOpeningSignal(undefined, { capacity: 10, occupancy: 5 }, {
      notifyWhenPreviousUnknown: true,
    });
    expect(signal.shouldNotifyGenericEnrollment).toBe(true);
  });

  it("does not notify when seat fields are missing", () => {
    const signal = computeSeatOpeningSignal({}, { capacity: 40, occupancy: 38 });
    expect(signal.previousRemaining).toBeNull();
    expect(signal.currentRemaining).toBe(2);
    expect(signal.shouldNotifyGenericEnrollment).toBe(false);
  });
});

describe("generic notification copy (NFR-S4)", () => {
  it("exposes non-sensitive title and body constants", () => {
    expect(GENERIC_ENROLLMENT_NOTIFICATION_TITLE.length).toBeGreaterThan(0);
    expect(GENERIC_ENROLLMENT_NOTIFICATION_BODY.length).toBeGreaterThan(0);
    expect(GENERIC_ENROLLMENT_NOTIFICATION_BODY).not.toMatch(/\d{3,}/);
  });
});

describe("buildEnrollmentNotificationEvent", () => {
  it("builds push payload and in-app detail for qualifying signals", () => {
    const signal = computeSeatOpeningSignal(
      { capacity: 20, occupancy: 20 },
      { capacity: 20, occupancy: 19 },
    );
    const event = buildEnrollmentNotificationEvent(signal, {
      courseId: "CS101",
      courseName: "Intro to CS",
      sectionId: "CS101-1",
      nowMs: 123,
    });
    expect(event).toEqual({
      pushPayload: {
        title: GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
        body: GENERIC_ENROLLMENT_NOTIFICATION_BODY,
      },
      inAppDetail: {
        courseId: "CS101",
        courseName: "Intro to CS",
        sectionId: "CS101-1",
        previousRemaining: 0,
        currentRemaining: 1,
        remainingDelta: 1,
        createdAtMs: 123,
      },
    });
  });

  it("returns null when signal does not qualify for notification", () => {
    const signal = computeSeatOpeningSignal(
      { capacity: 20, occupancy: 20 },
      { capacity: 20, occupancy: 20 },
    );
    expect(
      buildEnrollmentNotificationEvent(signal, {
        courseId: "CS101",
        courseName: "Intro to CS",
        sectionId: "CS101-1",
      }),
    ).toBeNull();
  });
});

describe("dispatchGenericEnrollmentNotification", () => {
  it("dispatches generic push payload", async () => {
    const dispatch = jest.fn<Promise<void>, [{ title: string; body: string }]>().mockResolvedValue();
    await dispatchGenericEnrollmentNotification(
      {
        pushPayload: {
          title: GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
          body: GENERIC_ENROLLMENT_NOTIFICATION_BODY,
        },
        inAppDetail: {
          courseId: "CS101",
          courseName: "Intro to CS",
          sectionId: "CS101-1",
          previousRemaining: 0,
          currentRemaining: 1,
          remainingDelta: 1,
          createdAtMs: 1,
        },
      },
      dispatch,
    );
    expect(dispatch).toHaveBeenCalledWith({
      title: GENERIC_ENROLLMENT_NOTIFICATION_TITLE,
      body: GENERIC_ENROLLMENT_NOTIFICATION_BODY,
    });
  });
});
