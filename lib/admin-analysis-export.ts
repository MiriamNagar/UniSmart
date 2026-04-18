import {
  ALL_DEPARTMENTS_LABEL,
  ALL_MAJORS_LABEL,
  ALL_SEMESTERS_LABEL,
  type AdminAnalyticsFilterState,
  type AdminAnalyticsRow,
} from "@/lib/admin-analysis-filtering";

const DEFAULT_DISCLAIMER =
  "System analytics only; not official registrar data.";
const DEFAULT_PDF_DEFER_REASON =
  "PDF export is deferred in this milestone to keep implementation lightweight.";

export interface AdminPdfExportPlan {
  status: "deferred";
  format: "pdf";
  fallbackFormat: "csv";
  reason: string;
  disclaimer: string;
  visibleScope: string;
}

export interface AdminAnalysisExportExerciseResult {
  scopedRows: AdminAnalyticsRow[];
  csv: string;
  pdfPlan: AdminPdfExportPlan;
  visibleScope: string;
  disclaimer: string;
}

const toCsvCell = (value: string | number): string => {
  const normalized = String(value);
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
};

const utilizationPercent = (row: AdminAnalyticsRow): string => {
  if (row.capacity <= 0) {
    return "0.00";
  }

  return ((row.enrolled / row.capacity) * 100).toFixed(2);
};

const matchesScopeValue = (
  selected: string,
  allLabel: string,
  rowValue: string,
): boolean => selected === "All" || selected === allLabel || selected === rowValue;

export type AdminAnalysisRow = AdminAnalyticsRow;

export const filterAnalyticsRows = (
  rows: AdminAnalyticsRow[],
  scope: AdminAnalyticsFilterState,
): AdminAnalyticsRow[] =>
  rows.filter(
    (row) =>
      matchesScopeValue(scope.department, ALL_DEPARTMENTS_LABEL, row.department) &&
      matchesScopeValue(scope.major, ALL_MAJORS_LABEL, row.major) &&
      matchesScopeValue(scope.semester, ALL_SEMESTERS_LABEL, row.semester),
  );

export const formatVisibleScope = (scope: AdminAnalyticsFilterState): string =>
  `Department: ${scope.department} | Major: ${scope.major} | Semester: ${scope.semester}`;

export const buildAnalyticsCsv = (input: {
  rows: AdminAnalyticsRow[];
  scope: AdminAnalyticsFilterState;
  generatedAtIso: string;
  disclaimer?: string;
}): string => {
  const disclaimer = input.disclaimer ?? DEFAULT_DISCLAIMER;
  const header =
    "courseCode,courseName,department,major,semester,enrolled,capacity,utilizationPercent,scopeDepartment,scopeMajor,scopeSemester,generatedAtIso,disclaimer";
  const dataLines = input.rows.map((row) =>
    [
      toCsvCell(row.courseCode),
      toCsvCell(row.courseName),
      toCsvCell(row.department),
      toCsvCell(row.major),
      toCsvCell(row.semester),
      toCsvCell(row.enrolled),
      toCsvCell(row.capacity),
      toCsvCell(utilizationPercent(row)),
      toCsvCell(input.scope.department),
      toCsvCell(input.scope.major),
      toCsvCell(input.scope.semester),
      toCsvCell(input.generatedAtIso),
      toCsvCell(disclaimer),
    ].join(","),
  );

  return [header, ...dataLines].join("\n");
};

export const buildPdfExportPlan = (
  scope: AdminAnalyticsFilterState,
): AdminPdfExportPlan => ({
  status: "deferred",
  format: "pdf",
  fallbackFormat: "csv",
  reason: DEFAULT_PDF_DEFER_REASON,
  disclaimer: DEFAULT_DISCLAIMER,
  visibleScope: formatVisibleScope(scope),
});

export const exerciseAdminAnalysisExport = (input: {
  rows: AdminAnalyticsRow[];
  scope: AdminAnalyticsFilterState;
  generatedAtIso: string;
  disclaimer?: string;
}): AdminAnalysisExportExerciseResult => {
  const scopedRows = filterAnalyticsRows(input.rows, input.scope);
  const disclaimer = input.disclaimer ?? DEFAULT_DISCLAIMER;

  return {
    scopedRows,
    csv: buildAnalyticsCsv({
      rows: scopedRows,
      scope: input.scope,
      generatedAtIso: input.generatedAtIso,
      disclaimer,
    }),
    pdfPlan: buildPdfExportPlan(input.scope),
    visibleScope: formatVisibleScope(input.scope),
    disclaimer,
  };
};

export const adminAnalyticsDisclaimer = DEFAULT_DISCLAIMER;
