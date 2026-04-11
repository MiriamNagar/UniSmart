import {
  GENERIC_FIREBASE_AUTH_FAILURE,
  mapFirebaseAuthErrorToMessage,
  type FirebaseAuthFlow,
} from '@/lib/firebase-auth-error-message';

export const GOOGLE_SIGN_IN_CANCELLED_CODE = 'GOOGLE_SIGN_IN_CANCELLED';

/**
 * Android: Google Sign-In API status 10 = DEVELOPER_ERROR (wrong SHA-1, package name, or OAuth client).
 * iOS: similar misconfiguration often surfaces as numeric or platform-specific messages.
 */
function isGoogleNativeConfigurationError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (code === 10 || code === '10') {
      return true;
    }
  }
  if (error instanceof Error) {
    const m = error.message;
    return (
      /DEVELOPER_ERROR/i.test(m) ||
      /ApiException:\s*10\b/.test(m) ||
      /\bcode\s*[=:]\s*10\b/i.test(m)
    );
  }
  return false;
}

function googleNativeConfigMessage(flow: FirebaseAuthFlow): string {
  const verb = flow === 'sign-up' ? 'Registration' : 'Sign-in';
  return `${verb} with Google failed because the app is not registered correctly with Google. In Firebase Console, add this build’s SHA-1 fingerprint (Android) and ensure the package name matches; use the OAuth Web client ID in the app (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).`;
}

/**
 * User-facing copy for Google sign-in flows (native SDK + Firebase). No tokens or stack traces.
 */
export function mapGoogleSignInFlowErrorToMessage(
  error: unknown,
  options?: { flow?: FirebaseAuthFlow },
): string {
  const flow = options?.flow ?? 'sign-in';

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (code === GOOGLE_SIGN_IN_CANCELLED_CODE) {
      return 'Sign-in was cancelled.';
    }
  }
  if (error instanceof Error && error.message.includes('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID')) {
    return 'Google sign-in is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (OAuth Web client from Firebase; see README).';
  }
  if (isGoogleNativeConfigurationError(error)) {
    return googleNativeConfigMessage(flow);
  }
  const mapped = mapFirebaseAuthErrorToMessage(error, { flow });
  if (mapped === GENERIC_FIREBASE_AUTH_FAILURE[flow]) {
    if (error instanceof Error && error.message.length > 0) {
      const hint = error.message.toLowerCase();
      if (hint.includes('network') || hint.includes('fetch')) {
        return 'Network error while contacting Google. Check your connection and try again.';
      }
    }
    return `${GENERIC_FIREBASE_AUTH_FAILURE[flow]} If you use Google, enable it in Firebase → Authentication → Sign-in methods and verify Android SHA-1 / Web client ID.`;
  }
  return mapped;
}
