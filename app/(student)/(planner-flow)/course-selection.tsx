import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ROUTES } from '@/constants/routes';
import { useSelection } from '@/contexts/selection-context';
import { mapSemesterToBackend } from '@/utils/data-transformers';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

// For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator and web, localhost works
// For physical devices, use your computer's IP address
const API_BASE_URL = Platform.OS === "android" 
  ? "http://192.168.1.249:8080" 
  : "http://192.168.1.249:8080";

interface Course {
  id: string;
  name: string;
  credits?: number;
}

export default function CourseSelectionScreen() {
  const { selectedCourses, setSelectedCourses, selectedSemester, setLastPlannerFlowRoute } = useSelection();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Save this route as the last visited planner flow route
  useEffect(() => {
    setLastPlannerFlowRoute(ROUTES.STUDENT.PLANNER_FLOW.COURSE_SELECTION);
  }, [setLastPlannerFlowRoute]);

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setIsLoading(true);
        const semester = mapSemesterToBackend(selectedSemester);
        const coursesUrl = `${API_BASE_URL}/courses?semester=${semester}`;
        
        console.log('Fetching courses from:', coursesUrl);
        console.log('Platform:', Platform.OS);
        console.log('API Base URL:', API_BASE_URL);
        
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
          const response = await fetch(coursesUrl, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch courses: ${response.status} ${errorText}`);
          }

          const data = await response.json();
          console.log('Received courses data:', data);
          
          // Check if data has courses array
          if (!data.courses || !Array.isArray(data.courses)) {
            throw new Error('Invalid response format: courses array not found');
          }
          
          // Transform backend format to frontend format
          const transformedCourses: Course[] = data.courses.map((c: { id: string; name: string; semester: string }) => ({
            id: c.id,
            name: c.name,
            credits: 0, // Could be added to backend if needed
          }));
          
          console.log(`Successfully loaded ${transformedCourses.length} courses`);
          setCourses(transformedCourses);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error(`Backend connection timeout. Make sure the backend is running at ${API_BASE_URL}. Start it with: cd backend && python main.py (or use backend/start_server.bat on Windows)`);
          }
          throw fetchError;
        }
      } catch (error: any) {
        console.error('Error fetching courses:', error);
        console.error('Error message:', error?.message);
        console.error('API Base URL:', API_BASE_URL);
        console.error('API URL:', `${API_BASE_URL}/courses?semester=${mapSemesterToBackend(selectedSemester)}`);
        console.error('Selected semester:', selectedSemester);
        console.error('Platform:', Platform.OS);
        console.error('Troubleshooting:');
        console.error('  1. Make sure the backend is running: cd backend && python main.py');
        console.error('  2. For Android emulator, backend must be accessible at http://10.0.2.2:8080');
        console.error('  3. For iOS simulator, backend must be accessible at http://localhost:8080');
        console.error('  4. Check Windows Firewall is not blocking port 8080');
        // Fallback to empty array on error
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [selectedSemester]);

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
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5B4C9D" />
              <ThemedText style={styles.loadingText}>Loading courses...</ThemedText>
            </View>
          ) : courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>
                No courses available. Please make sure the backend server is running.
              </ThemedText>
              <ThemedText style={[styles.emptyText, { marginTop: 8, fontSize: 12 }]}>
                Start it with: cd backend && python main.py
              </ThemedText>
              <ThemedText style={[styles.emptyText, { marginTop: 4, fontSize: 12 }]}>
                Backend URL: {API_BASE_URL}
              </ThemedText>
            </View>
          ) : (
            courses.map((course) => {
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
            })
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setLastPlannerFlowRoute(null);
            router.push(ROUTES.STUDENT.PLANNER);
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
              router.push(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES);
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
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#9B9B9B',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
  },
});

