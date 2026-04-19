import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { usePlannerViewModel } from "@/view-models/use-planner-view-model";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function PlannerScreen() {
  const {
    selectedSemester,
    activeDegreeYearTier,
    userInfo,
    scrollViewProps,
    degreeYearOptions,
    selectDegreeYear,
    selectSemester,
    beginCourseSelection,
  } = usePlannerViewModel();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>UniSmart</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          INTELLIGENCE PLANNER
        </ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View
            style={styles.iconSquare}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <MaterialIcons name="schedule" size={64} color="#5B4C9D" />
          </View>
        </View>

        {/* Title */}
        <ThemedText style={styles.title} accessibilityRole="header">
          Smart Planner
        </ThemedText>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <ThemedText style={styles.descriptionText}>
            Courses filtered for{" "}
            <ThemedText style={styles.highlightedText}>
              {userInfo.major || "Computer Science"}
            </ThemedText>
            {userInfo.academicLevel ? (
              <>
                {", "}
                <ThemedText style={styles.highlightedText}>
                  {userInfo.academicLevel}
                </ThemedText>
              </>
            ) : null}
            . Active term:{" "}
            <ThemedText style={styles.highlightedText}>
              {degreeYearOptions.find(
                (o) => o.tier === activeDegreeYearTier,
              )?.label ?? "Year 1"}
            </ThemedText>
            {" · "}
            <ThemedText style={styles.highlightedText}>
              {selectedSemester === "Sem 1" ? "Semester A" : "Semester B"}
            </ThemedText>
            .
          </ThemedText>
        </View>

        {/* Degree year (catalog) — drives which offerings appear with the semester */}
        <View style={styles.semesterSection}>
          <ThemedText style={styles.sectionLabel}>
            SELECT DEGREE YEAR
          </ThemedText>
          <View
            style={styles.degreeYearGrid}
            accessibilityRole="radiogroup"
            accessibilityLabel="Degree year selection"
          >
            {degreeYearOptions.map((opt) => (
              <TouchableOpacity
                key={opt.tier}
                style={[
                  styles.degreeYearButton,
                  activeDegreeYearTier === opt.tier &&
                    styles.semesterButtonSelected,
                ]}
                onPress={() => {
                  selectDegreeYear(opt.tier);
                }}
                accessibilityRole="radio"
                accessibilityLabel={opt.label}
                accessibilityHint="Filters available courses to this degree year"
                accessibilityState={{ selected: activeDegreeYearTier === opt.tier }}
                activeOpacity={0.7}
              >
                <ThemedText
                  style={[
                    styles.degreeYearButtonText,
                    activeDegreeYearTier === opt.tier &&
                      styles.semesterButtonTextSelected,
                  ]}
                >
                  {opt.label}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Semester Selection */}
        <View style={styles.semesterSection}>
          <ThemedText style={styles.sectionLabel}>
            SELECT SEMESTER (A = FIRST, B = SECOND)
          </ThemedText>
          <View
            style={styles.semesterButtons}
            accessibilityRole="radiogroup"
            accessibilityLabel="Semester selection"
          >
            <TouchableOpacity
              style={[
                styles.semesterButton,
                selectedSemester === "Sem 1" && styles.semesterButtonSelected,
              ]}
              onPress={() => {
                selectSemester("Sem 1");
              }}
              accessibilityRole="radio"
              accessibilityLabel="Semester A"
              accessibilityHint="Shows courses for the first semester"
              accessibilityState={{ selected: selectedSemester === "Sem 1" }}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.semesterButtonText,
                  selectedSemester === "Sem 1" &&
                    styles.semesterButtonTextSelected,
                ]}
              >
                Semester A
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.semesterButton,
                selectedSemester === "Sem 2" && styles.semesterButtonSelected,
              ]}
              onPress={() => {
                selectSemester("Sem 2");
              }}
              accessibilityRole="radio"
              accessibilityLabel="Semester B"
              accessibilityHint="Shows courses for the second semester"
              accessibilityState={{ selected: selectedSemester === "Sem 2" }}
              activeOpacity={0.7}
            >
              <ThemedText
                style={[
                  styles.semesterButtonText,
                  selectedSemester === "Sem 2" &&
                    styles.semesterButtonTextSelected,
                ]}
              >
                Semester B
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Begin Course Selection Button */}
        <TouchableOpacity
          style={styles.beginButton}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Begin course selection"
          accessibilityHint="Opens the course selection step for the planner flow"
          onPress={beginCourseSelection}
        >
          <ThemedText style={styles.beginButtonText}>
            Begin Course Selection
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 24,
  },
  iconSquare: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: "#E8E6F7",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 16,
  },
  descriptionContainer: {
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 16,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 24,
  },
  highlightedText: {
    color: "#5B4C9D",
    fontWeight: "600",
  },
  semesterSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 16,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  degreeYearGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  degreeYearButton: {
    flexBasis: "30%",
    minWidth: 100,
    flexGrow: 1,
    height: 52,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  degreeYearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9B9B9B",
    textAlign: "center",
  },
  semesterButtons: {
    flexDirection: "row",
    gap: 12,
  },
  semesterButton: {
    flex: 1,
    height: 64,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  semesterButtonSelected: {
    borderColor: "#5B4C9D",
  },
  semesterButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9B9B9B",
  },
  semesterButtonTextSelected: {
    color: "#5B4C9D",
  },
  beginButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#5B4C9D",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  beginButtonText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
});
