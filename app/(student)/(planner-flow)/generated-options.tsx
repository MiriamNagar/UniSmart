import { StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';

export default function GeneratedOptionsScreen() {
  const {
    selectedDays,
    startHour,
    endHour,
    savedPlans,
    setSavedPlans,
  } = useSelection();

  // Calculate the number of constraints
  const getConstraintCount = () => {
    let count = 0;
    if (selectedDays.size > 0) count += selectedDays.size; // Each selected day is a constraint
    if (startHour !== 'Any') count += 1; // Start hour constraint
    if (endHour !== 'Any') count += 1; // End hour constraint
    return count;
  };

  const constraintCount = getConstraintCount();
  const proposals = [
    {
      id: 1,
      fitScore: 115,
      schedule: {
        SUN: [],
        MON: [],
        TUE: [],
        WED: [
          {
            courseCode: 'CS101',
            courseName: 'Intro to Programm...',
            instructor: 'Dr. Smith',
            location: 'HALL A',
            time: '09:00-11:00',
            startTime: '09:00',
            endTime: '11:00',
          },
        ],
        THU: [],
        FRI: [],
      },
    },
    {
      id: 2,
      fitScore: 90,
      schedule: {
        SUN: [],
        MON: [
          {
            courseCode: 'CS101',
            courseName: 'Intro to Programm...',
            instructor: 'Dr. Smith',
            location: 'HALL A',
            time: '09:00-11:00',
            startTime: '09:00',
            endTime: '11:00',
          },
        ],
        TUE: [],
        WED: [],
        THU: [],
        FRI: [],
      },
    },
  ];

  const timeSlots = [
    '8:00',
    '9:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '19:00',
    '20:00',
    '21:00',
    '22:00',
  ];

  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI'];

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>INTELLIGENCE PLANNER</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>Generated Options</ThemedText>
          <ThemedText style={styles.subtitle}>
            BASED ON {constraintCount} {constraintCount === 1 ? 'CONSTRAINT' : 'CONSTRAINTS'}
          </ThemedText>
        </View>

        {/* Proposals */}
        {proposals.map((proposal, proposalIndex) => (
          <View key={proposal.id} style={styles.proposalContainer}>
            {/* Proposal Header */}
            <View style={styles.proposalHeader}>
              <View style={styles.proposalInfo}>
                <ThemedText style={styles.proposalLabel}>PROPOSAL {proposal.id}</ThemedText>
                <ThemedText style={styles.fitScore}>Fit Score: {proposal.fitScore}%</ThemedText>
              </View>
              <TouchableOpacity
                style={styles.saveButton}
                activeOpacity={0.8}
                onPress={() => {
                  const newPlan = {
                    id: `plan-${Date.now()}`,
                    date: new Date().toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: 'numeric',
                    }),
                    fitScore: proposal.fitScore,
                    schedule: proposal.schedule,
                  };
                  setSavedPlans((prev) => [...prev, newPlan]);
                  router.push(ROUTES.STUDENT.SAVED);
                }}>
                <ThemedText style={styles.saveButtonText}>SAVE PLAN</ThemedText>
              </TouchableOpacity>
            </View>

            {/* Schedule Grid */}
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleContainer}>
                {/* Fixed Time Column */}
                <View style={styles.fixedTimeSection}>
                  <View style={styles.timeHeaderFixed}>
                    <ThemedText style={styles.gridHeaderText}>TIME</ThemedText>
                  </View>
                  <View style={styles.timeColumnFixed}>
                    {timeSlots.map((time, index) => (
                      <View key={index} style={styles.timeSlot}>
                        <ThemedText style={styles.timeText}>{time}</ThemedText>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Scrollable Days Section */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={true}
                  style={styles.daysScrollView}
                  contentContainerStyle={styles.daysScrollContent}>
                  {/* Days Header */}
                  <View style={styles.daysHeaderContainer}>
                    {days.map((day, index) => (
                      <View
                        key={day}
                        style={[
                          styles.dayHeader,
                          index === days.length - 1 && styles.dayHeaderLast,
                        ]}>
                        <ThemedText style={styles.gridHeaderText}>{day}</ThemedText>
                      </View>
                    ))}
                  </View>

                  {/* Days Body */}
                  <View style={styles.daysBodyContainer}>
                    {days.map((day, dayIndex) => (
                      <View
                        key={day}
                        style={[
                          styles.dayColumn,
                          dayIndex === days.length - 1 && styles.dayColumnLast,
                        ]}>
                        {timeSlots.map((time, timeIndex) => {
                          const course = proposal.schedule[day as keyof typeof proposal.schedule]?.find(
                            (c) => {
                              const slotInfo = getTimeSlotSpan(c.startTime, c.endTime);
                              return timeIndex >= slotInfo.start && timeIndex < slotInfo.end;
                            }
                          );

                          if (course && getTimeSlotIndex(course.startTime) === timeIndex) {
                            const slotInfo = getTimeSlotSpan(course.startTime, course.endTime);
                            return (
                              <View key={timeIndex} style={styles.gridCell}>
                                <View
                                  style={[
                                    styles.courseBlock,
                                    {
                                      top: 2,
                                      height: slotInfo.span * 40 + (slotInfo.span - 1) * 1 - 4,
                                    },
                                  ]}>
                                  <View style={styles.courseContent}>
                                    <ThemedText style={styles.courseCode} numberOfLines={1}>
                                      {course.courseCode}
                                    </ThemedText>
                                    <ThemedText style={styles.courseName} numberOfLines={2}>
                                      {course.courseName}
                                    </ThemedText>
                                    <View style={styles.courseDetails}>
                                      <MaterialIcons name="person" size={14} color="#9B9B9B" />
                                      <ThemedText style={styles.courseDetailText} numberOfLines={1}>
                                        {course.instructor}
                                      </ThemedText>
                                    </View>
                                    <View style={styles.courseDetails}>
                                      <MaterialIcons name="location-on" size={14} color="#9B9B9B" />
                                      <ThemedText style={styles.courseDetailTextBold} numberOfLines={1}>
                                        {course.location}
                                      </ThemedText>
                                    </View>
                                  </View>
                                  <View style={styles.courseTimeContainer}>
                                    <ThemedText style={styles.courseTime} numberOfLines={1}>
                                      {course.time}
                                    </ThemedText>
                                  </View>
                                </View>
                              </View>
                            );
                          }

                          return (
                            <View key={timeIndex} style={styles.gridCell}>
                              <View style={styles.gridLine} />
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>

            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.adjustButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push(ROUTES.STUDENT.PLANNER_FLOW.CUSTOM_RULES)}
          activeOpacity={0.7}>
          <MaterialIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => router.push(ROUTES.STUDENT.PLANNER)}
          activeOpacity={0.8}>
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
    width: 80,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  daysScrollView: {
    flex: 1,
  },
  daysScrollContent: {
    flexDirection: 'column',
  },
  daysHeaderContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F8F8F8',
  },
  dayHeader: {
    width: 140,
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
    width: 80,
    backgroundColor: '#FAFAFA',
  },
  timeSlot: {
    height: 40,
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
    width: 140,
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  gridCell: {
    height: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  courseBlock: {
    backgroundColor: '#E0E0FF',
    borderRadius: 10,
    padding: 0,
    position: 'absolute',
    left: 6,
    right: 6,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  courseContent: {
    padding: 10,
    paddingBottom: 8,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333399',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 12,
    color: '#4A4A6A',
    marginBottom: 8,
    fontWeight: '400',
    lineHeight: 16,
  },
  courseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 6,
    flexShrink: 1,
  },
  courseDetailText: {
    fontSize: 11,
    color: '#4A4A6A',
    flex: 1,
    flexShrink: 1,
  },
  courseDetailTextBold: {
    fontSize: 11,
    color: '#4A4A6A',
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  courseTimeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 'auto',
    marginHorizontal: 6,
    marginBottom: 6,
    alignItems: 'center',
  },
  courseTime: {
    fontSize: 10,
    color: '#9B9B9B',
    fontWeight: '400',
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
});

