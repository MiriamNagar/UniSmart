import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import { buildAlertHistoryItems } from "@/lib/alert-history";
import { markAlertAsRead, markAllAlertsRead } from "@/lib/alerts-read-state";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function AlertsScreen() {
  const { alerts, setAlerts } = useSelection();
  const { scrollViewProps } = usePersistedTabScroll(TAB_SCROLL_KEYS.STUDENT_ALERTS);

  const handleMarkAllRead = () => {
    setAlerts((prev) => markAllAlertsRead(prev));
  };

  const handleMarkRead = (alertId: string) => {
    setAlerts((prev) => markAlertAsRead(prev, alertId));
  };

  const alertHistoryItems = buildAlertHistoryItems(alerts);
  const unreadCount = alertHistoryItems.filter((alert) => !alert.isRead).length;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>ALERT CENTER</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title} accessibilityRole="header">
            Alert Center
          </ThemedText>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={handleMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all alerts as read"
              accessibilityHint="Marks every unread alert in this list as read"
              activeOpacity={0.7}
            >
              <ThemedText style={styles.markAllReadText}>
                MARK ALL READ
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {alertHistoryItems.map((alert) => (
            <View
              key={alert.id}
              style={[styles.alertCard, !alert.isRead && styles.alertCardUnread]}
            >
              <View style={styles.alertMetaRow}>
                <ThemedText
                  style={alert.isRead ? styles.readBadge : styles.unreadBadge}
                  accessibilityLabel={`State ${alert.readLabel}`}
                >
                  {alert.readLabel.toUpperCase()}
                </ThemedText>
                <ThemedText style={styles.alertTimestamp}>
                  {alert.timestampLabel}
                </ThemedText>
              </View>
              <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
              <ThemedText style={styles.alertMessage}>
                {alert.message}
              </ThemedText>
              {!alert.isRead ? (
                <TouchableOpacity
                  style={styles.markReadButton}
                  onPress={() => handleMarkRead(alert.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Mark ${alert.title} as read`}
                  accessibilityHint="Marks this alert as read and removes it from unread count"
                  activeOpacity={0.7}
                >
                  <ThemedText style={styles.markReadText}>MARK READ</ThemedText>
                </TouchableOpacity>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "flex-start",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerTitleSmart: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#5B4C9D",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  markAllReadButton: {
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B4C9D",
    letterSpacing: 0.5,
  },
  alertsList: {
    gap: 16,
  },
  alertCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E1E1E1",
  },
  alertCardUnread: {
    borderColor: "#5B4C9D",
  },
  alertMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  unreadBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5B4C9D",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  readBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9B9B9B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  alertTimestamp: {
    fontSize: 12,
    color: "#6B6B6B",
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#5B4C9D",
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: "#1A1A1A",
    lineHeight: 20,
  },
  markReadButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
  },
  markReadText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B4C9D",
    letterSpacing: 0.4,
  },
});
