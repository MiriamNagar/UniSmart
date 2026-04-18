const ISO_BIRTH_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type BirthDatePolicyReason = 'invalid-format' | 'future-date' | 'under-13';

export type BirthDatePolicyEvaluation = {
  accepted: boolean;
  reason: BirthDatePolicyReason | null;
  normalizedBirthDate: string | null;
  ageYears: number | null;
};

export function isIsoBirthDateFormat(value: string): boolean {
  return ISO_BIRTH_DATE_PATTERN.test(value.trim());
}

function parseBirthDate(value: string): { normalized: string; dateUtc: Date } | null {
  const normalized = value.trim();
  if (!isIsoBirthDateFormat(normalized)) {
    return null;
  }

  const [yearText, monthText, dayText] = normalized.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { normalized, dateUtc: candidate };
}

function ageInYearsAt(birthDateUtc: Date, asOfUtc: Date): number {
  let age = asOfUtc.getUTCFullYear() - birthDateUtc.getUTCFullYear();
  const monthDelta = asOfUtc.getUTCMonth() - birthDateUtc.getUTCMonth();
  const hasBirthdayPassed =
    monthDelta > 0 || (monthDelta === 0 && asOfUtc.getUTCDate() >= birthDateUtc.getUTCDate());
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age;
}

export function evaluateBirthDateForStudentPolicy(
  value: string,
  asOf = new Date(),
): BirthDatePolicyEvaluation {
  const parsed = parseBirthDate(value);
  if (!parsed) {
    return {
      accepted: false,
      reason: 'invalid-format',
      normalizedBirthDate: null,
      ageYears: null,
    };
  }

  const asOfUtc = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate()));
  if (parsed.dateUtc.getTime() > asOfUtc.getTime()) {
    return {
      accepted: false,
      reason: 'future-date',
      normalizedBirthDate: parsed.normalized,
      ageYears: null,
    };
  }

  const ageYears = ageInYearsAt(parsed.dateUtc, asOfUtc);
  if (ageYears < 13) {
    return {
      accepted: false,
      reason: 'under-13',
      normalizedBirthDate: parsed.normalized,
      ageYears,
    };
  }

  return {
    accepted: true,
    reason: null,
    normalizedBirthDate: parsed.normalized,
    ageYears,
  };
}
