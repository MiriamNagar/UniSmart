import {
  formatUnreadBadgeText,
  getUnreadAlertCount,
  markAlertAsRead,
  markAllAlertsRead,
  type AlertReadState,
} from "@/lib/alerts-read-state";

const sampleAlerts: AlertReadState[] = [
  {
    id: "a1",
    title: "One",
    message: "First",
    isRead: false,
  },
  {
    id: "a2",
    title: "Two",
    message: "Second",
    isRead: true,
  },
  {
    id: "a3",
    title: "Three",
    message: "Third",
    isRead: false,
  },
];

describe("alerts-read-state", () => {
  it("marks a single alert as read by id", () => {
    const next = markAlertAsRead(sampleAlerts, "a1");
    expect(next.find((alert) => alert.id === "a1")?.isRead).toBe(true);
    expect(next.find((alert) => alert.id === "a3")?.isRead).toBe(false);
  });

  it("does not mutate the original alerts when marking one read", () => {
    const before = sampleAlerts.map((alert) => ({ ...alert }));
    markAlertAsRead(sampleAlerts, "a1");
    expect(sampleAlerts).toEqual(before);
  });

  it("marks all unread alerts as read", () => {
    const next = markAllAlertsRead(sampleAlerts);
    expect(next.every((alert) => alert.isRead)).toBe(true);
  });

  it("computes unread count from alert list", () => {
    expect(getUnreadAlertCount(sampleAlerts)).toBe(2);
    expect(getUnreadAlertCount(markAllAlertsRead(sampleAlerts))).toBe(0);
  });

  it("formats unread badge text with 9+ cap", () => {
    expect(formatUnreadBadgeText(0)).toBeNull();
    expect(formatUnreadBadgeText(3)).toBe("3");
    expect(formatUnreadBadgeText(9)).toBe("9");
    expect(formatUnreadBadgeText(12)).toBe("9+");
  });
});
