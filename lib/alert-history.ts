export type AlertHistorySource = {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAtMs?: number;
};

export type AlertHistoryItem = Omit<AlertHistorySource, "createdAtMs"> & {
  createdAtMs: number | null;
  readLabel: "Read" | "Unread";
  timestampLabel: string;
};

export function formatAlertTimestamp(
  createdAtMs: number | null | undefined,
): string {
  if (typeof createdAtMs !== "number" || Number.isNaN(createdAtMs)) {
    return "Unknown time";
  }
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });
  return `${formatter.format(new Date(createdAtMs))} UTC`;
}

function normalizeCreatedAtMs(createdAtMs: number | undefined): number | null {
  if (typeof createdAtMs !== "number" || Number.isNaN(createdAtMs)) {
    return null;
  }
  return createdAtMs;
}

export function buildAlertHistoryItems(
  alerts: AlertHistorySource[],
): AlertHistoryItem[] {
  return alerts
    .map((alert) => {
      const normalizedCreatedAtMs = normalizeCreatedAtMs(alert.createdAtMs);
      return {
        ...alert,
        createdAtMs: normalizedCreatedAtMs,
        readLabel: alert.isRead ? "Read" : "Unread",
        timestampLabel: formatAlertTimestamp(normalizedCreatedAtMs),
      };
    })
    .sort((a, b) => {
      const aSortKey = a.createdAtMs ?? -1;
      const bSortKey = b.createdAtMs ?? -1;
      if (aSortKey !== bSortKey) {
        return bSortKey - aSortKey;
      }
      return a.id.localeCompare(b.id);
    });
}
