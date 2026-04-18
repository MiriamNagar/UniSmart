import {
  evaluateBirthDateForStudentPolicy,
  isIsoBirthDateFormat,
} from './birth-date-policy';

describe('birth-date-policy', () => {
  describe('isIsoBirthDateFormat', () => {
    it('accepts YYYY-MM-DD values only', () => {
      expect(isIsoBirthDateFormat('2010-05-23')).toBe(true);
      expect(isIsoBirthDateFormat('2010/05/23')).toBe(false);
      expect(isIsoBirthDateFormat('23-05-2010')).toBe(false);
      expect(isIsoBirthDateFormat('')).toBe(false);
    });
  });

  describe('evaluateBirthDateForStudentPolicy', () => {
    const asOf = new Date('2026-04-17T00:00:00.000Z');

    it('allows students aged 13 and above', () => {
      expect(evaluateBirthDateForStudentPolicy('2012-04-17', asOf)).toEqual({
        accepted: true,
        reason: null,
        normalizedBirthDate: '2012-04-17',
        ageYears: 14,
      });
    });

    it('blocks under-13 students', () => {
      expect(evaluateBirthDateForStudentPolicy('2014-05-01', asOf)).toEqual({
        accepted: false,
        reason: 'under-13',
        normalizedBirthDate: '2014-05-01',
        ageYears: 11,
      });
    });

    it('rejects malformed dates and future dates', () => {
      expect(evaluateBirthDateForStudentPolicy('2014-02-31', asOf)).toEqual({
        accepted: false,
        reason: 'invalid-format',
        normalizedBirthDate: null,
        ageYears: null,
      });
      expect(evaluateBirthDateForStudentPolicy('2027-01-01', asOf)).toEqual({
        accepted: false,
        reason: 'future-date',
        normalizedBirthDate: '2027-01-01',
        ageYears: null,
      });
    });
  });
});
