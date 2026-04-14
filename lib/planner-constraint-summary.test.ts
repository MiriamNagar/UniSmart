import { Days } from "@/types/courses";
import { buildConstraintSummary } from "./planner-constraint-summary";

describe("buildConstraintSummary", () => {
  it("formats blocked days in stable weekday order", () => {
    const summary = buildConstraintSummary({
      blockedDays: new Set([Days.Thu, Days.Mon, Days.Wed]),
      startHour: "Any",
      endHour: "Any",
      preferredInstructorCount: 0,
    });

    expect(summary.blockedDaysLabel).toBe("Mon, Wed, Thu");
  });

  it("uses readable fallback labels when nothing is configured", () => {
    const summary = buildConstraintSummary({
      blockedDays: new Set(),
      startHour: "Any",
      endHour: "Any",
      preferredInstructorCount: 0,
    });

    expect(summary.blockedDaysLabel).toBe("None");
    expect(summary.timeWindowLabel).toBe("Any time");
    expect(summary.preferencesLabel).toBe("No instructor preferences");
    expect(summary.hasAnyConstraints).toBe(false);
  });

  it("formats time windows and instructor preference count", () => {
    const summary = buildConstraintSummary({
      blockedDays: new Set(),
      startHour: "9:00 AM",
      endHour: "3:00 PM",
      preferredInstructorCount: 2,
    });

    expect(summary.timeWindowLabel).toBe("9:00 AM - 3:00 PM");
    expect(summary.preferencesLabel).toBe("2 instructor preferences");
    expect(summary.hasAnyConstraints).toBe(true);
  });

  it("supports one-sided windows", () => {
    expect(
      buildConstraintSummary({
        blockedDays: new Set(),
        startHour: "8:00 AM",
        endHour: "Any",
        preferredInstructorCount: 0,
      }).timeWindowLabel,
    ).toBe("From 8:00 AM");

    expect(
      buildConstraintSummary({
        blockedDays: new Set(),
        startHour: "Any",
        endHour: "4:00 PM",
        preferredInstructorCount: 0,
      }).timeWindowLabel,
    ).toBe("Until 4:00 PM");
  });
});
