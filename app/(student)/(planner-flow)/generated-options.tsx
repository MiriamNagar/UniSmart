import { StyleSheet, TouchableOpacity, View, ScrollView, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';

import { generateSchedules } from '@/logic/solver';
import { bguPlannerCourses } from '@/mockData/bgu-planner-courses';
import { isCourseEligibleForSemester } from '@/lib/planner-prerequisite-eligibility';
import { filterCoursesForPlannerTerm } from '@/lib/planner-active-term';
import { Days } from '@/types/courses';

export default function GeneratedOptionsScreen() {
  const {
    selectedCourses,
    selectedDays,
    startHour,
    endHour,
    setSavedPlans,
    setLastPlannerFlowRoute,
    professorPreferences,
    selectedSemester,
    activeDegreeYear,
  } = useSelection();

  // מצב למעקב אחרי ריחוף עכבר 
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);

  useEffect(() => {
    setLastPlannerFlowRoute(ROUTES.STUDENT.PLANNER_FLOW.GENERATED_OPTIONS);
  }, [setLastPlannerFlowRoute]);

  const proposals = useMemo(() => {
    const preferences = {
      blockedDays: Array.from(selectedDays) as Days[],
      startHour,
      endHour,
    };

    const semesterKey = selectedSemester === 'Sem 1' ? 'A' : 'B';

    const inTerm = filterCoursesForPlannerTerm(bguPlannerCourses, semesterKey, activeDegreeYear);
    const coursesToSchedule = inTerm.filter(
      (course) =>
        selectedCourses.has(course.courseID) &&
        isCourseEligibleForSemester(course, semesterKey, inTerm, {
          completedCourseNames: new Set(),
        }),
    );

    const solverResult = generateSchedules(coursesToSchedule, preferences);

    return solverResult.proposals.map((proposal) => {
      const transformedSchedule: any = { SUN: [], MON: [], TUE: [], WED: [], THU: [], FRI: [] };
      proposal.sections.forEach(section => {
        const parentCourse = bguPlannerCourses.find(c => 
          c.availableSections.some(s => s.sectionID === section.sectionID)
        );

        section.lessons.forEach(lesson => {
          const dayKey = lesson.day.toUpperCase();
          if (transformedSchedule[dayKey]) {
            transformedSchedule[dayKey].push({
              id: `${section.sectionID}-${lesson.day}-${lesson.startTime}`, // מזהה ייחודי ל-hover
              courseCode: parentCourse?.courseID || '??',
              courseName: parentCourse?.courseName || 'Unknown',
              instructor: lesson.lecturer,
              location: lesson.location,
              time: `${lesson.startTime}-${lesson.endTime}`,
              startTime: lesson.startTime,
              endTime: lesson.endTime,
            });
          }
        });
      });

      return {
        id: proposal.id,
        fitScore: proposal.fitScore,
        schedule: transformedSchedule,
      };
    });
  }, [selectedCourses, selectedDays, startHour, endHour, selectedSemester, activeDegreeYear]);

  const constraintCount = (selectedDays.size) + (startHour !== 'Any' ? 1 : 0) + (endHour !== 'Any' ? 1 : 0);

  const timeSlots = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '19:00', '20:00', '21:00', '22:00'];
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];

  // לוגיקת מיקום משופרת
  const HOUR_HEIGHT = 55; // הגדלתי למראה פחות צפוף
  const START_HOUR_INT = 8;

  const getTopOffset = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours - START_HOUR_INT) + (minutes / 60)) * HOUR_HEIGHT;
  };

  const getBlockHeight = (startTime: string, endTime: string) => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const duration = (endH * 60 + endM) - (startH * 60 + startM);
    return (duration / 60) * HOUR_HEIGHT;
  };

  const getTimeSlotIndex = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    return timeSlots.findIndex((slot) => parseInt(slot.split(':')[0]) === hour);
  };

  const getTimeSlotSpan = (startTime: string, endTime: string) => {
    const start = getTimeSlotIndex(startTime);
    const end = getTimeSlotIndex(endTime);
    return { start, end, span: end - start };
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header*/}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>INTELLIGENCE PLANNER</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>Generated Options</ThemedText>
          <ThemedText style={styles.subtitle}>
            BASED ON {constraintCount} {constraintCount === 1 ? 'CONSTRAINT' : 'CONSTRAINTS'}
          </ThemedText>
        </View>

        {proposals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="event-busy" size={64} color="#9B9B9B" />
            <ThemedText style={styles.emptyStateText}>No valid schedules found.</ThemedText>
            <ThemedText style={styles.emptyStateSubtext}>Try removing some constraints or days.</ThemedText>
          </View>
        ) : (
          proposals.map((proposal, proposalIndex) => (
            <View key={proposal.id} style={styles.proposalContainer}>
              <View style={styles.proposalHeader}>
                <View style={styles.proposalInfo}>
                  <ThemedText style={styles.proposalLabel}>PROPOSAL {proposalIndex + 1}</ThemedText>
                  <ThemedText style={styles.fitScore}>Fit Score: {proposal.fitScore}%</ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  activeOpacity={0.8}
                  onPress={() => {
                    const newPlan = {
                      id: `plan-${Date.now()}`,
                      date: new Date().toLocaleDateString('en-GB'),
                      fitScore: proposal.fitScore,
                      schedule: proposal.schedule,
                    };
                    setSavedPlans((prev) => [...prev, newPlan]);
                    router.push(ROUTES.STUDENT.SAVED);
                  }}>
                  <ThemedText style={styles.saveButtonText}>SAVE PLAN</ThemedText>
                </TouchableOpacity>
              </View>

              <View style={styles.scheduleCard}>
                <View style={styles.scheduleContainer}>
                  {/* Time Column */}
                  <View style={styles.fixedTimeSection}>
                    <View style={styles.timeHeaderFixed}><ThemedText style={styles.gridHeaderText}>TIME</ThemedText></View>
                    <View style={styles.timeColumnFixed}>
                      {timeSlots.map((time, index) => (
                        <View key={index} style={[styles.timeSlot, { height: HOUR_HEIGHT }]}><ThemedText style={styles.timeText}>{time}</ThemedText></View>
                      ))}
                    </View>
                  </View>

                  {/* Scrollable Days */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.daysScrollView}>
                    <View style={{ flexDirection: 'column' }}>
                      <View style={styles.daysHeaderContainer}>
                        {days.map((day, index) => (
                          <View key={day} style={[styles.dayHeader, index === days.length - 1 && styles.dayHeaderLast]}>
                            <ThemedText style={styles.gridHeaderText}>{day}</ThemedText>
                          </View>
                        ))}
                      </View>

                      <View style={styles.daysBodyContainer}>
                        {days.map((day, dayIndex) => (
                          <View key={day} style={[styles.dayColumn, { position: 'relative', width: 130 }, dayIndex === days.length - 1 && styles.dayColumnLast]}>
                            {/* Background Grid Lines */}
                            {timeSlots.map((_, i) => (
                              <View key={i} style={[styles.gridCell, { height: HOUR_HEIGHT }]}><View style={styles.gridLine} /></View>
                            ))}

                            {/* Absolute Positioned Courses */}
                            {proposal.schedule[day]?.map((course: any) => {
                              const isHovered = hoveredCourseId === course.id;
                              return (
                                <Pressable
                                  key={course.id}
                                  onHoverIn={() => setHoveredCourseId(course.id)}
                                  onHoverOut={() => setHoveredCourseId(null)}
                                  style={[
                                    styles.courseBlock,
                                    {
                                      position: 'absolute',
                                      top: getTopOffset(course.startTime) + 2,
                                      height: getBlockHeight(course.startTime, course.endTime) - 4,
                                      left: 4,
                                      right: 4,
                                      zIndex: isHovered ? 100 : 10,
                                      // אפקט ויזואלי לריחוף
                                      transform: [{ scale: isHovered ? 1.02 : 1 }],
                                      shadowOpacity: isHovered ? 0.2 : 0.08,
                                      elevation: isHovered ? 8 : 3,
                                      backgroundColor: isHovered ? '#EFEEFF' : '#E0E0FF'
                                    }
                                  ]}>
                                  <View style={styles.courseContent}>
                                    <ThemedText style={styles.courseCode} numberOfLines={1}>{course.courseCode}</ThemedText>
                                    <ThemedText style={[styles.courseName, { fontSize: isHovered ? 12 : 11 }]} numberOfLines={isHovered ? 3 : 2}>
                                      {course.courseName}
                                    </ThemedText>
                                    
                                    {/* פרטים נוספים שמוצגים רק ב-Hover או אם יש מקום */}
                                    {isHovered && (
                                      <View style={[styles.courseDetails, { marginTop: 4 }]}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 2}}>
                                          <MaterialIcons name="location-on" size={10} color="#5B4C9D" />
                                          <ThemedText style={styles.courseDetailTextBold}>{course.location}</ThemedText>
                                        </View>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 2}}>
                                          <MaterialIcons name="person" size={10} color="#9B9B9B" />
                                          <ThemedText style={styles.courseDetailText}>{course.instructor}</ThemedText>
                                        </View>
                                      </View>
                                    )}
                                  </View>
                                </Pressable>
                              );
                            })}
                          </View>
                        ))}
                      </View>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.adjustButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.push(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES)}>
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.adjustButton} 
          onPress={() => { setLastPlannerFlowRoute(null); router.push(ROUTES.STUDENT.PLANNER); }}>
          <ThemedText style={styles.adjustButtonText}>ADJUST SELECTION</ThemedText>
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
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  proposalContainer: {
    marginBottom: 32,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  proposalInfo: {
    flex: 1,
  },
  proposalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4C9D',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  fitScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  saveButton: {
    backgroundColor: '#5B4C9D',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  scheduleContainer: {
    flexDirection: 'row',
  },
  fixedTimeSection: {
    borderRightWidth: 2,
    borderRightColor: '#E0E0E0',
  },
  timeHeaderFixed: {
    width: 60,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  daysScrollView: {
    flex: 1,
  },
  daysHeaderContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  dayHeader: {
    width: 130,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
    alignItems: 'center',
  },
  dayHeaderLast: {
    borderRightWidth: 0,
  },
  dayColumnLast: {
    borderRightWidth: 0,
  },
  gridHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  daysBodyContainer: {
    flexDirection: 'row',
  },
  timeColumnFixed: {
    width: 60,
    backgroundColor: '#FAFAFA',
  },
  timeSlot: {
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timeText: {
    fontSize: 11,
    color: '#9B9B9B',
  },
  dayColumn: {
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  gridCell: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  courseBlock: {
    borderRadius: 8,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#5B4C9D',
  },
  courseContent: {
    padding: 6,
  },
  courseCode: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#5B4C9D',
    marginBottom: 2,
  },
  courseName: {
    color: '#4A4A6A',
    fontWeight: '600',
    lineHeight: 14,
  },
  courseDetails: {
    gap: 2,
  },
  courseDetailText: {
    fontSize: 10,
    color: '#9B9B9B',
  },
  courseDetailTextBold: {
    fontSize: 10,
    color: '#4A4A6A',
    fontWeight: '700',
  },
  adjustButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    width: 56,
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#2C2C2C',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9B9B9B',
    textAlign: 'center',
    marginTop: 8,
  }
});