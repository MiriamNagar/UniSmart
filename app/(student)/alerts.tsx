import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSelection } from '@/contexts/selection-context';

export default function AlertsScreen() {
  const { alerts, setAlerts } = useSelection();

  const handleMarkAllRead = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
  };

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>Alert Center</ThemedText>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={handleMarkAllRead}
              activeOpacity={0.7}>
              <ThemedText style={styles.markAllReadText}>MARK ALL READ</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Alerts List */}
        <View style={styles.alertsList}>
          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertCard}>
              <ThemedText style={styles.alertTitle}>{alert.title}</ThemedText>
              <ThemedText style={styles.alertMessage}>{alert.message}</ThemedText>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerTitleSmart: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B4C9D',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  markAllReadButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllReadText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4C9D',
    letterSpacing: 0.5,
  },
  alertsList: {
    gap: 16,
  },
  alertCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 20,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B4C9D',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
});

