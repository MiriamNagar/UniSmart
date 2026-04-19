import { Days } from "@/types/courses";

const DAY_DISPLAY_ORDER: Days[] = [
  Days.Sun,
  Days.Mon,
  Days.Tue,
  Days.Wed,
  Days.Thu,
  Days.Fri,
];

type ConstraintSummaryInput = {
  blockedDays: Set<string>;
  startHour: string;
  endHour: string;
  preferredInstructorCount: number;
};

export type ConstraintSummary = {
  blockedDaysLabel: string;
  timeWindowLabel: string;
  preferencesLabel: string;
  hasAnyConstraints: boolean;
};

function normalizeDay(day: string): Days | null {
  const normalized = day.trim().toLowerCase();
  switch (normalized) {
    case "sun":
      return Days.Sun;
    case "mon":
      return Days.Mon;
    case "tue":
      return Days.Tue;
    case "wed":
      return Days.Wed;
    case "thu":
      return Days.Thu;
    case "fri":
      return Days.Fri;
    default:
      return null;
  }
}

function formatBlockedDays(blockedDays: Set<string>): string {
  if (blockedDays.size === 0) {
    return "None";
  }

  const normalized = new Set<Days>();
  for (const day of blockedDays) {
    const parsed = normalizeDay(day);
    if (parsed) normalized.add(parsed);
  }

  const ordered = DAY_DISPLAY_ORDER.filter((day) => normalized.has(day));
  return ordered.length > 0 ? ordered.join(", ") : "None";
}

function formatTimeWindow(startHour: string, endHour: string): string {
  const hasStart = startHour !== "Any";
  const hasEnd = endHour !== "Any";

  if (!hasStart && !hasEnd) return "Any time";
  if (hasStart && hasEnd) return `${startHour} - ${endHour}`;
  if (hasStart) return `From ${startHour}`;
  return `Until ${endHour}`;
}

function formatPreferences(count: number): string {
  if (count <= 0) return "No instructor preferences";
  if (count === 1) return "1 instructor preference";
  return `${count} instructor preferences`;
}

export function buildConstraintSummary(
  input: ConstraintSummaryInput,
): ConstraintSummary {
  const blockedDaysLabel = formatBlockedDays(input.blockedDays);
  const timeWindowLabel = formatTimeWindow(input.startHour, input.endHour);
  const preferencesLabel = formatPreferences(input.preferredInstructorCount);

  return {
    blockedDaysLabel,
    timeWindowLabel,
    preferencesLabel,
    hasAnyConstraints:
      input.blockedDays.size > 0 ||
      input.startHour !== "Any" ||
      input.endHour !== "Any" ||
      input.preferredInstructorCount > 0,
  };
}
