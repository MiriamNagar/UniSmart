import { ThemedText } from "@/components/themed-text";
import type { PlannerCourseDetailPayload } from "@/lib/planner-course-modal-detail";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  detail: PlannerCourseDetailPayload | null;
  onClose: () => void;
};

export function PlannerCourseDetailModal({ visible, detail, onClose }: Props) {
  if (!visible || !detail) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.courseDetailModalRoot}>
        <Pressable
          style={styles.courseDetailModalBackdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close details"
        />
        <View style={styles.courseDetailModalCard} accessibilityViewIsModal>
          <View style={styles.courseDetailModalHeader}>
            <ThemedText style={styles.courseDetailModalTitle}>
              {detail.courseCode} · {detail.courseName}
            </ThemedText>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <MaterialIcons name="close" size={22} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.courseDetailModalBody}
            showsVerticalScrollIndicator={false}
          >
            <ThemedText style={styles.courseDetailModalMeta}>
              {detail.calendarDay} · {detail.time}
            </ThemedText>
            <ThemedText style={styles.courseDetailModalRowLabel}>
              Description
            </ThemedText>
            {detail.shortDescription ? (
              <ThemedText style={styles.courseDetailModalRowValue}>
                {detail.shortDescription}
              </ThemedText>
            ) : (
              <ThemedText style={styles.courseDetailModalRowValueMuted}>
                No short catalog description available for this course.
              </ThemedText>
            )}
            <ThemedText style={styles.courseDetailModalRowLabel}>
              Session
            </ThemedText>
            <ThemedText style={styles.courseDetailModalRowValue}>
              {detail.lessonKindLabel}
            </ThemedText>
            <ThemedText style={styles.courseDetailModalRowLabel}>
              Instructors
            </ThemedText>
            <ThemedText style={styles.courseDetailModalRowValue}>
              {detail.instructorsLine || "—"}
            </ThemedText>
            <ThemedText style={styles.courseDetailModalRowLabel}>
              Location
            </ThemedText>
            <ThemedText style={styles.courseDetailModalRowValue}>
              {detail.location || "—"}
            </ThemedText>
            <ThemedText style={styles.courseDetailModalRowLabel}>
              Prerequisites
            </ThemedText>
            {detail.prerequisiteParentMissing ? (
              <ThemedText style={styles.courseDetailModalRowValueMuted}>
                Could not match this section to a catalog course. Prerequisite list
                unavailable.
              </ThemedText>
            ) : detail.prerequisiteNames.length > 0 ? (
              <ThemedText style={styles.courseDetailModalRowValue}>
                {detail.prerequisiteNames.join(" · ")}
              </ThemedText>
            ) : (
              <ThemedText style={styles.courseDetailModalRowValueMuted}>
                No prerequisites listed in the catalog for this course.
              </ThemedText>
            )}
            {detail.prerequisiteAdvisoryNote ? (
              <View style={styles.prerequisiteAdvisoryBox}>
                <ThemedText style={styles.prerequisiteAdvisoryText}>
                  {detail.prerequisiteAdvisoryNote}
                </ThemedText>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  courseDetailModalRoot: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  courseDetailModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  courseDetailModalCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 0,
    overflow: "hidden",
    zIndex: 2,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  courseDetailModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  courseDetailModalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 22,
  },
  courseDetailModalBody: {
    maxHeight: 360,
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 12,
  },
  courseDetailModalMeta: {
    fontSize: 13,
    color: "#5B4C9D",
    fontWeight: "600",
    marginBottom: 16,
  },
  courseDetailModalRowLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9B9B9B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 4,
  },
  courseDetailModalRowValue: {
    fontSize: 15,
    color: "#333333",
    lineHeight: 22,
  },
  courseDetailModalRowValueMuted: {
    fontSize: 14,
    color: "#888888",
    lineHeight: 20,
    fontStyle: "italic",
  },
  prerequisiteAdvisoryBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  prerequisiteAdvisoryText: {
    fontSize: 13,
    color: "#5D4037",
    lineHeight: 18,
  },
});
