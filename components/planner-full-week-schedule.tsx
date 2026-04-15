import { ThemedText } from "@/components/themed-text";
import {
  PLANNER_WEEK_DAYS,
  PLANNER_WEEK_TIME_SLOTS,
  type PlannerWeekDayKey,
} from "@/lib/planner-week-constants";
import type { PlannerWeekCellLike } from "@/lib/planner-course-modal-detail";
import { hydrateSavedCellDisplayFromCatalog } from "@/lib/saved-schedule-catalog-hydrate";
import type { Course } from "@/types/courses";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";

const DEFAULT_SCROLL_H_PAD = 24 * 2;
const DEFAULT_TIME_COL_W = 52;
const DEFAULT_SLOT_HEIGHT = 40;

type Props = {
  schedule: Record<PlannerWeekDayKey, PlannerWeekCellLike[]>;
  onCellPress: (cell: PlannerWeekCellLike, day: PlannerWeekDayKey) => void;
  /** When true, fill missing names/descriptions from the active catalog. */
  hydrateFromCatalog: boolean;
  catalogCourses: Course[];
  /** Match parent ScrollView horizontal padding (×2 for left+right). */
  scrollHorizontalPadding?: number;
  timeColumnWidth?: number;
  /** Height of one hour row in the grid. */
  slotHeight?: number;
};

function getTimeSlotIndex(time: string, timeSlots: readonly string[]): number {
  const hour = parseInt(time.split(":")[0], 10);
  return timeSlots.findIndex((slot) => parseInt(slot.split(":")[0], 10) === hour);
}

function getTimeSlotSpan(
  startTime: string,
  endTime: string,
  timeSlots: readonly string[],
): { start: number; end: number; span: number } {
  const start = getTimeSlotIndex(startTime, timeSlots);
  const end = getTimeSlotIndex(endTime, timeSlots);
  return { start, end, span: end - start };
}

export function PlannerFullWeekSchedule({
  schedule,
  onCellPress,
  hydrateFromCatalog,
  catalogCourses,
  scrollHorizontalPadding = DEFAULT_SCROLL_H_PAD,
  timeColumnWidth = DEFAULT_TIME_COL_W,
  slotHeight = DEFAULT_SLOT_HEIGHT,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const timeSlots = PLANNER_WEEK_TIME_SLOTS;
  const days = PLANNER_WEEK_DAYS;

  const approxDayColumnWidth = Math.max(
    0,
    (windowWidth - scrollHorizontalPadding - timeColumnWidth) / 6,
  );
  const showDescriptionInCell = approxDayColumnWidth >= 88;
  const showInstructorRowsInCell = approxDayColumnWidth >= 56;
  const narrow = approxDayColumnWidth < 72;

  const renderCourseBlock = (
    course: PlannerWeekCellLike,
    day: PlannerWeekDayKey,
    slotInfo: { span: number },
    timeIndex: number,
  ) => {
    const hydrated = hydrateFromCatalog
      ? hydrateSavedCellDisplayFromCatalog(course, catalogCourses)
      : {
          shortDescription: course.shortDescription?.trim() || undefined,
          courseName: course.courseName?.trim() || "Unknown",
        };

    const blockHeight = slotInfo.span * slotHeight + (slotInfo.span - 1) * 1 - 4;

    return (
      <View key={timeIndex} style={[styles.gridCell, { height: slotHeight }]}>
        <View
          style={[
            styles.courseBlock,
            {
              top: 2,
              height: blockHeight,
              left: narrow ? 2 : 6,
              right: narrow ? 2 : 6,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${course.courseCode}, ${hydrated.courseName}. Tap for details.`}
            onPress={() => onCellPress(course, day)}
            style={styles.coursePressable}
          >
            <View style={[styles.courseContent, narrow && styles.courseContentCompact]}>
              <ThemedText
                style={[styles.courseCode, narrow && styles.courseCodeCompact]}
                numberOfLines={1}
              >
                {course.courseCode}
              </ThemedText>
              <ThemedText
                style={[styles.courseName, narrow && styles.courseNameCompact]}
                numberOfLines={narrow ? 1 : 2}
              >
                {hydrated.courseName}
              </ThemedText>
              {showDescriptionInCell && hydrated.shortDescription ? (
                <ThemedText style={styles.courseShortDescription} numberOfLines={2}>
                  {hydrated.shortDescription}
                </ThemedText>
              ) : null}
              {course.lessonKindLabel ? (
                <ThemedText
                  style={[styles.lessonKindTag, narrow && styles.lessonKindCompact]}
                  numberOfLines={1}
                >
                  {course.lessonKindLabel}
                </ThemedText>
              ) : null}
              {showInstructorRowsInCell ? (
                <>
                  <View style={styles.courseDetails}>
                    <MaterialIcons name="person" size={narrow ? 11 : 14} color="#9B9B9B" />
                    <ThemedText style={styles.courseDetailText} numberOfLines={2}>
                      {course.instructorsLine ?? course.instructor ?? "—"}
                    </ThemedText>
                  </View>
                  <View style={styles.courseDetails}>
                    <MaterialIcons name="location-on" size={narrow ? 11 : 14} color="#9B9B9B" />
                    <ThemedText style={styles.courseDetailTextBold} numberOfLines={1}>
                      {course.location ?? "—"}
                    </ThemedText>
                  </View>
                </>
              ) : null}
            </View>
            <View
              style={[styles.courseTimeContainer, narrow && styles.courseTimeContainerCompact]}
            >
              <ThemedText
                style={[styles.courseTime, narrow && styles.courseTimeCompact]}
                numberOfLines={1}
              >
                {course.time ?? `${course.startTime}-${course.endTime}`}
              </ThemedText>
            </View>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.scheduleCard}>
      <View style={styles.scheduleContainer}>
        <View style={[styles.fixedTimeSection, { width: timeColumnWidth }]}>
          <View style={[styles.timeHeaderFixed, { width: timeColumnWidth }]}>
            <ThemedText style={styles.gridHeaderText}>TIME</ThemedText>
          </View>
          <View style={[styles.timeColumnFixed, { width: timeColumnWidth }]}>
            {timeSlots.map((time, index) => (
              <View key={index} style={[styles.timeSlot, { height: slotHeight }]}>
                <ThemedText style={styles.timeText} numberOfLines={1}>
                  {time}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.daysPane}>
          <View style={styles.daysHeaderContainer}>
            {days.map((day, index) => (
              <View
                key={day}
                style={[
                  styles.dayHeader,
                  styles.dayHeaderFlex,
                  index === days.length - 1 && styles.dayHeaderLast,
                ]}
              >
                <ThemedText style={styles.dayHeaderLabel} numberOfLines={1}>
                  {day}
                </ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.daysBodyContainer}>
            {days.map((day, dayIndex) => (
              <View
                key={day}
                style={[
                  styles.dayColumn,
                  styles.dayColumnFlex,
                  dayIndex === days.length - 1 && styles.dayColumnLast,
                ]}
              >
                {timeSlots.map((_, timeIndex) => {
                  const dayCourses =
                    (schedule[day] as PlannerWeekCellLike[] | undefined) ?? [];
                  const course = dayCourses.find((c) => {
                    const slotInfo = getTimeSlotSpan(c.startTime, c.endTime, timeSlots);
                    return timeIndex >= slotInfo.start && timeIndex < slotInfo.end;
                  });

                  if (course && getTimeSlotIndex(course.startTime, timeSlots) === timeIndex) {
                    const slotInfo = getTimeSlotSpan(course.startTime, course.endTime, timeSlots);
                    return renderCourseBlock(course, day, slotInfo, timeIndex);
                  }

                  return (
                    <View key={timeIndex} style={[styles.gridCell, { height: slotHeight }]}>
                      <View style={styles.gridLine} />
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    overflow: "hidden",
  },
  scheduleContainer: {
    flexDirection: "row",
  },
  fixedTimeSection: {
    borderRightWidth: 2,
    borderRightColor: "#E0E0E0",
  },
  timeHeaderFixed: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
    alignItems: "center",
    justifyContent: "center",
  },
  daysPane: {
    flex: 1,
    minWidth: 0,
  },
  daysHeaderContainer: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#F8F8F8",
  },
  dayHeader: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
  },
  dayHeaderFlex: {
    flex: 1,
    minWidth: 0,
  },
  dayHeaderLast: { borderRightWidth: 0 },
  dayColumnLast: { borderRightWidth: 0 },
  dayHeaderLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  gridHeaderText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  daysBodyContainer: {
    flexDirection: "row",
  },
  timeColumnFixed: {
    backgroundColor: "#FAFAFA",
  },
  timeSlot: {
    justifyContent: "center",
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  timeText: {
    fontSize: 9,
    color: "#9B9B9B",
    textAlign: "center",
  },
  dayColumn: {
    borderRightWidth: 1,
    borderRightColor: "#E0E0E0",
  },
  dayColumnFlex: {
    flex: 1,
    minWidth: 0,
  },
  gridCell: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    position: "relative",
  },
  gridLine: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  courseBlock: {
    backgroundColor: "#E0E0FF",
    borderRadius: 8,
    padding: 0,
    position: "absolute",
    left: 6,
    right: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
    flexDirection: "column",
  },
  coursePressable: {
    flex: 1,
    flexDirection: "column",
  },
  courseContent: {
    padding: 10,
    paddingBottom: 8,
  },
  courseContentCompact: {
    padding: 4,
    paddingBottom: 4,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333399",
    marginBottom: 4,
  },
  courseCodeCompact: {
    fontSize: 9,
    marginBottom: 2,
  },
  courseName: {
    fontSize: 12,
    color: "#4A4A6A",
    marginBottom: 4,
    fontWeight: "400",
    lineHeight: 16,
  },
  courseNameCompact: {
    fontSize: 8,
    lineHeight: 11,
    marginBottom: 2,
  },
  courseShortDescription: {
    marginTop: 2,
    fontSize: 10,
    color: "#6C6C80",
    lineHeight: 14,
  },
  lessonKindTag: {
    fontSize: 10,
    fontWeight: "700",
    color: "#333399",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 4,
  },
  lessonKindCompact: {
    fontSize: 7,
    marginTop: 2,
    marginBottom: 2,
  },
  courseDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 6,
    flexShrink: 1,
  },
  courseDetailText: {
    fontSize: 11,
    color: "#4A4A6A",
    flex: 1,
    flexShrink: 1,
  },
  courseDetailTextBold: {
    fontSize: 11,
    color: "#4A4A6A",
    fontWeight: "600",
    flex: 1,
    flexShrink: 1,
  },
  courseTimeContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: "auto",
    marginHorizontal: 6,
    marginBottom: 6,
    alignItems: "center",
  },
  courseTimeContainerCompact: {
    paddingVertical: 3,
    paddingHorizontal: 2,
    marginHorizontal: 2,
    marginBottom: 3,
    borderRadius: 4,
  },
  courseTime: {
    fontSize: 10,
    color: "#9B9B9B",
    fontWeight: "400",
  },
  courseTimeCompact: {
    fontSize: 7,
  },
});
