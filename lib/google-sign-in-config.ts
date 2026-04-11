import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { isFirebaseConfigured } from '@/lib/firebase';

function readGoogleWebClientId(): string | null {
  const extra = Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined;
  const id = extra?.googleWebClientId?.trim();
  return id && id.length > 0 ? id : null;
}

/**
 * Whether Google sign-in can run on this platform: Firebase must be configured,
 * and on native we need the OAuth web client ID (Firebase Console → Project settings → Web client).
 */
export function isGoogleSignInConfigured(): boolean {
  if (!isFirebaseConfigured()) return false;
  if (Platform.OS === 'web') return true;
  return readGoogleWebClientId() !== null;
}

/**
 * Use for enabling the Google CTA: web uses Firebase popup; native requires a dev/EAS build
 * (not Expo Go) plus `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
 */
export function isGoogleSignInAvailableOnThisRuntime(): boolean {
  if (Platform.OS === 'web') {
    return isFirebaseConfigured();
  }
  if (Constants.appOwnership === 'expo') {
    return false;
  }
  return isGoogleSignInConfigured();
}

export function googleSignInUnavailableReason(): string | null {
  if (Platform.OS === 'web') {
    return null;
  }
  if (Constants.appOwnership === 'expo') {
    return 'Google sign-in needs a development build (it does not run in Expo Go). Use email/password or run a dev client.';
  }
  if (!isGoogleSignInConfigured()) {
    return 'Google sign-in requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (OAuth Web client from Firebase). See README.';
  }
  return null;
}
