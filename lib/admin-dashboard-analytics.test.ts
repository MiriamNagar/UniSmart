import {
  OFFERINGS_QUERY_LIMIT,
  computeEnrollmentSummary,
  loadAdminDashboardAnalytics,
  type PlannerUsageRollup,
} from "@/lib/admin-dashboard-analytics";

describe("computeEnrollmentSummary", () => {
  it("aggregates totals and utilization from bounded offering rows", () => {
    const summary = computeEnrollmentSummary([
      { courseId: "CS101", capacity: 30, occupancy: 30 },
      { courseId: "CS101", capacity: 30, occupancy: 18 },
      { courseId: "CS102", capacity: 25, occupancy: 21 },
      { courseId: "CS201", capacity: undefined, occupancy: 5 },
    ]);

    expect(summary.totalCapacity).toBe(85);
    expect(summary.totalOccupancy).toBe(69);
    expect(summary.totalSections).toBe(3);
    expect(summary.fullSections).toBe(1);
    expect(summary.utilizationPercent).toBe(81);
    expect(summary.highDemandSections).toBe(2);
    expect(summary.topDemandCourses.slice(0, 2)).toEqual([
      { courseId: "CS101", occupancyPercent: 100 },
      { courseId: "CS102", occupancyPercent: 84 },
    ]);
  });
});

describe("loadAdminDashboardAnalytics", () => {
  it("uses bounded offering queries and returns rollup metrics when available", async () => {
    const listOfferings = jest.fn().mockResolvedValue([
      { courseId: "CS101", capacity: 20, occupancy: 20 },
      { courseId: "CS102", capacity: 20, occupancy: 15 },
    ]);
    const readPlannerUsageRollup = jest.fn<Promise<PlannerUsageRollup | null>, []>().mockResolvedValue({
      plannerRuns30d: 124,
      savedPlans30d: 66,
      activePlanners7d: 47,
      generatedAtMs: 1713355200000,
    });

    const result = await loadAdminDashboardAnalytics({
      listOfferings,
      readPlannerUsageRollup,
    });

    expect(listOfferings).toHaveBeenCalledWith(OFFERINGS_QUERY_LIMIT);
    expect(readPlannerUsageRollup).toHaveBeenCalledTimes(1);
    expect(result.enrollment.totalOccupancy).toBe(35);
    expect(result.enrollment.utilizationPercent).toBe(88);
    expect(result.plannerUsage).toEqual({
      plannerRuns30d: 124,
      savedPlans30d: 66,
      activePlanners7d: 47,
      generatedAtMs: 1713355200000,
    });
  });

  it("falls back to null planner usage when rollup is absent", async () => {
    const result = await loadAdminDashboardAnalytics({
      listOfferings: async () => [{ courseId: "CS101", capacity: 20, occupancy: 10 }],
      readPlannerUsageRollup: async () => null,
    });

    expect(result.enrollment.utilizationPercent).toBe(50);
    expect(result.plannerUsage).toBeNull();
  });
});
