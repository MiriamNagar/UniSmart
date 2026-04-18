import {
  DISMISS_SYNC_LIMITATION_NOTE,
  extractAlertIdFromNotificationResponse,
  MARK_AS_READ_ACTION_IDENTIFIER,
  markAlertReadFromDismissal,
} from "@/lib/notification-dismiss-read-sync";

describe("extractAlertIdFromNotificationResponse", () => {
  const dismissedActionIdentifier = "dismiss-action";
  const defaultActionIdentifier = "default-action";
  const allowedActions = [
    dismissedActionIdentifier,
    defaultActionIdentifier,
    MARK_AS_READ_ACTION_IDENTIFIER,
  ];

  it("returns alert id when OS action is dismiss and payload includes alertId", () => {
    const id = extractAlertIdFromNotificationResponse(
      {
        actionIdentifier: dismissedActionIdentifier,
        notificationData: {
          alertId: "alert-123",
        },
      },
      allowedActions,
    );
    expect(id).toBe("alert-123");
  });

  it("returns alert id when action is mark-as-read", () => {
    const id = extractAlertIdFromNotificationResponse(
      {
        actionIdentifier: MARK_AS_READ_ACTION_IDENTIFIER,
        notificationData: {
          alertId: "alert-123",
        },
      },
      allowedActions,
    );
    expect(id).toBe("alert-123");
  });

  it("returns alert id when notification is opened", () => {
    const id = extractAlertIdFromNotificationResponse(
      {
        actionIdentifier: defaultActionIdentifier,
        notificationData: {
          alertId: "alert-123",
        },
      },
      allowedActions,
    );
    expect(id).toBe("alert-123");
  });

  it("returns null when action is not one of the allowed actions", () => {
    const id = extractAlertIdFromNotificationResponse(
      {
        actionIdentifier: "custom-action",
        notificationData: {
          alertId: "alert-123",
        },
      },
      allowedActions,
    );
    expect(id).toBeNull();
  });

  it("returns null when dismiss payload has no correlating id", () => {
    const id = extractAlertIdFromNotificationResponse(
      {
        actionIdentifier: dismissedActionIdentifier,
        notificationData: {},
      },
      allowedActions,
    );
    expect(id).toBeNull();
  });
});

describe("markAlertReadFromDismissal", () => {
  it("marks only the matched alert as read", () => {
    const updated = markAlertReadFromDismissal(
      [
        { id: "a", isRead: false, title: "A" },
        { id: "b", isRead: false, title: "B" },
      ],
      "b",
    );
    expect(updated).toEqual([
      { id: "a", isRead: false, title: "A" },
      { id: "b", isRead: true, title: "B" },
    ]);
  });

  it("returns the same array reference when there is no matching alert", () => {
    const alerts = [
      { id: "a", isRead: false, title: "A" },
      { id: "b", isRead: true, title: "B" },
    ];
    const updated = markAlertReadFromDismissal(alerts, "missing");
    expect(updated).toBe(alerts);
  });
});

describe("DISMISS_SYNC_LIMITATION_NOTE", () => {
  it("documents best-effort platform limitation for unsupported dismiss callbacks", () => {
    expect(DISMISS_SYNC_LIMITATION_NOTE).toMatch(/best-effort/i);
  });
});
