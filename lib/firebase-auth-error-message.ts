/**
 * Maps Firebase Auth error codes to safe, user-facing copy (no tokens or stack traces).
 * Uses `code` duck-typing so callers need not depend on `instanceof` (works in tests without loading firebase/app ESM).
 */

/** Use `sign-up` on registration screens so generic errors say "Registration" instead of "Sign-in". */
export type FirebaseAuthFlow = 'sign-in' | 'sign-up';

function authCodeFromMessage(message: string): string | null {
  const m = message.match(/\b(auth\/[a-z0-9-]+)\b/);
  return m ? m[1] : null;
}

function isFirebaseErrorShape(error: unknown): error is { code: string; name?: string } {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { name?: unknown; code?: unknown };
  return e.name === 'FirebaseError' && typeof e.code === 'string' && e.code.startsWith('auth/');
}

function getFirebaseAuthErrorCode(error: unknown): string | null {
  if (isFirebaseErrorShape(error)) {
    return error.code;
  }

  if (typeof error === 'object' && error !== null) {
    if ('code' in error) {
      const code = (error as { code: unknown }).code;
      if (typeof code === 'string' && code.startsWith('auth/')) {
        return code;
      }
    }
    const cause = (error as { cause?: unknown }).cause;
    if (typeof cause === 'object' && cause !== null && 'code' in cause) {
      const c = (cause as { code: unknown }).code;
      if (typeof c === 'string' && c.startsWith('auth/')) {
        return c;
      }
    }
  }

  if (error instanceof Error) {
    return authCodeFromMessage(error.message);
  }

  return null;
}

/** Stable copy for “we could not map this error” — used by Google flow to append extra hints. */
export const GENERIC_FIREBASE_AUTH_FAILURE: Record<FirebaseAuthFlow, string> = {
  'sign-up': 'Registration could not complete. Please try again.',
  'sign-in': 'Sign-in could not complete. Please try again.',
};

function flowFallback(flow: FirebaseAuthFlow): string {
  return GENERIC_FIREBASE_AUTH_FAILURE[flow];
}

function unknownAuthCodeMessage(code: string, flow: FirebaseAuthFlow): string {
  const prefix =
    flow === 'sign-up'
      ? 'Registration could not complete'
      : 'Sign-in could not complete';
  return `${prefix} (${code}). If Google is enabled in Firebase, confirm this build’s Android SHA-1 (or iOS client) and Web OAuth client ID match the console.`;
}

export function mapFirebaseAuthErrorToMessage(
  error: unknown,
  options?: { flow?: FirebaseAuthFlow },
): string {
  const flow = options?.flow ?? 'sign-in';
  const code = getFirebaseAuthErrorCode(error);
  if (!code) {
    return flowFallback(flow);
  }
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address does not look valid. Check for typos in the address or domain.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled for this project. In Firebase Console → Authentication → Sign-in methods, enable Email/Password and/or Google as needed.';
    case 'auth/invalid-api-key':
      return 'Firebase API key is invalid. Check EXPO_PUBLIC_FIREBASE_* values match your Firebase project.';
    case 'auth/unauthorized-domain':
      return 'This app domain is not authorized for OAuth. Add it under Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/timeout':
      return 'The request timed out. Check your connection and try again.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Sign-in failed. Check your email and password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is already used with a different sign-in method. Try another option.';
    case 'auth/credential-already-in-use':
      return 'This Google account is already linked to another profile. Sign in with Google, or use a different Google account.';
    case 'auth/internal-error':
      return 'Authentication hit a temporary server error. Try again in a moment.';
    case 'auth/popup-blocked':
      return 'Sign-in was blocked. Allow pop-ups for this site and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled.';
    default:
      return unknownAuthCodeMessage(code, flow);
  }
}
