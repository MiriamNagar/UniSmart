import {
  buildDashboardAnalytics,
  buildFilterOptions,
  filterAnalyticsRows,
  type AdminAnalyticsFilterState,
  type AdminAnalyticsRow,
} from "@/lib/admin-analysis-filtering";

const sampleRows: AdminAnalyticsRow[] = [
  {
    studentId: "s1",
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
    studentId: "s2",
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
    studentId: "s3",
    department: "Business",
    major: "Finance",
    semester: "Semester B",
    courseCode: "FIN201",
    courseName: "Corporate Finance I",
    enrolled: 45,
    capacity: 60,
    preferredTimeBlock: "13:00",
  },
];

const allFilters: AdminAnalyticsFilterState = {
  department: "All Departments",
  major: "All Majors",
  semester: "All Semesters",
};

describe("buildFilterOptions", () => {
  it("returns sorted unique facet options with all defaults", () => {
    const options = buildFilterOptions(sampleRows);
    expect(options).toEqual({
      departments: ["All Departments", "Business", "Engineering"],
      majors: ["All Majors", "Computer Science", "Finance", "Software Engineering"],
      semesters: ["All Semesters", "Semester A", "Semester B"],
    });
  });
});

describe("filterAnalyticsRows", () => {
  it("filters rows by selected facets", () => {
    expect(
      filterAnalyticsRows(sampleRows, {
        department: "Engineering",
        major: "Computer Science",
        semester: "Semester A",
      }),
    ).toEqual([sampleRows[1]]);
  });

  it("returns all rows when filters are set to all", () => {
    expect(filterAnalyticsRows(sampleRows, allFilters)).toEqual(sampleRows);
  });
});

describe("buildDashboardAnalytics", () => {
  it("builds scoped metric, trend, and demand cards", () => {
    const analytics = buildDashboardAnalytics(sampleRows, {
      department: "Engineering",
      major: "All Majors",
      semester: "Semester A",
    });
    expect(analytics.metrics.totalEnrollment).toBe(172);
    expect(analytics.metrics.peakUtilizationTime).toBe("10:00");
    expect(analytics.courseTrends).toEqual([
      {
        code: "ENG205",
        name: "Software Arch & Design",
        enrolled: 92,
        capacity: 100,
        percentage: 92,
      },
      {
        code: "CS102",
        name: "Data Structures",
        enrolled: 80,
        capacity: 100,
        percentage: 80,
      },
    ]);
    expect(analytics.highDemandCourses).toEqual([
      { name: "Software Arch & Design", percentage: 92 },
      { name: "Data Structures", percentage: 80 },
    ]);
  });

  it("returns empty-state analytics for unmatched scopes", () => {
    const analytics = buildDashboardAnalytics(sampleRows, {
      department: "Business",
      major: "Software Engineering",
      semester: "Semester A",
    });
    expect(analytics.metrics.totalEnrollment).toBe(0);
    expect(analytics.metrics.peakUtilizationTime).toBe("N/A");
    expect(analytics.courseTrends).toEqual([]);
    expect(analytics.highDemandCourses).toEqual([]);
  });
});
