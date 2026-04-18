import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import { buildAlertHistoryItems } from "@/lib/alert-history";
import { markAlertAsRead, markAllAlertsRead } from "@/lib/alerts-read-state";

export function useAlertsViewModel() {
  const { alerts, setAlerts } = useSelection();
  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.STUDENT_ALERTS,
  );

  const handleMarkAllRead = () => {
    setAlerts((prev) => markAllAlertsRead(prev));
  };

  const handleMarkRead = (alertId: string) => {
    setAlerts((prev) => markAlertAsRead(prev, alertId));
  };

  const alertHistoryItems = buildAlertHistoryItems(alerts);
  const unreadCount = alertHistoryItems.filter((alert) => !alert.isRead).length;

  return {
    scrollViewProps,
    alertHistoryItems,
    unreadCount,
    handleMarkAllRead,
    handleMarkRead,
  };
}
