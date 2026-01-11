import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';

export default function PlannerScreen() {
  const { selectedSemester, setSelectedSemester, lastPlannerFlowRoute, setLastPlannerFlowRoute } = useSelection();

  // Clear saved route when explicitly navigating to main planner screen
  // This allows users to start fresh when they come back to main planner
  useFocusEffect(
    useCallback(() => {
      if (lastPlannerFlowRoute) {
        // Clear the saved route when we're explicitly on the main planner screen
        // This means the user wants to see the main planner, not the saved state
        setLastPlannerFlowRoute(null);
      }
    }, [lastPlannerFlowRoute, setLastPlannerFlowRoute])
  );

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
          onPress={() => {
            // Clear any previous flow route when starting fresh
            setLastPlannerFlowRoute(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION);
            router.push(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION);
          }}>
          <ThemedText style={styles.beginButtonText}>Begin Course Selection</ThemedText>
        </TouchableOpacity>
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
});

