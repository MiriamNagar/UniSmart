const fullFirebaseExtra = {
  apiKey: "test-api-key",
  authDomain: "test.firebaseapp.com",
  projectId: "test-project",
  storageBucket: "test-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef",
};

describe("lib/firebase", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("initializes the default app at most once when the module is evaluated twice", () => {
    const initializeApp = jest.fn(() => ({ name: "[DEFAULT]" }));
    const getApps = jest.fn(() => [] as { name: string }[]);
    const getApp = jest.fn(() => ({ name: "[DEFAULT]" }));

    jest.doMock("firebase/app", () => ({
      getApp,
      getApps,
      initializeApp,
    }));

    jest.doMock("firebase/auth", () => ({
      getAuth: jest.fn(() => ({})),
      getReactNativePersistence: jest.fn(() => ({})),
      initializeAuth: jest.fn(() => ({})),
    }));

    jest.doMock("firebase/firestore", () => ({
      getFirestore: jest.fn(() => ({})),
    }));

    jest.doMock("firebase/analytics", () => ({
      getAnalytics: jest.fn(() => ({})),
    }));

    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {},
    }));

    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            firebase: fullFirebaseExtra,
          },
        },
      },
    }));

    jest.doMock("react-native", () => ({
      Platform: { OS: "web" },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh module after resetModules + doMock
    require("./firebase");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./firebase");

    expect(initializeApp).toHaveBeenCalledTimes(1);
    expect(getApps).toHaveBeenCalled();
  });

  it("does not call initializeApp when public config is incomplete", () => {
    const initializeApp = jest.fn(() => ({ name: "[DEFAULT]" }));
    const getApps = jest.fn(() => [] as { name: string }[]);

    jest.doMock("firebase/app", () => ({
      getApp: jest.fn(),
      getApps,
      initializeApp,
    }));

    jest.doMock("firebase/auth", () => ({
      getAuth: jest.fn(),
      getReactNativePersistence: jest.fn(() => ({})),
      initializeAuth: jest.fn(),
    }));

    jest.doMock("firebase/firestore", () => ({
      getFirestore: jest.fn(),
    }));

    jest.doMock("firebase/analytics", () => ({
      getAnalytics: jest.fn(),
    }));

    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {},
    }));

    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            firebase: { apiKey: "" },
          },
        },
      },
    }));

    jest.doMock("react-native", () => ({
      Platform: { OS: "web" },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {
      isFirebaseConfigured,
      app: firebaseApp,
      auth,
      db,
    } = require("./firebase");

    expect(isFirebaseConfigured()).toBe(false);
    expect(firebaseApp).toBeUndefined();
    expect(auth).toBeUndefined();
    expect(db).toBeUndefined();
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it("uses initializeAuth with React Native persistence on iOS when config is complete", () => {
    const initializeApp = jest.fn(() => ({ name: "[DEFAULT]" }));
    const getApps = jest.fn(() => [] as { name: string }[]);
    const getApp = jest.fn(() => ({ name: "[DEFAULT]" }));
    const initializeAuth = jest.fn(() => ({}));
    const getReactNativePersistence = jest.fn(() => ({}));

    jest.doMock("firebase/app", () => ({
      getApp,
      getApps,
      initializeApp,
    }));

    jest.doMock("firebase/auth", () => ({
      getAuth: jest.fn(),
      getReactNativePersistence,
      initializeAuth,
    }));

    jest.doMock("firebase/firestore", () => ({
      getFirestore: jest.fn(() => ({})),
    }));

    jest.doMock("firebase/analytics", () => ({
      getAnalytics: jest.fn(),
    }));

    jest.doMock("@react-native-async-storage/async-storage", () => ({
      __esModule: true,
      default: {},
    }));

    jest.doMock("expo-constants", () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: {
            firebase: fullFirebaseExtra,
          },
        },
      },
    }));

    jest.doMock("react-native", () => ({
      Platform: { OS: "ios" },
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./firebase");

    expect(initializeAuth).toHaveBeenCalledTimes(1);
    expect(initializeAuth).toHaveBeenCalledWith(
      expect.objectContaining({ name: "[DEFAULT]" }),
      expect.objectContaining({
        persistence: expect.anything(),
      }),
    );
    expect(getReactNativePersistence).toHaveBeenCalled();
  });
});
