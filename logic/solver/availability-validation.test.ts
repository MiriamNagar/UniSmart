import { validatePlannerAvailabilityPreferences } from './availability-validation';

describe('validatePlannerAvailabilityPreferences', () => {
  it('accepts Any on either side', () => {
    expect(validatePlannerAvailabilityPreferences({ startHour: 'Any', endHour: 'Any' }).ok).toBe(true);
    expect(validatePlannerAvailabilityPreferences({ startHour: '9:00 AM', endHour: 'Any' }).ok).toBe(true);
    expect(validatePlannerAvailabilityPreferences({ startHour: 'Any', endHour: '5:00 PM' }).ok).toBe(true);
  });

  it('rejects when earliest is not strictly before latest', () => {
    const r = validatePlannerAvailabilityPreferences({
      startHour: '2:00 PM',
      endHour: '2:00 PM',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.message).toMatch(/earlier than latest end/i);
    }
  });

  it('rejects when window is inverted', () => {
    const r = validatePlannerAvailabilityPreferences({
      startHour: '6:00 PM',
      endHour: '9:00 AM',
    });
    expect(r.ok).toBe(false);
  });

  it('rejects non-Any values that do not parse as a time', () => {
    const badStart = validatePlannerAvailabilityPreferences({
      startHour: 'not-a-time',
      endHour: '5:00 PM',
    });
    expect(badStart.ok).toBe(false);
    if (!badStart.ok) {
      expect(badStart.message).toMatch(/earliest start/i);
    }

    const badEnd = validatePlannerAvailabilityPreferences({
      startHour: '9:00 AM',
      endHour: 'nope',
    });
    expect(badEnd.ok).toBe(false);
    if (!badEnd.ok) {
      expect(badEnd.message).toMatch(/latest end/i);
    }
  });
});
