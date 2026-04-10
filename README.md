# UniSmart

## About The Project
UniSmart is a mobile application built to help organize and simplify academic life. The main goal of the project is to provide a smart schedule planner that automatically generates optimized class schedules based on user preferences and constraints. 

## Target Audience
The application is designed for two main types of users:
* Students: Can build their schedules, save important course notes and receive university alerts.
* Administrators: Can access an analytics dashboard to view total enrollment data, track high-demand courses, and identify scheduling bottlenecks.

## Project Structure
The project is organized into a few main areas to keep the code clean. The `app` folder contains all the visible screens and the navigation flow of the application. The `components` folder holds reusable visual elements like buttons and menus, while the `contexts` folder acts as the application's memory to store user data and saved plans.

## Get Started
This project is built using Expo and React Native. To run the project locally on your machine, follow these steps:

1. Install dependencies

   ```bash
   npm install
   ```
2. Start the app

   ```bash
   npx expo start
   ```

### Firebase (client config)

UniSmart uses the **Firebase JS SDK** with a **single module** at `lib/firebase.ts`. Screens and features must import `auth` and `db` from there only; do **not** call `initializeApp` elsewhere. The schedule **solver** under `logic/solver/` must stay Firebase-free.

**What goes in the app:** only the public Web API key and related fields from the Firebase console (the same values as a web app). **Service accounts, private keys, and Admin SDK credentials must never** be committed or shipped in the client.

**Local development**

1. Copy the sample env file and fill in values from your Firebase project (Project settings → Your apps → Web app config):

   ```bash
   copy .env.example .env
   ```

   On macOS/Linux, use `cp .env.example .env`.

2. `app.config.ts` reads `EXPO_PUBLIC_FIREBASE_*` at build/start time and passes them to the app under `expo.extra.firebase`, which `lib/firebase.ts` reads via `expo-constants`.

**Variable names**

| Variable | Maps to `extra.firebase` |
|----------|----------------------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID` | `measurementId` (optional; used for Analytics on **web**) |

**Analytics:** `import { analytics } from '@/lib/firebase'` — on **web**, this is the result of `getAnalytics(app)` when config is present; on **iOS/Android** it is `undefined` because the Firebase JS Analytics SDK targets the browser.

**EAS Build:** define the same `EXPO_PUBLIC_FIREBASE_*` variables in [EAS environment variables](https://docs.expo.dev/build-reference/variables/) or the EAS dashboard so production builds receive config without committing secrets.

**If config is missing:** the app still **starts**; in development you will see a console warning and `app` / `auth` / `db` will be `undefined` until valid public config is supplied. Call sites that need Firebase should treat that as “not configured” or guard with `isFirebaseConfigured()` from `@/lib/firebase`.

References: [Expo: Using Firebase](https://docs.expo.dev/guides/using-firebase), [Firebase JS Auth on React Native (Expo)](https://github.com/expo/fyi/blob/main/firebase-js-auth-setup.md).

---

Hope the app will ease your scheduling process!