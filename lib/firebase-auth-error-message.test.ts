import { mapFirebaseAuthErrorToMessage } from './firebase-auth-error-message';

function authError(code: string) {
  return { code, message: 'x', name: 'FirebaseError' };
}

describe('mapFirebaseAuthErrorToMessage', () => {
  it('maps invalid-email', () => {
    expect(mapFirebaseAuthErrorToMessage(authError('auth/invalid-email'))).toMatch(/email/i);
  });

  it('maps credential-related codes to neutral copy', () => {
    for (const code of ['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'] as const) {
      expect(mapFirebaseAuthErrorToMessage(authError(code))).toContain('Sign-in failed');
    }
  });

  it('maps too-many-requests and network', () => {
    expect(mapFirebaseAuthErrorToMessage(authError('auth/too-many-requests'))).toMatch(/Too many|attempts/i);
    expect(mapFirebaseAuthErrorToMessage(authError('auth/network-request-failed'))).toMatch(/Network/i);
  });

  it('maps account-exists-with-different-credential and popup errors', () => {
    expect(mapFirebaseAuthErrorToMessage(authError('auth/account-exists-with-different-credential'))).toMatch(
      /different sign-in/i,
    );
    expect(mapFirebaseAuthErrorToMessage(authError('auth/credential-already-in-use'))).toMatch(/Google account/i);
    expect(mapFirebaseAuthErrorToMessage(authError('auth/internal-error'))).toMatch(/temporary|again/i);
    expect(mapFirebaseAuthErrorToMessage(authError('auth/popup-blocked'))).toMatch(/pop-up/i);
    expect(mapFirebaseAuthErrorToMessage(authError('auth/popup-closed-by-user'))).toMatch(/cancelled/i);
  });

  it('uses fallback for unknown codes and non-auth values', () => {
    expect(mapFirebaseAuthErrorToMessage(authError('auth/unknown-code'))).toMatch(/could not complete.*auth\/unknown-code/i);
    expect(mapFirebaseAuthErrorToMessage(authError('auth/unknown-code'))).toMatch(/SHA-1|OAuth/i);
    expect(mapFirebaseAuthErrorToMessage(new Error('oops'))).toMatch(/could not complete/i);
    expect(mapFirebaseAuthErrorToMessage({ code: 'not-auth/foo' })).toMatch(/could not complete/i);
  });

  it('extracts auth code from Firebase-shaped errors and from message text', () => {
    expect(
      mapFirebaseAuthErrorToMessage({
        name: 'FirebaseError',
        code: 'auth/wrong-password',
        message: 'Firebase: Error (auth/wrong-password).',
      }),
    ).toContain('Sign-in failed');
    expect(
      mapFirebaseAuthErrorToMessage(new Error('Firebase: Error (auth/network-request-failed).')),
    ).toMatch(/Network/i);
  });

  it('uses sign-up copy for registration flow', () => {
    expect(mapFirebaseAuthErrorToMessage(authError('auth/unknown-code'), { flow: 'sign-up' })).toMatch(
      /Registration could not complete.*auth\/unknown-code/i,
    );
    expect(mapFirebaseAuthErrorToMessage(authError('auth/email-already-in-use'), { flow: 'sign-up' })).toMatch(
      /already exists/i,
    );
    expect(mapFirebaseAuthErrorToMessage(authError('auth/weak-password'), { flow: 'sign-up' })).toMatch(/6 characters/i);
  });

  it('maps sign-up–relevant codes for email/password registration', () => {
    expect(mapFirebaseAuthErrorToMessage(authError('auth/invalid-email'), { flow: 'sign-up' })).toMatch(/email/i);
    expect(mapFirebaseAuthErrorToMessage(authError('auth/network-request-failed'), { flow: 'sign-up' })).toMatch(
      /Network/i,
    );
    expect(mapFirebaseAuthErrorToMessage(authError('auth/operation-not-allowed'), { flow: 'sign-up' })).toMatch(
      /Email\/Password|Google/i,
    );
    expect(mapFirebaseAuthErrorToMessage(new Error('no code'), { flow: 'sign-up' })).toMatch(
      /Registration could not complete/i,
    );
  });
});
