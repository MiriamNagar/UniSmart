import { parsePreferenceTimeToMinutes } from './utils';

export type PlannerAvailabilityValidation =
  | { ok: true }
  | { ok: false; message: string };

function preferenceTimeUnset(raw: string): boolean {
  const t = raw?.trim();
  return !t || t === 'Any';
}

/**
 * Validates earliest/latest class time before running the optimizer.
 * Both bounds set with start >= end is illogical and cannot be satisfied.
 */
export function validatePlannerAvailabilityPreferences(params: {
  startHour: string;
  endHour: string;
}): PlannerAvailabilityValidation {
  const start = parsePreferenceTimeToMinutes(params.startHour);
  const end = parsePreferenceTimeToMinutes(params.endHour);
  if (!preferenceTimeUnset(params.startHour) && start < 0) {
    return {
      ok: false,
      message:
        'Could not read earliest start. Pick a time from the list or set it to Any.',
    };
  }
  if (!preferenceTimeUnset(params.endHour) && end < 0) {
    return {
      ok: false,
      message:
        'Could not read latest end. Pick a time from the list or set it to Any.',
    };
  }
  if (start >= 0 && end >= 0 && start >= end) {
    return {
      ok: false,
      message:
        'Earliest start must be earlier than latest end when both are set. Adjust your time window or set one side to Any.',
    };
  }
  return { ok: true };
}
