import {
  deleteSavedPlanForCurrentUser,
  listSavedPlansForCurrentUser,
  mapSavedPlanDeleteErrorToMessage,
  mapSavedPlanWriteErrorToMessage,
  mapSavedPlanReadErrorToMessage,
  savedScheduleDocPath,
  savedSchedulesCollectionPath,
  saveGeneratedPlanForCurrentUser,
  shouldAllowSavedScheduleOwnerWrite,
} from '@/lib/saved-schedule-firestore';

function formatSavedPlanTimestampForTest(date: Date): string {
  const datePart = date.toLocaleDateString('en-GB');
  const timePart = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart} ${timePart}`;
}

describe('savedSchedulesCollectionPath', () => {
  it('builds owner-scoped collection path under users/{uid}', () => {
    expect(savedSchedulesCollectionPath('student-1')).toBe('users/student-1/savedSchedules');
  });

  it('throws when uid is blank', () => {
    expect(() => savedSchedulesCollectionPath('  ')).toThrow('User id is required.');
  });

  it('throws when uid has surrounding whitespace', () => {
    expect(() => savedSchedulesCollectionPath(' student-1 ')).toThrow(
      'User id must not contain leading or trailing spaces.',
    );
  });
});

describe('savedScheduleDocPath', () => {
  it('builds owner-scoped document path', () => {
    expect(savedScheduleDocPath('student-1', 'plan-7')).toBe('users/student-1/savedSchedules/plan-7');
  });

  it('throws when schedule id is blank', () => {
    expect(() => savedScheduleDocPath('student-1', '')).toThrow('Schedule id is required.');
  });

  it('throws when schedule id has surrounding whitespace', () => {
    expect(() => savedScheduleDocPath('student-1', ' plan-7 ')).toThrow(
      'Schedule id must not contain leading or trailing spaces.',
    );
  });
});

describe('shouldAllowSavedScheduleOwnerWrite', () => {
  it('returns true when auth uid, path uid, and owner uid match', () => {
    expect(
      shouldAllowSavedScheduleOwnerWrite({
        authUid: 'student-1',
        pathUid: 'student-1',
        ownerUid: 'student-1',
      }),
    ).toBe(true);
  });

  it('returns false when owner uid does not match auth uid', () => {
    expect(
      shouldAllowSavedScheduleOwnerWrite({
        authUid: 'student-1',
        pathUid: 'student-1',
        ownerUid: 'student-2',
      }),
    ).toBe(false);
  });

  it('returns false when path uid does not match auth uid', () => {
    expect(
      shouldAllowSavedScheduleOwnerWrite({
        authUid: 'student-1',
        pathUid: 'student-2',
        ownerUid: 'student-1',
      }),
    ).toBe(false);
  });

  it('returns false when any identifier is blank', () => {
    expect(
      shouldAllowSavedScheduleOwnerWrite({
        authUid: '',
        pathUid: '',
        ownerUid: '',
      }),
    ).toBe(false);
  });

  it('returns false when any identifier has surrounding whitespace', () => {
    expect(
      shouldAllowSavedScheduleOwnerWrite({
        authUid: 'student-1',
        pathUid: 'student-1 ',
        ownerUid: 'student-1',
      }),
    ).toBe(false);
  });
});

describe('saveGeneratedPlanForCurrentUser', () => {
  it('returns the saved plan record after a successful write', async () => {
    const writeScheduleDoc = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);
    const now = new Date('2026-04-14T10:15:00.000Z');
    const schedule = {
      SUN: [],
      MON: [{ courseCode: 'CS101' }],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
    };

    const saved = await saveGeneratedPlanForCurrentUser(
      { fitScore: 88, schedule },
      {
        getCurrentUserUid: () => 'student-1',
        now: () => now,
        writeScheduleDoc: async (input) => writeScheduleDoc(input),
      },
    );

    const writeInput = writeScheduleDoc.mock.calls[0]?.[0] as {
      uid: string;
      planId: string;
      fitScore: number;
      schedule: unknown;
      dateLabel: string;
    };
    expect(writeInput.planId).toMatch(new RegExp(`^plan-${now.getTime()}-\\d+$`));
    expect(writeScheduleDoc).toHaveBeenCalledWith({
      uid: 'student-1',
      planId: writeInput.planId,
      fitScore: 88,
      schedule,
      dateLabel: formatSavedPlanTimestampForTest(now),
    });
    expect(saved).toEqual({
      id: writeInput.planId,
      date: formatSavedPlanTimestampForTest(now),
      fitScore: 88,
      schedule,
    });
  });

  it('throws when no signed-in user uid exists', async () => {
    await expect(
      saveGeneratedPlanForCurrentUser(
        {
          fitScore: 40,
          schedule: { SUN: [], MON: [], TUE: [], WED: [], THU: [], FRI: [] },
        },
        {
          getCurrentUserUid: () => undefined,
          now: () => new Date('2026-04-14T10:15:00.000Z'),
          writeScheduleDoc: async () => Promise.resolve(),
        },
      ),
    ).rejects.toThrow('You must be signed in to save plans.');
  });

  it('propagates write failures', async () => {
    await expect(
      saveGeneratedPlanForCurrentUser(
        {
          fitScore: 40,
          schedule: { SUN: [], MON: [], TUE: [], WED: [], THU: [], FRI: [] },
        },
        {
          getCurrentUserUid: () => 'student-1',
          now: () => new Date('2026-04-14T10:15:00.000Z'),
          writeScheduleDoc: async () => {
            throw new Error('write failed');
          },
        },
      ),
    ).rejects.toThrow('write failed');
  });

  it('strips undefined fields before returning saved record', async () => {
    const scheduleWithUndefined = {
      SUN: [
        undefined,
        {
          courseCode: 'CS101',
          shortDescription: undefined,
          nested: {
            ok: true,
            optional: undefined,
            items: ['x', undefined, 'y'],
          },
        },
      ],
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
    };

    const saved = await saveGeneratedPlanForCurrentUser(
      { fitScore: 91, schedule: scheduleWithUndefined },
      {
        getCurrentUserUid: () => 'student-1',
        now: () => new Date('2026-04-14T10:15:00.000Z'),
        writeScheduleDoc: async () => Promise.resolve(),
      },
    );

    expect(saved.schedule).toEqual({
      SUN: [
        {
          courseCode: 'CS101',
          nested: {
            ok: true,
            items: ['x', 'y'],
          },
        },
      ],
      MON: [],
      TUE: [],
      WED: [],
      THU: [],
      FRI: [],
    });
  });

  it('generates distinct plan ids for rapid consecutive saves', async () => {
    const now = new Date('2026-04-14T10:15:00.000Z');
    const writeScheduleDoc = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);
    const params = {
      fitScore: 55,
      schedule: { SUN: [], MON: [], TUE: [], WED: [], THU: [], FRI: [] },
    };

    const first = await saveGeneratedPlanForCurrentUser(params, {
      getCurrentUserUid: () => 'student-1',
      now: () => now,
      writeScheduleDoc: async (input) => writeScheduleDoc(input),
    });
    const second = await saveGeneratedPlanForCurrentUser(params, {
      getCurrentUserUid: () => 'student-1',
      now: () => now,
      writeScheduleDoc: async (input) => writeScheduleDoc(input),
    });

    expect(first.id).not.toBe(second.id);
    expect(first.id).toMatch(new RegExp(`^plan-${now.getTime()}-\\d+$`));
    expect(second.id).toMatch(new RegExp(`^plan-${now.getTime()}-\\d+$`));
    const firstWriteInput = writeScheduleDoc.mock.calls[0]?.[0] as { planId: string };
    const secondWriteInput = writeScheduleDoc.mock.calls[1]?.[0] as { planId: string };
    expect(firstWriteInput.planId).toBe(first.id);
    expect(secondWriteInput.planId).toBe(second.id);
  });
});

describe('mapSavedPlanWriteErrorToMessage', () => {
  it('maps permission-denied errors', () => {
    expect(mapSavedPlanWriteErrorToMessage({ code: 'permission-denied' })).toContain(
      'permission',
    );
  });

  it('maps unauthenticated save attempts', () => {
    expect(
      mapSavedPlanWriteErrorToMessage(new Error('You must be signed in to save plans.')),
    ).toContain('sign in');
  });

  it('returns fallback copy for unknown failures', () => {
    expect(mapSavedPlanWriteErrorToMessage(new Error('boom'))).toContain('could not save');
  });
});

describe('deleteSavedPlanForCurrentUser', () => {
  it('deletes the selected plan for the signed-in user via deps', async () => {
    const deleteScheduleDoc = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);

    await deleteSavedPlanForCurrentUser('plan-7', {
      getCurrentUserUid: () => 'student-1',
      deleteScheduleDoc: async (input) => deleteScheduleDoc(input),
    });

    expect(deleteScheduleDoc).toHaveBeenCalledWith({
      uid: 'student-1',
      planId: 'plan-7',
    });
  });

  it('trims the incoming plan id before deleting', async () => {
    const deleteScheduleDoc = jest.fn<Promise<void>, [unknown]>().mockResolvedValue(undefined);

    await deleteSavedPlanForCurrentUser('  plan-9  ', {
      getCurrentUserUid: () => 'student-1',
      deleteScheduleDoc: async (input) => deleteScheduleDoc(input),
    });

    expect(deleteScheduleDoc).toHaveBeenCalledWith({
      uid: 'student-1',
      planId: 'plan-9',
    });
  });

  it('throws when plan id is blank', async () => {
    await expect(
      deleteSavedPlanForCurrentUser('   ', {
        getCurrentUserUid: () => 'student-1',
        deleteScheduleDoc: async () => Promise.resolve(),
      }),
    ).rejects.toThrow('Saved plan id is required.');
  });

  it('throws when no signed-in user uid exists', async () => {
    await expect(
      deleteSavedPlanForCurrentUser('plan-7', {
        getCurrentUserUid: () => undefined,
        deleteScheduleDoc: async () => Promise.resolve(),
      }),
    ).rejects.toThrow('You must be signed in to delete saved plans.');
  });

  it('propagates delete failures', async () => {
    await expect(
      deleteSavedPlanForCurrentUser('plan-7', {
        getCurrentUserUid: () => 'student-1',
        deleteScheduleDoc: async () => {
          throw new Error('delete failed');
        },
      }),
    ).rejects.toThrow('delete failed');
  });
});

describe('listSavedPlansForCurrentUser', () => {
  it('maps saved schedule docs to records with metadata date', async () => {
    const plans = await listSavedPlansForCurrentUser({
      getCurrentUserUid: () => 'student-1',
      readScheduleDocs: async () => [
        {
          id: 'plan-a',
          fitScore: 77,
          schedule: {
            SUN: [{ courseCode: 'CS101', note: undefined }],
            MON: [],
            TUE: [],
            WED: [],
            THU: [],
            FRI: [],
          },
          createdAt: { toMillis: () => 1_713_091_200_000 },
        },
      ],
    });

    expect(plans).toEqual([
      {
        id: 'plan-a',
        fitScore: 77,
        date: formatSavedPlanTimestampForTest(new Date(1_713_091_200_000)),
        schedule: {
          SUN: [{ courseCode: 'CS101' }],
          MON: [],
          TUE: [],
          WED: [],
          THU: [],
          FRI: [],
        },
      },
    ]);
  });

  it('sorts dependency-injected docs by createdAt descending to match runtime behavior', async () => {
    const plans = await listSavedPlansForCurrentUser({
      getCurrentUserUid: () => 'student-1',
      readScheduleDocs: async () => [
        {
          id: 'older',
          fitScore: 11,
          schedule: { SUN: [], MON: [], TUE: [], WED: [], THU: [], FRI: [] },
          createdAt: { toMillis: () => 1_700_000_000_000 },
        },
        {
          id: 'newer',
          fitScore: 22,
          schedule: { SUN: [], MON: [], TUE: [], WED: [], THU: [], FRI: [] },
          createdAt: { toMillis: () => 1_800_000_000_000 },
        },
      ],
    });

    expect(plans.map((plan) => plan.id)).toEqual(['newer', 'older']);
  });

  it('falls back to Unknown date when createdAt is unavailable', async () => {
    const plans = await listSavedPlansForCurrentUser({
      getCurrentUserUid: () => 'student-1',
      readScheduleDocs: async () => [
        {
          id: 'plan-a',
          fitScore: 77,
          schedule: { SUN: [], MON: [], TUE: [], WED: [], THU: [], FRI: [] },
        },
      ],
    });

    expect(plans[0]?.date).toBe('Unknown date');
  });

  it('throws when no signed-in user uid exists', async () => {
    await expect(
      listSavedPlansForCurrentUser({
        getCurrentUserUid: () => undefined,
        readScheduleDocs: async () => [],
      }),
    ).rejects.toThrow('You must be signed in to browse saved plans.');
  });
});

describe('mapSavedPlanReadErrorToMessage', () => {
  it('maps permission-denied browse attempts', () => {
    expect(mapSavedPlanReadErrorToMessage({ code: 'permission-denied' })).toContain(
      'permission',
    );
  });

  it('maps unauthenticated browse attempts', () => {
    expect(
      mapSavedPlanReadErrorToMessage(new Error('You must be signed in to browse saved plans.')),
    ).toContain('sign in');
  });

  it('maps missing Firebase configuration', () => {
    expect(mapSavedPlanReadErrorToMessage(new Error('Firestore is not configured.'))).toContain(
      'Firebase is not configured',
    );
  });

  it('returns fallback copy for unknown failures', () => {
    expect(mapSavedPlanReadErrorToMessage(new Error('boom'))).toContain('could not load');
  });
});

describe('mapSavedPlanDeleteErrorToMessage', () => {
  it('maps permission-denied delete attempts', () => {
    expect(mapSavedPlanDeleteErrorToMessage({ code: 'permission-denied' })).toContain(
      'permission',
    );
  });

  it('maps unauthenticated delete attempts', () => {
    expect(
      mapSavedPlanDeleteErrorToMessage(
        new Error('You must be signed in to delete saved plans.'),
      ),
    ).toContain('sign in');
  });

  it('maps missing Firebase configuration', () => {
    expect(mapSavedPlanDeleteErrorToMessage(new Error('Firestore is not configured.'))).toContain(
      'Firebase is not configured',
    );
  });

  it('returns fallback copy for unknown failures', () => {
    expect(mapSavedPlanDeleteErrorToMessage(new Error('boom'))).toContain('could not delete');
  });
});
