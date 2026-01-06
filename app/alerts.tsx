import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';

export default function AlertsScreen() {
  const { lastPlannerRoute, alerts, setAlerts } = useSelection();

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

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => {
            const route = lastPlannerRoute || '/planner';
            router.push(route as any);
          }}>
          <MaterialIcons name="event-note" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>PLANNER</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/saved')}>
          <MaterialIcons name="bookmark" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>SAVED</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/notes')}>
          <MaterialIcons name="description" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>NOTES</ThemedText>
        </TouchableOpacity>
        <View style={styles.navItem}>
          <View style={styles.alertIconContainer}>
            <MaterialIcons name="notifications" size={24} color="#5B4C9D" />
            {unreadCount > 0 && <View style={styles.alertDot} />}
          </View>
          <ThemedText style={styles.navItemTextActive}>ALERTS</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/account')}>
          <MaterialIcons name="account-circle" size={24} color="#9B9B9B" />
          <ThemedText style={styles.navItemText}>ACCOUNT</ThemedText>
        </TouchableOpacity>
      </View>
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
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navItemText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9B9B9B',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  navItemTextActive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5B4C9D',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  alertIconContainer: {
    position: 'relative',
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
});

