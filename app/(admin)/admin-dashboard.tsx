import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { adminAnalyticsDisclaimer } from "@/lib/admin-analysis-export";
import { MaterialIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useAdminDashboardViewModel } from "@/view-models/use-admin-dashboard-view-model";

export default function AdminDashboardScreen() {
  const {
    scrollViewProps,
    filters,
    liveAnalytics,
    analyticsError,
    filterOptions,
    analytics,
    visibleScope,
    pdfExportPlan,
    totalEnrollmentMetric,
    peakUtilizationMetric,
    courseTrends,
    highDemandCourses,
    getProgressBarColor,
    updateFilter,
    buildScopedExportRows,
    buildPdfHtml,
    handleCsvExport,
    handleExportPdf,
  } = useAdminDashboardViewModel();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>ANALYTICS SUITE</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dashboard Title */}
        <ThemedText style={styles.dashboardTitle}>Admin Dashboard</ThemedText>
        <ThemedText style={styles.scopedSubtitle}>Cohort scope: {visibleScope}</ThemedText>
        <ThemedText style={styles.disclaimerText}>{adminAnalyticsDisclaimer}</ThemedText>
        {analyticsError ? (
          <View style={styles.errorBanner}>
            <ThemedText style={styles.errorBannerText}>{analyticsError}</ThemedText>
          </View>
        ) : null}

        <View style={styles.filtersCard}>
          <ThemedText style={styles.filterTitle}>SCOPE FILTERS</ThemedText>
          <View style={styles.filterGroup}>
            <ThemedText style={styles.filterLabel}>Department</ThemedText>
            <View style={styles.filterChips}>
              {filterOptions.departments.map((department, chipIndex) => (
                <TouchableOpacity
                  key={`filter-dept-${chipIndex}`}
                  style={[
                    styles.filterChip,
                    filters.department === department && styles.filterChipSelected,
                  ]}
                  onPress={() => updateFilter("department", department)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      filters.department === department &&
                        styles.filterChipTextSelected,
                    ]}
                  >
                    {department}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterGroup}>
            <ThemedText style={styles.filterLabel}>Major</ThemedText>
            <View style={styles.filterChips}>
              {filterOptions.majors.map((major, chipIndex) => (
                <TouchableOpacity
                  key={`filter-major-${chipIndex}`}
                  style={[
                    styles.filterChip,
                    filters.major === major && styles.filterChipSelected,
                  ]}
                  onPress={() => updateFilter("major", major)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      filters.major === major && styles.filterChipTextSelected,
                    ]}
                  >
                    {major}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterGroup}>
            <ThemedText style={styles.filterLabel}>Semester</ThemedText>
            <View style={styles.filterChips}>
              {filterOptions.semesters.map((semester, chipIndex) => (
                <TouchableOpacity
                  key={`filter-sem-${chipIndex}`}
                  style={[
                    styles.filterChip,
                    filters.semester === semester && styles.filterChipSelected,
                  ]}
                  onPress={() => updateFilter("semester", semester)}
                  activeOpacity={0.7}
                >
                  <ThemedText
                    style={[
                      styles.filterChipText,
                      filters.semester === semester && styles.filterChipTextSelected,
                    ]}
                  >
                    {semester}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          {/* Total Enrollment Card */}
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>TOTAL ENROLLMENT</ThemedText>
            <ThemedText style={styles.metricValue}>
              {totalEnrollmentMetric}
            </ThemedText>
            <View style={styles.changeContainer}>
              <ThemedText style={styles.changeText}>
                {liveAnalytics
                  ? "Live aggregate from bounded Firestore queries"
                  : "Scoped by selected cohort"}
              </ThemedText>
            </View>
          </View>

          {/* Peak Utilization Card */}
          <View style={styles.metricCard}>
            <ThemedText style={styles.metricLabel}>PEAK UTILIZATION</ThemedText>
            <ThemedText style={styles.metricValueOrange}>
              {peakUtilizationMetric}
            </ThemedText>
            <ThemedText style={styles.metricDescription}>
              {liveAnalytics
                ? `Busiest block in scoped demo · Live catalog ${liveAnalytics.enrollment.utilizationPercent}% full (all offerings)`
                : "Busiest scheduling block"}
            </ThemedText>
          </View>
        </View>

        {/* Course Registration Trends */}
        <View style={styles.trendsCard}>
          <ThemedText style={styles.sectionTitle}>
            COURSE REGISTRATION TRENDS
          </ThemedText>
          {courseTrends.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              No scoped records for this filter combination.
            </ThemedText>
          ) : (
            courseTrends.map((course) => (
              <View key={course.listKey} style={styles.courseRow}>
                <View style={styles.courseInfo}>
                  <ThemedText style={styles.courseCode}>{course.code}</ThemedText>
                  <ThemedText style={styles.courseName}>{course.name}</ThemedText>
                </View>
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${course.percentage}%`,
                        backgroundColor: getProgressBarColor(course.percentage),
                      },
                    ]}
                  />
                  <ThemedText style={styles.progressText}>
                    {course.enrolled}/{course.capacity}
                  </ThemedText>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Demand Analysis Report */}
        <View style={styles.reportCard}>
          <View style={styles.reportHeader}>
            <ThemedText style={styles.reportTitle}>
              DEMAND ANALYSIS REPORT
            </ThemedText>
            <TouchableOpacity activeOpacity={0.7} onPress={handleExportPdf}>
              <MaterialIcons name="picture-as-pdf" size={24} color="#B8B3E0" />
            </TouchableOpacity>
          </View>

          {/* High Demand Electives */}
          <View style={styles.reportSection}>
            <ThemedText style={styles.reportSectionTitle}>
              HIGH DEMAND ELECTIVES
            </ThemedText>
            {highDemandCourses.length === 0 ? (
              <ThemedText style={styles.emptyReportText}>
                No high-demand courses in this scope.
              </ThemedText>
            ) : (
              highDemandCourses.map((course) => (
                <View key={course.listKey} style={styles.demandItem}>
                  <ThemedText style={styles.demandCourseName}>
                    {course.name}
                  </ThemedText>
                  <View style={styles.demandBadge}>
                    <ThemedText style={styles.demandBadgeText}>
                      {course.percentage}% CAP
                    </ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Scheduling Bottlenecks */}
          <View style={styles.reportSection}>
            <ThemedText style={styles.reportSectionTitle}>
              SCHEDULING BOTTLENECKS
            </ThemedText>
            <ThemedText style={styles.bottleneckText}>
              {liveAnalytics?.enrollment.topDemandCourses[0]
                ? `Highest pressure section currently: ${liveAnalytics.enrollment.topDemandCourses[0].courseId} (${liveAnalytics.enrollment.topDemandCourses[0].occupancyPercent}% occupancy).`
                : "Student preferences show heavy density around 10:00 AM. Recommend moving 2-3 elective sections to 03:00 PM to optimize classroom allocation."}
            </ThemedText>
          </View>
          <View style={styles.exportMetadata}>
            <ThemedText style={styles.exportMetadataScope}>{visibleScope}</ThemedText>
            <ThemedText style={styles.exportMetadataDisclaimer}>
              {adminAnalyticsDisclaimer}
            </ThemedText>
          </View>

          {/* Export Buttons */}
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={styles.exportPdfButton}
              activeOpacity={0.8}
              onPress={handleExportPdf}
            >
              <ThemedText style={styles.exportPdfText}>
                EXPORT ANALYSIS PDF
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportCsvButton}
              activeOpacity={0.8}
              onPress={handleCsvExport}
            >
              <MaterialIcons name="download" size={20} color="#FFFFFF" />
              <ThemedText style={styles.exportCsvText}>
                DOWNLOAD DATA CSV
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "flex-start",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  headerTitleSmart: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#5B4C9D",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dashboardTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 24,
  },
  scopedSubtitle: {
    fontSize: 14,
    color: "#6D6D6D",
    marginBottom: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: "#8A8A8A",
    marginBottom: 12,
  },
  errorBanner: {
    backgroundColor: "#FFF1F1",
    borderColor: "#FFD5D5",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12,
    color: "#8C2A2A",
  },
  filtersCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    gap: 16,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#9B9B9B",
    letterSpacing: 0.6,
  },
  filterGroup: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5B4C9D",
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#D7D7D7",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  filterChipSelected: {
    borderColor: "#5B4C9D",
    backgroundColor: "#EDE9FF",
  },
  filterChipText: {
    fontSize: 12,
    color: "#6D6D6D",
    fontWeight: "500",
  },
  filterChipTextSelected: {
    color: "#3D2D86",
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  metricsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9B9B9B",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#5B4C9D",
    marginBottom: 8,
  },
  metricValueOrange: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FF9800",
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeText: {
    fontSize: 14,
    color: "#9B9B9B",
    marginLeft: 4,
  },
  metricDescription: {
    fontSize: 14,
    color: "#9B9B9B",
  },
  trendsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 20,
    textTransform: "uppercase",
  },
  courseRow: {
    marginBottom: 16,
  },
  courseInfo: {
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B4C9D",
    marginBottom: 4,
  },
  courseName: {
    fontSize: 14,
    color: "#1A1A1A",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#9B9B9B",
    minWidth: 50,
    textAlign: "right",
  },
  reportCard: {
    backgroundColor: "#5B4C9D",
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#B8B3E0",
    textTransform: "uppercase",
  },
  reportSection: {
    marginBottom: 24,
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B8B3E0",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  emptyText: {
    fontSize: 13,
    color: "#9B9B9B",
  },
  emptyReportText: {
    fontSize: 13,
    color: "#E2DCF8",
  },
  demandItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  demandCourseName: {
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  demandBadge: {
    backgroundColor: "#B8B3E0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  demandBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5B4C9D",
  },
  bottleneckText: {
    fontSize: 14,
    color: "#FFFFFF",
    lineHeight: 20,
  },
  exportMetadata: {
    backgroundColor: "#6A5BB0",
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  exportMetadataScope: {
    fontSize: 12,
    color: "#F6F2FF",
    fontWeight: "600",
  },
  exportMetadataDisclaimer: {
    fontSize: 12,
    color: "#E2DCF8",
  },
  exportButtons: {
    gap: 12,
    marginTop: 8,
  },
  exportPdfButton: {
    backgroundColor: "#B8B3E0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  exportPdfText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B4C9D",
    letterSpacing: 0.5,
  },
  exportCsvButton: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exportCsvText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
});