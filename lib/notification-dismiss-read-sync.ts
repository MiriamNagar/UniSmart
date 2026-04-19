export const DISMISS_SYNC_LIMITATION_NOTE =
  "Notification-dismiss read sync is best-effort; some OS/device combinations do not provide a correlatable dismiss callback.";

export const MARK_AS_READ_ACTION_IDENTIFIER = "mark-as-read";

type DismissedResponseInput = {
  actionIdentifier?: unknown;
  notificationData?: unknown;
};

type CorrelatableAlert = {
  id: string;
  isRead: boolean;
};

function extractAlertIdFromData(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const record = data as Record<string, unknown>;
  const value = record.alertId;
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function extractAlertIdFromNotificationResponse(
  input: DismissedResponseInput,
  allowedActionIdentifiers: readonly string[],
): string | null {
  if (
    typeof input.actionIdentifier !== "string" ||
    !allowedActionIdentifiers.includes(input.actionIdentifier)
  ) {
    return null;
  }
  return extractAlertIdFromData(input.notificationData);
}

export function markAlertReadFromDismissal<T extends CorrelatableAlert>(
  alerts: T[],
  dismissedAlertId: string,
): T[] {
  let changed = false;
  const updated = alerts.map((alert) => {
    if (alert.id !== dismissedAlertId || alert.isRead) {
      return alert;
    }
    changed = true;
    return { ...alert, isRead: true };
  });
  return changed ? updated : alerts;
}
