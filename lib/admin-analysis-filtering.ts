export const ALL_DEPARTMENTS_LABEL = "All Departments";
export const ALL_MAJORS_LABEL = "All Majors";
export const ALL_SEMESTERS_LABEL = "All Semesters";
const HIGH_DEMAND_PERCENT_THRESHOLD = 80;

export type AdminAnalyticsRow = {
  studentId: string;
  department: string;
  major: string;
  semester: string;
  courseCode: string;
  courseName: string;
  enrolled: number;
  capacity: number;
  preferredTimeBlock: string;
};

export type AdminAnalyticsFilterState = {
  department: string;
  major: string;
  semester: string;
};

export const DEFAULT_ANALYTICS_FILTERS: AdminAnalyticsFilterState = {
  department: ALL_DEPARTMENTS_LABEL,
  major: ALL_MAJORS_LABEL,
  semester: ALL_SEMESTERS_LABEL,
};

export type AdminAnalyticsFilterOptions = {
  departments: string[];
  majors: string[];
  semesters: string[];
};

export type AdminDashboardAnalytics = {
  metrics: {
    totalEnrollment: number;
    peakUtilizationTime: string;
  };
  courseTrends: {
    code: string;
    name: string;
    enrolled: number;
    capacity: number;
    percentage: number;
  }[];
  highDemandCourses: {
    name: string;
    percentage: number;
  }[];
};

const toSortedUnique = (values: string[]): string[] =>
  Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));

const matchesValue = (selected: string, allLabel: string, rowValue: string): boolean =>
  selected === allLabel || selected === rowValue;

const utilizationPercent = (enrolled: number, capacity: number): number => {
  if (capacity <= 0) {
    return 0;
  }
  return Math.round((enrolled / capacity) * 100);
};

export const buildFilterOptions = (
  rows: AdminAnalyticsRow[],
): AdminAnalyticsFilterOptions => ({
  departments: [ALL_DEPARTMENTS_LABEL, ...toSortedUnique(rows.map((row) => row.department))],
  majors: [ALL_MAJORS_LABEL, ...toSortedUnique(rows.map((row) => row.major))],
  semesters: [ALL_SEMESTERS_LABEL, ...toSortedUnique(rows.map((row) => row.semester))],
});

export const filterAnalyticsRows = (
  rows: AdminAnalyticsRow[],
  filters: AdminAnalyticsFilterState,
): AdminAnalyticsRow[] =>
  rows.filter(
    (row) =>
      matchesValue(filters.department, ALL_DEPARTMENTS_LABEL, row.department) &&
      matchesValue(filters.major, ALL_MAJORS_LABEL, row.major) &&
      matchesValue(filters.semester, ALL_SEMESTERS_LABEL, row.semester),
  );

export const buildDashboardAnalytics = (
  rows: AdminAnalyticsRow[],
  filters: AdminAnalyticsFilterState,
): AdminDashboardAnalytics => {
  const scopedRows = filterAnalyticsRows(rows, filters);
  if (scopedRows.length === 0) {
    return {
      metrics: {
        totalEnrollment: 0,
        peakUtilizationTime: "N/A",
      },
      courseTrends: [],
      highDemandCourses: [],
    };
  }

  const totalEnrollment = scopedRows.reduce((sum, row) => sum + row.enrolled, 0);
  const timeBlockCounts = new Map<string, number>();
  for (const row of scopedRows) {
    timeBlockCounts.set(row.preferredTimeBlock, (timeBlockCounts.get(row.preferredTimeBlock) ?? 0) + 1);
  }
  const peakUtilizationTime =
    Array.from(timeBlockCounts.entries()).sort(
      ([leftBlock, leftCount], [rightBlock, rightCount]) =>
        rightCount - leftCount || leftBlock.localeCompare(rightBlock),
    )[0]?.[0] ?? "N/A";

  const courseTrends = scopedRows
    .map((row) => ({
      code: row.courseCode,
      name: row.courseName,
      enrolled: row.enrolled,
      capacity: row.capacity,
      percentage: utilizationPercent(row.enrolled, row.capacity),
    }))
    .sort((left, right) => right.percentage - left.percentage || right.enrolled - left.enrolled);

  const highDemandCourses = courseTrends
    .filter((row) => row.percentage >= HIGH_DEMAND_PERCENT_THRESHOLD)
    .map((row) => ({
      name: row.name,
      percentage: row.percentage,
    }));

  return {
    metrics: {
      totalEnrollment,
      peakUtilizationTime,
    },
    courseTrends,
    highDemandCourses,
  };
};
