import { formatUnreadBadgeText, getUnreadAlertCount } from "@/lib/alerts-read-state";
import { buildEnrollmentNotificationEvent } from "@/lib/enrollment-notification-logic";
import { markAlertReadFromDismissal } from "@/lib/notification-dismiss-read-sync";
import {
  collectWaitlistSectionSnapshots,
  detectWaitlistSeatOpenings,
} from "@/lib/waitlist-seat-opening";
import type { Course } from "@/types/courses";

const baseCourse: Course = {
  courseID: "CS101",
  courseName: "Intro to CS",
  isMandatory: true,
  credits: 3,
  semester: "A",
  availableSections: [
    {
      sectionID: "CS101-1",
      lessons: [],
      isFull: true,
      remainingSeats: 0,
      waitlistSupported: true,
    },
  ],
};

describe("waitlist -> push -> in-app acknowledgment flow", () => {
  it("evidences FR48 using pure flow helpers", () => {
    const previousBySectionId = collectWaitlistSectionSnapshots([baseCourse]);
    const currentBySectionId = collectWaitlistSectionSnapshots([
      {
        ...baseCourse,
        availableSections: [
          {
            ...baseCourse.availableSections[0],
            isFull: false,
            remainingSeats: 2,
          },
        ],
      },
    ]);

    const matches = detectWaitlistSeatOpenings({
      previousBySectionId,
      currentBySectionId,
      waitlistedSectionIds: new Set(["CS101-1"]),
    });

    expect(matches).toHaveLength(1);

    const event = buildEnrollmentNotificationEvent(matches[0].signal, {
      courseId: matches[0].courseId,
      courseName: matches[0].courseName,
      sectionId: matches[0].sectionId,
      nowMs: 123,
    });

    expect(event).not.toBeNull();
    expect(event?.pushPayload.title).toBe("Enrollment update");
    expect(event?.pushPayload.body).toMatch(/watch list/i);

    // Push payload remains generic while in-app detail carries course-specific context.
    expect(event?.pushPayload.body).not.toContain(matches[0].courseId);
    expect(event?.inAppDetail.courseId).toBe("CS101");
    expect(event?.inAppDetail.sectionId).toBe("CS101-1");
    expect(event?.inAppDetail.remainingDelta).toBe(2);
  });

  it("marks alert as read after dismissal acknowledgment and clears unread badge", () => {
    const alerts = [
      {
        id: "waitlist-CS101-1",
        title: "Enrollment update",
        message: "Something on your watch list may have changed. Open the app for details.",
        isRead: false,
        createdAtMs: 123,
      },
    ];

    expect(getUnreadAlertCount(alerts)).toBe(1);
    expect(formatUnreadBadgeText(getUnreadAlertCount(alerts))).toBe("1");

    const acknowledged = markAlertReadFromDismissal(alerts, "waitlist-CS101-1");

    expect(getUnreadAlertCount(acknowledged)).toBe(0);
    expect(formatUnreadBadgeText(getUnreadAlertCount(acknowledged))).toBeNull();
    expect(acknowledged[0]?.isRead).toBe(true);
  });
});
