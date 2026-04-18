import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import {
  buildDashboardAnalytics,
  buildFilterOptions,
  DEFAULT_ANALYTICS_FILTERS,
  type AdminAnalyticsFilterState,
  type AdminAnalyticsRow,
} from "@/lib/admin-analysis-filtering";
import {
  adminAnalyticsDisclaimer,
  buildAnalyticsCsv,
  buildPdfExportPlan,
  formatVisibleScope,
} from "@/lib/admin-analysis-export";
import { loadAdminDashboardAnalytics } from "@/lib/admin-dashboard-analytics";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const ANALYTICS_ROWS: AdminAnalyticsRow[] = [
  {
    studentId: "eng-soft-semA",
    department: "Engineering",
    major: "Software Engineering",
    semester: "Semester A",
    courseCode: "ENG205",
    courseName: "Software Arch & Design",
    enrolled: 92,
    capacity: 100,
    preferredTimeBlock: "10:00",
  },
  {
    studentId: "eng-cs-semA",
    department: "Engineering",
    major: "Computer Science",
    semester: "Semester A",
    courseCode: "CS102",
    courseName: "Data Structures",
    enrolled: 80,
    capacity: 100,
    preferredTimeBlock: "10:00",
  },
  {
    studentId: "eng-cs-semB",
    department: "Engineering",
    major: "Computer Science",
    semester: "Semester B",
    courseCode: "CS101",
    courseName: "Intro to Programming",
    enrolled: 74,
    capacity: 95,
    preferredTimeBlock: "12:00",
  },
  {
    studentId: "bus-fin-semA",
    department: "Business",
    major: "Finance",
    semester: "Semester A",
    courseCode: "FIN201",
    courseName: "Corporate Finance I",
    enrolled: 64,
    capacity: 90,
    preferredTimeBlock: "13:00",
  },
  {
    studentId: "arts-art-semB",
    department: "Arts",
    major: "Art History",
    semester: "Semester B",
    courseCode: "ART110",
    courseName: "History of Modern Art & Visual Culture",
    enrolled: 40,
    capacity: 70,
    preferredTimeBlock: "15:00",
  },
];

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const hasBrowserFileApis = (): boolean =>
  typeof document !== "undefined" &&
  typeof document.createElement === "function" &&
  typeof Blob !== "undefined" &&
  typeof URL !== "undefined" &&
  typeof URL.createObjectURL === "function" &&
  typeof URL.revokeObjectURL === "function";

function downloadUtf8CsvInBrowser(fileName: string, csv: string): void {
  const payload = `\uFEFF${csv}`;
  const blob = new Blob([payload], { type: "text/csv;charset=utf-8;" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.setAttribute("download", fileName);
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
}

function openPrintWindowForHtml(html: string): void {
  if (typeof window === "undefined" || typeof window.open !== "function") {
    throw new Error("Print window is not available in this environment.");
  }
  const printWindow = window.open("", "_blank", "noopener,noreferrer");
  if (!printWindow) {
    throw new Error(
      "The browser blocked the print window. Allow pop-ups for this site, or use CSV export.",
    );
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  globalThis.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    globalThis.setTimeout(() => {
      try {
        printWindow.close();
      } catch {
        /* ignore */
      }
    }, 600);
  }, 200);
}

export default function AdminDashboardScreen() {
  const { scrollViewProps } = usePersistedTabScroll(TAB_SCROLL_KEYS.ADMIN_DASHBOARD);
  const [filters, setFilters] = useState<AdminAnalyticsFilterState>(
    DEFAULT_ANALYTICS_FILTERS,
  );
  const [liveAnalytics, setLiveAnalytics] = useState<
    Awaited<ReturnType<typeof loadAdminDashboardAnalytics>> | null
  >(null);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const filterOptions = useMemo(() => buildFilterOptions(ANALYTICS_ROWS), []);
  const analytics = useMemo(
    () => buildDashboardAnalytics(ANALYTICS_ROWS, filters),
    [filters],
  );
  const visibleScope = useMemo(() => formatVisibleScope(filters), [filters]);
  const pdfExportPlan = useMemo(() => buildPdfExportPlan(filters), [filters]);

  useEffect(() => {
    let mounted = true;
    async function hydrateLiveAnalytics() {
      try {
        const next = await loadAdminDashboardAnalytics();
        if (!mounted) {
          return;
        }
        setLiveAnalytics(next);
        setAnalyticsError(null);
      } catch (error) {
        if (!mounted) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "Live analytics are unavailable right now.";
        const normalized = message.toLowerCase();
        setAnalyticsError(
          normalized.includes("insufficient permissions") ||
            normalized.includes("permission-denied")
            ? "Live Firestore analytics are unavailable for this account. Confirm this user has admin role access in Firestore."
            : message,
        );
      }
    }
    void hydrateLiveAnalytics();
    return () => {
      mounted = false;
    };
  }, []);

  const totalEnrollmentMetric =
    liveAnalytics?.enrollment.totalOccupancy ?? analytics.metrics.totalEnrollment;
  /** Peak time is derived from scoped demo rows so it moves with Department / Major / Semester. */
  const peakUtilizationMetric = analytics.metrics.peakUtilizationTime;
  const courseTrends = liveAnalytics
    ? liveAnalytics.enrollment.topDemandCourses.map((course) => ({
        code: course.courseId,
        name: "Catalog occupancy indicator",
        enrolled: course.occupancyPercent,
        capacity: 100,
        percentage: course.occupancyPercent,
      }))
    : analytics.courseTrends;
  const highDemandCourses = liveAnalytics
    ? liveAnalytics.enrollment.topDemandCourses.map((course) => ({
        name: course.courseId,
        percentage: course.occupancyPercent,
      }))
    : analytics.highDemandCourses;

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 90) return "#FF4444"; // Red
    if (percentage >= 70) return "#5B4C9D"; // Purple
    return "#E0E0E0"; // Grey
  };

  const updateFilter = <K extends keyof AdminAnalyticsFilterState>(
    key: K,
    value: AdminAnalyticsFilterState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const buildScopedExportRows = () =>
    analytics.courseTrends.map((course) => {
      const matching = ANALYTICS_ROWS.find((row) => row.courseCode === course.code);
      return {
        studentId: matching?.studentId ?? "aggregated",
        department: matching?.department ?? filters.department,
        major: matching?.major ?? filters.major,
        semester: matching?.semester ?? filters.semester,
        courseCode: course.code,
        courseName: course.name,
        enrolled: course.enrolled,
        capacity: course.capacity,
        preferredTimeBlock: matching?.preferredTimeBlock ?? "N/A",
      };
    });

  const buildPdfHtml = (rows: ReturnType<typeof buildScopedExportRows>, generatedAtIso: string) => {
    const tableRows = rows
      .map(
        (row) => `
          <tr>
            <td>${escapeHtml(row.courseCode)}</td>
            <td>${escapeHtml(row.courseName)}</td>
            <td>${escapeHtml(row.department)}</td>
            <td>${escapeHtml(row.major)}</td>
            <td>${escapeHtml(row.semester)}</td>
            <td>${row.enrolled}</td>
            <td>${row.capacity}</td>
          </tr>
        `,
      )
      .join("");

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Admin Analytics Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
            h1 { margin: 0 0 8px; font-size: 22px; }
            .meta { margin-bottom: 12px; font-size: 12px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .disclaimer { margin-top: 16px; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          <h1>UniSmart Admin Analytics</h1>
          <div class="meta">Scope: ${escapeHtml(visibleScope)}</div>
          <div class="meta">Generated at: ${escapeHtml(generatedAtIso)}</div>
          <table>
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Department</th>
                <th>Major</th>
                <th>Semester</th>
                <th>Enrolled</th>
                <th>Capacity</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="disclaimer">${escapeHtml(adminAnalyticsDisclaimer)}</div>
        </body>
      </html>
    `;
  };

  const handleCsvExport = async () => {
    if (analytics.courseTrends.length === 0) {
      Alert.alert(
        "No scoped data",
        "Adjust Department, Major, or Semester to export scoped rows.",
      );
      return;
    }

    const rows = buildScopedExportRows();
    const csv = buildAnalyticsCsv({
      rows,
      scope: filters,
      generatedAtIso: new Date().toISOString(),
    });

    try {
      if (hasBrowserFileApis()) {
        downloadUtf8CsvInBrowser(`admin-analytics-${Date.now()}.csv`, csv);
        Alert.alert("CSV Export Complete", "Downloaded CSV to your browser downloads folder.");
        return;
      }

      const FileSystem = await import("expo-file-system/legacy");
      const Sharing = await import("expo-sharing");
      const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

      if (!baseDir) {
        throw new Error("No writable export directory is available.");
      }

      const fileUri = `${baseDir}admin-analytics-${Date.now()}.csv`;
      const utf8Encoding =
        "EncodingType" in FileSystem && FileSystem.EncodingType?.UTF8 !== undefined
          ? FileSystem.EncodingType.UTF8
          : "utf8";
      await FileSystem.writeAsStringAsync(fileUri, `\uFEFF${csv}`, {
        encoding: utf8Encoding,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "text/csv",
          dialogTitle: "Export scoped analytics CSV",
          UTI: "public.comma-separated-values-text",
        });
        return;
      }

      Alert.alert("CSV Export Complete", `CSV saved to ${fileUri}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown export failure.";
      Alert.alert("CSV Export Failed", message);
    }
  };

  const handleExportPdf = async () => {
    if (analytics.courseTrends.length === 0) {
      Alert.alert(
        "No scoped data",
        "Adjust Department, Major, or Semester to export scoped rows.",
      );
      return;
    }

    const rows = buildScopedExportRows();
    const generatedAtIso = new Date().toISOString();
    const html = buildPdfHtml(rows, generatedAtIso);

    try {
      const Print = await import("expo-print");

      if (hasBrowserFileApis()) {
        try {
          await Print.printAsync({ html });
          Alert.alert(
            "Print dialog opened",
            "Choose Save as PDF in your browser print dialog.",
          );
          return;
        } catch (primaryPrintError) {
          try {
            openPrintWindowForHtml(html);
            Alert.alert(
              "Print dialog opened",
              "If you do not see a print window, allow pop-ups for this site. You can use CSV export as a fallback.",
            );
            return;
          } catch {
            throw primaryPrintError instanceof Error
              ? primaryPrintError
              : new Error(String(primaryPrintError));
          }
        }
      }

      if (typeof Print.printToFileAsync !== "function") {
        throw new Error("PDF file export is unavailable on this platform.");
      }

      const file = await Print.printToFileAsync({ html });
      const Sharing = await import("expo-sharing");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          dialogTitle: "Export scoped analytics PDF",
          UTI: "com.adobe.pdf",
        });
        return;
      }
      Alert.alert("PDF Export Complete", `PDF saved to ${file.uri}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown PDF export failure.";
      Alert.alert(
        "PDF export failed",
        `${message}\nUse CSV export for this scoped dataset.\n\nNote: ${pdfExportPlan.reason}`,
      );
    }
  };

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
              {filterOptions.departments.map((department) => (
                <TouchableOpacity
                  key={department}
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
              {filterOptions.majors.map((major) => (
                <TouchableOpacity
                  key={major}
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
              {filterOptions.semesters.map((semester) => (
                <TouchableOpacity
                  key={semester}
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
              <View key={course.code} style={styles.courseRow}>
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
                <View key={course.name} style={styles.demandItem}>
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
