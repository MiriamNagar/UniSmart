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
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";

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

export function useAdminDashboardViewModel() {
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
    ? liveAnalytics.enrollment.topDemandCourses.map((course, index) => ({
        listKey: `live-trend-${index}-${course.courseId}`,
        code: course.courseId,
        name: "Catalog occupancy indicator",
        enrolled: course.occupancyPercent,
        capacity: 100,
        percentage: course.occupancyPercent,
      }))
    : analytics.courseTrends.map((course, index) => ({
        ...course,
        listKey: `scoped-trend-${index}-${course.code}`,
      }));
  const highDemandCourses = liveAnalytics
    ? liveAnalytics.enrollment.topDemandCourses.map((course, index) => ({
        listKey: `live-demand-${index}-${course.courseId}`,
        name: course.courseId,
        percentage: course.occupancyPercent,
      }))
    : analytics.highDemandCourses.map((course, index) => ({
        ...course,
        listKey: `scoped-demand-${index}`,
      }));

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

  return {
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
  };
}
