import { ThemedText } from "@/components/themed-text";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type PlannerConstraintSummaryStripProps = {
  blockedDaysLabel: string;
  timeWindowLabel: string;
  preferencesLabel: string;
  onEditPress?: () => void;
};

export function PlannerConstraintSummaryStrip({
  blockedDaysLabel,
  timeWindowLabel,
  preferencesLabel,
  onEditPress,
}: PlannerConstraintSummaryStripProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <ThemedText style={styles.title}>Constraint summary</ThemedText>
        {onEditPress ? (
          <TouchableOpacity
            onPress={onEditPress}
            style={styles.editButton}
            accessibilityRole="button"
            accessibilityLabel="Edit planner constraints"
          >
            <MaterialIcons name="edit" size={16} color="#5B4C9D" />
            <ThemedText style={styles.editButtonText}>Edit</ThemedText>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.itemRow}>
        <ThemedText style={styles.itemLabel}>Blocked days</ThemedText>
        <ThemedText style={styles.itemValue}>{blockedDaysLabel}</ThemedText>
      </View>
      <View style={styles.itemRow}>
        <ThemedText style={styles.itemLabel}>Time window</ThemedText>
        <ThemedText style={styles.itemValue}>{timeWindowLabel}</ThemedText>
      </View>
      <View style={styles.itemRow}>
        <ThemedText style={styles.itemLabel}>Key preferences</ThemedText>
        <ThemedText style={styles.itemValue}>{preferencesLabel}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F8F6FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5DDFD",
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5B4C9D",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F1ECFF",
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#5B4C9D",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemLabel: {
    fontSize: 12,
    color: "#666666",
    flexShrink: 1,
  },
  itemValue: {
    fontSize: 12,
    color: "#1A1A1A",
    fontWeight: "600",
    textAlign: "right",
    flexShrink: 1,
  },
});
