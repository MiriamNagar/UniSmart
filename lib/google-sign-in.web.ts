import { GoogleAuthProvider, signInWithPopup, type Auth, type UserCredential } from 'firebase/auth';
import { GOOGLE_SIGN_IN_CANCELLED_CODE } from '@/lib/google-sign-in-error-message';

function cancelledError(): Error {
  const e = new Error('Google sign-in cancelled');
  (e as { code?: string }).code = GOOGLE_SIGN_IN_CANCELLED_CODE;
  return e;
}

/**
 * Web: Firebase popup with Google provider (same `auth` instance as native).
 */
export async function signInWithGoogle(auth: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  try {
    return await signInWithPopup(auth, provider);
  } catch (e: unknown) {
    const code =
      typeof e === 'object' && e !== null && 'code' in e
        ? String((e as { code: unknown }).code)
        : '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw cancelledError();
    }
    throw e;
  }
}
