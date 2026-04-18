import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Public Firebase Web client config only (safe to ship in the app bundle).
 * Set EXPO_PUBLIC_FIREBASE_* in `.env` for local dev, or in EAS Build env / dashboard.
 * Never put service account JSON or Admin SDK keys here.
 */
function envTrim(name: string): string {
  const v = process.env[name];
  if (v === undefined) return "";
  return typeof v === "string" ? v.trim() : "";
}

function firebaseExtraFromEnv() {
  return {
    apiKey: envTrim("EXPO_PUBLIC_FIREBASE_API_KEY"),
    authDomain: envTrim("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: envTrim("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: envTrim("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: envTrim("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: envTrim("EXPO_PUBLIC_FIREBASE_APP_ID"),
    measurementId: envTrim("EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID"),
  };
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const extra = (config.extra ?? {}) as Record<string, unknown>;
  const googleIosUrlScheme = envTrim("EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME");

  const googleSignInPlugin: [string] | [string, { iosUrlScheme: string }] =
    googleIosUrlScheme
      ? [
          "@react-native-google-signin/google-signin",
          { iosUrlScheme: googleIosUrlScheme },
        ]
      : ["@react-native-google-signin/google-signin"];

  const baseWeb =
    typeof config.web === "object" && config.web !== null ? config.web : {};

  return {
    ...config,
    /**
     * Single-page web output avoids multi-route static chunk edge cases where
     * the browser fails to fetch follow-up bundles (often reported as "Could not load bundle").
     */
    web: {
      ...baseWeb,
      bundler: "metro",
      output: "single",
    },
    android: {
      ...config.android,
      // Lets Expo inject the Google services Gradle plugin on prebuild (no manual build.gradle edits).
      // Use the JSON downloaded from Firebase when you register the Android app.
      googleServicesFile: "./google-services.json",
    },
    plugins: [
      ...(config.plugins ?? []),
      googleSignInPlugin,
      "@react-native-community/datetimepicker",
    ],
    extra: {
      ...extra,
      firebase: firebaseExtraFromEnv(),
      googleWebClientId: envTrim("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID"),
    },
  } as ExpoConfig;
};
