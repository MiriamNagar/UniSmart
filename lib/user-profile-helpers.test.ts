import {
  isUserRole,
  mapUserProfileWriteErrorToMessage,
  userProfileDocPath,
} from './user-profile-helpers';

function fsError(code: string) {
  return { code, message: 'x', name: 'FirebaseError' };
}

describe('userProfileDocPath', () => {
  it('uses users/{uid}', () => {
    expect(userProfileDocPath('abc123')).toBe('users/abc123');
  });
});

describe('isUserRole', () => {
  it('accepts student and admin literals', () => {
    expect(isUserRole('student')).toBe(true);
    expect(isUserRole('admin')).toBe(true);
    expect(isUserRole('other')).toBe(false);
    expect(isUserRole(null)).toBe(false);
  });
});

describe('mapUserProfileWriteErrorToMessage', () => {
  it('maps permission-denied without leaking internals', () => {
    const msg = mapUserProfileWriteErrorToMessage(fsError('permission-denied'));
    expect(msg).toContain('profile');
    expect(msg).not.toContain('Detailed');
  });

  it('maps unconfigured Firestore', () => {
    expect(mapUserProfileWriteErrorToMessage(new Error('Firestore is not configured.'))).toContain(
      'Firebase',
    );
  });
});
