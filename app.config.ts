import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Public Firebase Web client config only (safe to ship in the app bundle).
 * Set EXPO_PUBLIC_FIREBASE_* in `.env` for local dev, or in EAS Build env / dashboard.
 * Never put service account JSON or Admin SDK keys here.
 */
function firebaseExtraFromEnv() {
  return {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
  };
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const extra = (config.extra ?? {}) as Record<string, unknown>;

  return {
    ...config,
    extra: {
      ...extra,
      firebase: firebaseExtraFromEnv(),
    },
  };
};
