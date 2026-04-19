import {
  buildAnalyticsCsv,
  buildPdfExportPlan,
  exerciseAdminAnalysisExport,
  filterAnalyticsRows,
  formatVisibleScope,
} from "@/lib/admin-analysis-export";
import {
  ALL_DEPARTMENTS_LABEL,
  ALL_MAJORS_LABEL,
  ALL_SEMESTERS_LABEL,
  type AdminAnalyticsRow,
} from "@/lib/admin-analysis-filtering";

const baseRows: AdminAnalyticsRow[] = [
  {
    studentId: "eng-1",
    courseCode: "ENG205",
    courseName: "Software Arch & Design",
    department: "Engineering",
    major: "Software Engineering",
    semester: "Semester A",
    enrolled: 92,
    capacity: 100,
    preferredTimeBlock: "10:00",
  },
  {
    studentId: "sci-1",
    courseCode: "BIO110",
    courseName: "Intro, Biology \"Lab\"",
    department: "Science",
    major: "Biology",
    semester: "Semester B",
    enrolled: 38,
    capacity: 40,
    preferredTimeBlock: "12:00",
  },
];

describe("filterAnalyticsRows", () => {
  it("keeps only records that match selected scope values", () => {
    const filtered = filterAnalyticsRows(baseRows, {
      department: "Engineering",
      major: ALL_MAJORS_LABEL,
      semester: "Semester A",
    });

    expect(filtered).toEqual([baseRows[0]]);
  });
});

describe("formatVisibleScope", () => {
  it("returns stable scope labels for the admin UI", () => {
    expect(
      formatVisibleScope({
        department: "Engineering",
        major: ALL_MAJORS_LABEL,
        semester: "Semester A",
      }),
    ).toBe(
      "Department: Engineering | Major: All Majors | Semester: Semester A",
    );
  });
});

describe("buildAnalyticsCsv", () => {
  it("creates a valid csv with structural header + escaped values", () => {
    const csv = buildAnalyticsCsv({
      rows: baseRows,
      scope: {
        department: ALL_DEPARTMENTS_LABEL,
        major: ALL_MAJORS_LABEL,
        semester: ALL_SEMESTERS_LABEL,
      },
      generatedAtIso: "2026-04-17T15:00:00.000Z",
    });

    const lines = csv.split("\n");
    expect(lines[0]).toBe(
      "courseCode,courseName,department,major,semester,enrolled,capacity,utilizationPercent,scopeDepartment,scopeMajor,scopeSemester,generatedAtIso,disclaimer",
    );
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain("\"Intro, Biology \"\"Lab\"\"\"");
    expect(lines[1]).toContain("92.00");
    expect(lines[1]).toContain("System analytics only; not official registrar data.");
  });
});

describe("buildPdfExportPlan", () => {
  it("documents deferred PDF export with CSV fallback and scoped disclaimer", () => {
    const plan = buildPdfExportPlan({
      department: "Engineering",
      major: ALL_MAJORS_LABEL,
      semester: "Semester A",
    });

    expect(plan).toEqual({
      status: "deferred",
      format: "pdf",
      fallbackFormat: "csv",
      reason: "PDF export is deferred in this milestone to keep implementation lightweight.",
      disclaimer: "System analytics only; not official registrar data.",
      visibleScope:
        "Department: Engineering | Major: All Majors | Semester: Semester A",
    });
  });
});

describe("exerciseAdminAnalysisExport", () => {
  it("keeps CSV and PDF evidence aligned to the same visible scope", () => {
    const evidence = exerciseAdminAnalysisExport({
      rows: baseRows,
      scope: {
        department: "Engineering",
        major: ALL_MAJORS_LABEL,
        semester: "Semester A",
      },
      generatedAtIso: "2026-04-17T16:00:00.000Z",
    });

    expect(evidence.scopedRows).toEqual([baseRows[0]]);
    expect(evidence.visibleScope).toBe(
      "Department: Engineering | Major: All Majors | Semester: Semester A",
    );
    expect(evidence.pdfPlan.visibleScope).toBe(evidence.visibleScope);
    expect(evidence.csv).toContain("\"Engineering\"");
    expect(evidence.csv).toContain("System analytics only; not official registrar data.");
    expect(evidence.csv.split("\n")).toHaveLength(2);
  });
});
