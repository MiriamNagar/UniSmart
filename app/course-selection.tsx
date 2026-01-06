import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useFocusEffect } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { useCallback } from 'react';

export default function CourseSelectionScreen() {
  const { selectedCourses, setSelectedCourses, setLastPlannerRoute, alerts } = useSelection();

  useFocusEffect(
    useCallback(() => {
      // Remember this route when screen is focused
      setLastPlannerRoute('/course-selection');
    }, [setLastPlannerRoute])
  );

  const courses = [
    {
      id: 'CS101',
      name: 'Intro to Programming',
      credits: 4,
    },
    // Add more courses as needed
  ];

  const toggleCourse = (courseId: string) => {
    const newSelected = new Set(selectedCourses);
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId);
    } else {
      newSelected.add(courseId);
    }
    setSelectedCourses(newSelected);
  };

  const hasSelectedCourses = selectedCourses.size > 0;

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
        {/* Curriculum Filter */}
        <View style={styles.curriculumFilter}>
          <ThemedText style={styles.filterLabel}>CURRICULUM FILTER</ThemedText>
          <ThemedText style={styles.filterTitle}>Software Engineering - Freshman</ThemedText>
          <ThemedText style={styles.filterSemester}>Active Semester: 1</ThemedText>
        </View>

        {/* Course List */}
        <View style={styles.courseListSection}>
          <ThemedText style={styles.sectionLabel}>COURSE LIST</ThemedText>
          {courses.map((course) => {
            const isSelected = selectedCourses.has(course.id);
            return (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => toggleCourse(course.id)}
                activeOpacity={0.7}>
                <View style={styles.courseCardContent}>
                  <View style={styles.courseInfo}>
                    <ThemedText style={styles.courseCode}>{course.id}</ThemedText>
                    <ThemedText style={styles.courseName}>{course.name}</ThemedText>
                    <ThemedText style={styles.courseCredits}>{course.credits} Credits</ThemedText>
                  </View>
                  <View
                    style={[
                      styles.checkIcon,
                      isSelected && styles.checkIconSelected,
                    ]}>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setLastPlannerRoute('/planner');
            router.push('/planner');
          }}
          activeOpacity={0.7}>
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.solverButton,
            !hasSelectedCourses && styles.solverButtonDisabled,
          ]}
          activeOpacity={hasSelectedCourses ? 0.8 : 1}
          disabled={!hasSelectedCourses}
          onPress={() => {
            if (hasSelectedCourses) {
              router.push('/custom-rules');
            }
          }}>
          <ThemedText
            style={[
              styles.solverButtonText,
              !hasSelectedCourses && styles.solverButtonTextDisabled,
            ]}>
            SOLVER SETUP
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          activeOpacity={0.7}
          onPress={() => {
            // Stay on current screen since we're already in planner flow
          }}>
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
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
    paddingBottom: 120,
  },
  curriculumFilter: {
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 32,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  filterSemester: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  courseListSection: {
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
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  courseCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseInfo: {
    flex: 1,
  },
  courseCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5B4C9D',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  courseCredits: {
    fontSize: 14,
    color: '#9B9B9B',
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconSelected: {
    backgroundColor: '#5B4C9D',
    borderColor: '#5B4C9D',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backButton: {
    width: 56,
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solverButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  solverButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  solverButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  solverButtonTextDisabled: {
    color: '#9B9B9B',
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

