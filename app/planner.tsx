import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useFocusEffect } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { useCallback, useEffect } from 'react';

export default function PlannerScreen() {
  const { selectedSemester, setSelectedSemester, lastPlannerRoute, setLastPlannerRoute, alerts } =
    useSelection();

  useFocusEffect(
    useCallback(() => {
      // When screen comes into focus, navigate to the last route if it's not the planner itself
      if (lastPlannerRoute !== '/planner' && lastPlannerRoute !== '') {
        // Use requestAnimationFrame to ensure navigation happens before render
        requestAnimationFrame(() => {
          router.replace(lastPlannerRoute as any);
        });
        return;
      }
      // Only set to planner if we're actually staying on planner
      setLastPlannerRoute('/planner');
    }, [lastPlannerRoute, setLastPlannerRoute])
  );

  // If we're redirecting, don't render the planner content
  if (lastPlannerRoute !== '/planner' && lastPlannerRoute !== '') {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>UniSmart</ThemedText>
        <ThemedText style={styles.headerSubtitle}>INTELLIGENCE PLANNER</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconSquare}>
            <MaterialIcons name="schedule" size={64} color="#5B4C9D" />
          </View>
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>Smart Planner</ThemedText>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <ThemedText style={styles.descriptionText}>
            Courses filtered for{' '}
            <ThemedText style={styles.highlightedText}>Software Engineering</ThemedText>
            , Year <ThemedText style={styles.highlightedText}>Freshman</ThemedText>.
          </ThemedText>
        </View>

        {/* Semester Selection */}
        <View style={styles.semesterSection}>
          <ThemedText style={styles.sectionLabel}>SELECT SEMESTER</ThemedText>
          <View style={styles.semesterButtons}>
            <TouchableOpacity
              style={[
                styles.semesterButton,
                selectedSemester === 'Sem 1' && styles.semesterButtonSelected,
              ]}
              onPress={() => setSelectedSemester('Sem 1')}
              activeOpacity={0.7}>
              <ThemedText
                style={[
                  styles.semesterButtonText,
                  selectedSemester === 'Sem 1' && styles.semesterButtonTextSelected,
                ]}>
                Sem 1
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.semesterButton,
                selectedSemester === 'Sem 2' && styles.semesterButtonSelected,
              ]}
              onPress={() => setSelectedSemester('Sem 2')}
              activeOpacity={0.7}>
              <ThemedText
                style={[
                  styles.semesterButtonText,
                  selectedSemester === 'Sem 2' && styles.semesterButtonTextSelected,
                ]}>
                Sem 2
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Begin Course Selection Button */}
        <TouchableOpacity
          style={styles.beginButton}
          activeOpacity={0.8}
          onPress={() => router.push('/course-selection')}>
          <ThemedText style={styles.beginButtonText}>Begin Course Selection</ThemedText>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <MaterialIcons name="event-note" size={24} color="#5B4C9D" />
          <ThemedText style={styles.navItemTextActive}>PLANNER</ThemedText>
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
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => router.push('/alerts')}>
          <View style={styles.alertIconContainer}>
            <MaterialIcons name="notifications" size={24} color="#9B9B9B" />
            {alerts.filter((alert) => !alert.isRead).length > 0 && (
              <View style={styles.alertDot} />
            )}
          </View>
          <ThemedText style={styles.navItemText}>ALERTS</ThemedText>
        </TouchableOpacity>
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
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
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
    paddingBottom: 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  iconSquare: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#E8E6F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 16,
    color: '#9B9B9B',
    textAlign: 'center',
    lineHeight: 24,
  },
  highlightedText: {
    color: '#5B4C9D',
    fontWeight: '600',
  },
  semesterSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  semesterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  semesterButton: {
    flex: 1,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  semesterButtonSelected: {
    borderColor: '#5B4C9D',
  },
  semesterButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9B9B9B',
  },
  semesterButtonTextSelected: {
    color: '#5B4C9D',
  },
  beginButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  beginButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
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

