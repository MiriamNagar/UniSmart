import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, type Auth, type UserCredential } from 'firebase/auth';
import { GOOGLE_SIGN_IN_CANCELLED_CODE } from '@/lib/google-sign-in-error-message';

function getWebClientId(): string | null {
  const extra = Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined;
  const id = extra?.googleWebClientId?.trim();
  return id && id.length > 0 ? id : null;
}

function cancelledError(): Error {
  const e = new Error('Google sign-in cancelled');
  (e as { code?: string }).code = GOOGLE_SIGN_IN_CANCELLED_CODE;
  return e;
}

/**
 * Native (iOS/Android): ID token via React Native Google Sign-In → Firebase credential.
 * Requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and a dev/EAS build (not Expo Go).
 */
export async function signInWithGoogle(auth: Auth): Promise<UserCredential> {
  const webClientId = getWebClientId();
  if (!webClientId) {
    throw new Error(
      'Google sign-in requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (OAuth 2.0 Web client ID from Firebase).',
    );
  }

  GoogleSignin.configure({ webClientId });

  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const result = await GoogleSignin.signIn();
  if (result.type === 'cancelled') {
    throw cancelledError();
  }
  if (result.type !== 'success') {
    throw new Error('Google sign-in did not return account info. Please try again.');
  }

  /** Prefer idToken from sign-in response — avoids a second token request (`getTokens`) that can fail with OAuth registration errors on Android. */
  let idToken = result.data.idToken ?? null;
  if (!idToken) {
    const tokens = await GoogleSignin.getTokens();
    idToken = tokens.idToken;
  }
  if (!idToken) {
    throw new Error('Could not get Google credentials. Please try again.');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}
