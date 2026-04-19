import {
  buildAlertHistoryItems,
  formatAlertTimestamp,
  type AlertHistorySource,
} from "@/lib/alert-history";

describe("buildAlertHistoryItems", () => {
  it("sorts alerts in reverse chronological order and annotates read state", () => {
    const source: AlertHistorySource[] = [
      {
        id: "older-unread",
        title: "Older",
        message: "Older unread message",
        isRead: false,
        createdAtMs: 1000,
      },
      {
        id: "newer-read",
        title: "Newer",
        message: "Newest read message",
        isRead: true,
        createdAtMs: 2000,
      },
      {
        id: "middle-unread",
        title: "Middle",
        message: "Middle unread message",
        isRead: false,
        createdAtMs: 1500,
      },
    ];

    const items = buildAlertHistoryItems(source);

    expect(items.map((item) => item.id)).toEqual([
      "newer-read",
      "middle-unread",
      "older-unread",
    ]);
    expect(items[0].readLabel).toBe("Read");
    expect(items[1].readLabel).toBe("Unread");
  });
});

describe("formatAlertTimestamp", () => {
  it("formats timestamps in UTC with stable output", () => {
    expect(formatAlertTimestamp(Date.UTC(2026, 3, 17, 12, 30))).toBe(
      "Apr 17, 2026, 12:30 PM UTC",
    );
  });
});
