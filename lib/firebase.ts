import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  FirebaseError,
  getApp,
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import type { Analytics } from 'firebase/analytics';
import { Platform } from 'react-native';

type FirebaseExtra = {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
};

function readFirebaseConfig(): FirebaseOptions | null {
  const extra = Constants.expoConfig?.extra as { firebase?: FirebaseExtra } | undefined;
  const f = extra?.firebase;
  if (
    !f?.apiKey ||
    !f?.authDomain ||
    !f?.projectId ||
    !f?.storageBucket ||
    !f?.messagingSenderId ||
    !f?.appId
  ) {
    return null;
  }
  const options: FirebaseOptions = {
    apiKey: f.apiKey,
    authDomain: f.authDomain,
    projectId: f.projectId,
    storageBucket: f.storageBucket,
    messagingSenderId: f.messagingSenderId,
    appId: f.appId,
  };
  if (f.measurementId) {
    options.measurementId = f.measurementId;
  }
  return options;
}

export function isFirebaseConfigured(): boolean {
  return readFirebaseConfig() !== null;
}

function getOrInitApp(): FirebaseApp | undefined {
  const options = readFirebaseConfig();
  if (!options) {
    if (__DEV__) {
      console.warn(
        '[UniSmart Firebase] Public config missing or incomplete. Set EXPO_PUBLIC_FIREBASE_* (see README). Auth and Firestore are not initialized until then.',
      );
    }
    return undefined;
  }
  return getApps().length > 0 ? getApp() : initializeApp(options);
}

function getOrInitAuth(firebaseApp: FirebaseApp): Auth {
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e: unknown) {
    if (e instanceof FirebaseError && e.code === 'auth/already-initialized') {
      return getAuth(firebaseApp);
    }
    throw e;
  }
}

const firebaseApp = getOrInitApp();

/** Default Firebase app, or `undefined` if public config is not wired yet. */
export const app: FirebaseApp | undefined = firebaseApp;

/** Auth instance for this app, or `undefined` if Firebase is not configured. */
export const auth: Auth | undefined = firebaseApp ? getOrInitAuth(firebaseApp) : undefined;

/** Firestore instance for this app, or `undefined` if Firebase is not configured. */
export const db: Firestore | undefined = firebaseApp ? getFirestore(firebaseApp) : undefined;

/**
 * Firebase Analytics (web only). Loaded only on web so the Analytics SDK is not bundled/evaluated on native.
 * Requires `measurementId` in config (optional field in Firebase console).
 */
export const analytics: Analytics | undefined =
  Platform.OS === 'web' && firebaseApp
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- web-only; avoids pulling analytics into native bundles
      (require('firebase/analytics') as typeof import('firebase/analytics')).getAnalytics(firebaseApp)
    : undefined;
