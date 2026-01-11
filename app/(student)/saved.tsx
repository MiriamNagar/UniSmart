import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSelection } from '@/contexts/selection-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function SavedScreen() {
  const { savedPlans, setSavedPlans } = useSelection();

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

  const deletePlan = (planId: string) => {
    setSavedPlans((prev) => prev.filter((plan) => plan.id !== planId));
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>MY WORKSPACE</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>My Workspace</ThemedText>
          <ThemedText style={styles.subtitle}>FINALIZED PLANS</ThemedText>
        </View>

        {/* Saved Plans */}
        {savedPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyStateText}>No saved plans.</ThemedText>
          </View>
        ) : (
          savedPlans.map((plan) => (
            <View key={plan.id} style={styles.planCard}>
              {/* Plan Header */}
              <View style={styles.planHeader}>
                <ThemedText style={styles.compiledText}>COMPILED {plan.date}</ThemedText>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePlan(plan.id)}
                  activeOpacity={0.7}>
                  <MaterialIcons name="delete" size={20} color="#FF4444" />
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
                            const course = plan.schedule[day as keyof typeof plan.schedule]?.find(
                              (c: any) => {
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
                                        <ThemedText
                                          style={styles.courseDetailTextBold}
                                          numberOfLines={1}>
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
          ))
        )}
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
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emptyState: {
    paddingTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9B9B9B',
  },
  planCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  compiledText: {
    fontSize: 12,
    color: '#9B9B9B',
    fontWeight: '500',
  },
  deleteButton: {
    padding: 4,
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
});

