export type AlertReadState = {
  id: string;
  isRead: boolean;
};

export function markAlertAsRead<T extends AlertReadState>(
  alerts: T[],
  alertId: string,
): T[] {
  return alerts.map((alert) =>
    alert.id === alertId ? { ...alert, isRead: true } : alert,
  ) as T[];
}

export function markAllAlertsRead<T extends AlertReadState>(alerts: T[]): T[] {
  return alerts.map((alert) =>
    alert.isRead ? alert : { ...alert, isRead: true },
  ) as T[];
}

export function getUnreadAlertCount<T extends AlertReadState>(alerts: T[]): number {
  return alerts.reduce((count, alert) => count + (alert.isRead ? 0 : 1), 0);
}

export function formatUnreadBadgeText(unreadCount: number): string | null {
  if (unreadCount <= 0) {
    return null;
  }
  return unreadCount > 9 ? "9+" : String(unreadCount);
}
