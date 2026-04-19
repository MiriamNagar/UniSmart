import { mapFirestoreDataToUserProfile } from './map-firestore-user-profile';

describe('mapFirestoreDataToUserProfile', () => {
  it('returns null when data is nullish or not an object', () => {
    expect(mapFirestoreDataToUserProfile(null as unknown as Record<string, unknown>)).toBeNull();
  });

  it('returns null when role is missing or invalid', () => {
    expect(mapFirestoreDataToUserProfile({})).toBeNull();
    expect(mapFirestoreDataToUserProfile({ role: 'guest' })).toBeNull();
  });

  it('maps role and passport strings', () => {
    const doc = mapFirestoreDataToUserProfile({
      role: 'student',
      fullName: '  Alex  ',
      birthDate: '2006-04-17',
      faculty: 'ENGINEERING',
      major: 'Computer Science',
      academicLevel: 'JUNIOR',
    });
    expect(doc).toEqual({
      role: 'student',
      createdAt: undefined,
      updatedAt: undefined,
      fullName: 'Alex',
      birthDate: '2006-04-17',
      age: undefined,
      faculty: 'ENGINEERING',
      major: 'Computer Science',
      academicLevel: 'JUNIOR',
    });
  });

  it('does not infer birthDate from legacy age', () => {
    const doc = mapFirestoreDataToUserProfile({
      role: 'student',
      age: '20',
    });
    expect(doc?.birthDate).toBeUndefined();
    expect(doc?.age).toBe('20');
  });

  it('treats blank strings as absent', () => {
    const doc = mapFirestoreDataToUserProfile({
      role: 'student',
      fullName: '   ',
      birthDate: '',
      age: '',
    });
    expect(doc?.fullName).toBeUndefined();
    expect(doc?.birthDate).toBeUndefined();
    expect(doc?.age).toBeUndefined();
  });
});
