export type PushTokenProviderResult = {
  token: string;
  provider: "expo" | "fcm";
};

export type PushTokenRegistrationRecord = {
  uid: string;
  token: string;
  provider: "expo" | "fcm";
  updatedAtMs: number;
};

const MAX_PUSH_TOKEN_LENGTH = 4096;
const PUSH_TOKEN_PATTERN =
  /^(ExponentPushToken\[[^\]]+\]|[A-Za-z0-9:_.-]{20,})$/;
const recentTokenByUid = new Map<string, string>();

type RegisterPushTokenDeps = {
  getCurrentUserUid: () => string | undefined;
  now: () => Date;
  getCurrentPushToken: () => Promise<PushTokenProviderResult | null>;
  writeUserPushToken: (input: {
    uid: string;
    token: string;
    provider: "expo" | "fcm";
    updatedAtMs: number;
  }) => Promise<void>;
};

type ClearPushTokenDeps = {
  getCurrentUserUid: () => string | undefined;
  clearUserPushToken: (input: { uid: string }) => Promise<void>;
};

function requireCleanToken(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Push token is required.");
  }
  if (value !== trimmed) {
    throw new Error("Push token must not contain leading or trailing spaces.");
  }
  if (
    trimmed.length > MAX_PUSH_TOKEN_LENGTH ||
    !PUSH_TOKEN_PATTERN.test(trimmed)
  ) {
    throw new Error("Push token format is invalid.");
  }
  return trimmed;
}

function makeDefaultRegisterDeps(
  tokenProvider: () => Promise<PushTokenProviderResult | null>,
): RegisterPushTokenDeps {
  let cachedAuth: { currentUser?: { uid?: string } } | undefined;

  return {
    getCurrentUserUid: () => cachedAuth?.currentUser?.uid,
    now: () => new Date(),
    getCurrentPushToken: tokenProvider,
    writeUserPushToken: async (input) => {
      const { auth, db } = await import("@/lib/firebase");
      cachedAuth = auth;
      if (!db) {
        throw new Error("Firestore is not configured.");
      }
      const { doc, serverTimestamp, setDoc } =
        await import("firebase/firestore");
      await setDoc(
        doc(db, "users", input.uid),
        {
          pushToken: input.token,
          pushTokenProvider: input.provider,
          pushTokenUpdatedAtMs: input.updatedAtMs,
          pushTokenUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
  };
}

function makeDefaultClearDeps(): ClearPushTokenDeps {
  let cachedAuth: { currentUser?: { uid?: string } } | undefined;

  return {
    getCurrentUserUid: () => cachedAuth?.currentUser?.uid,
    clearUserPushToken: async ({ uid }) => {
      const { auth, db } = await import("@/lib/firebase");
      cachedAuth = auth;
      if (!db) {
        throw new Error("Firestore is not configured.");
      }
      const { deleteField, doc, serverTimestamp, setDoc } =
        await import("firebase/firestore");
      await setDoc(
        doc(db, "users", uid),
        {
          pushToken: deleteField(),
          pushTokenProvider: deleteField(),
          pushTokenUpdatedAtMs: deleteField(),
          pushTokenUpdatedAt: deleteField(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    },
  };
}

export async function registerPushTokenForCurrentUser(
  tokenProvider: () => Promise<PushTokenProviderResult | null>,
  deps?: RegisterPushTokenDeps,
): Promise<PushTokenRegistrationRecord | null> {
  const activeDeps = deps ?? makeDefaultRegisterDeps(tokenProvider);
  let uid = activeDeps.getCurrentUserUid();
  if (!uid && !deps) {
    const { auth } = await import("@/lib/firebase");
    uid = auth?.currentUser?.uid;
  }
  if (!uid) {
    return null;
  }
  const tokenResult = await activeDeps.getCurrentPushToken();
  if (!tokenResult) {
    return null;
  }
  const token = requireCleanToken(tokenResult.token);
  const tokenCacheKey = `${tokenResult.provider}:${token}`;
  if (recentTokenByUid.get(uid) === tokenCacheKey) {
    return {
      uid,
      token,
      provider: tokenResult.provider,
      updatedAtMs: activeDeps.now().getTime(),
    };
  }

  if (!deps) {
    const { auth } = await import("@/lib/firebase");
    if (!auth?.currentUser?.uid || auth.currentUser.uid !== uid) {
      return null;
    }
  }

  const updatedAtMs = activeDeps.now().getTime();
  await activeDeps.writeUserPushToken({
    uid,
    token,
    provider: tokenResult.provider,
    updatedAtMs,
  });
  recentTokenByUid.set(uid, tokenCacheKey);
  return {
    uid,
    token,
    provider: tokenResult.provider,
    updatedAtMs,
  };
}

export async function clearPushTokenForCurrentUser(
  deps?: ClearPushTokenDeps,
): Promise<boolean> {
  const activeDeps = deps ?? makeDefaultClearDeps();
  let uid = activeDeps.getCurrentUserUid();
  if (!uid && !deps) {
    const { auth } = await import("@/lib/firebase");
    uid = auth?.currentUser?.uid;
  }
  if (!uid) {
    return false;
  }
  await activeDeps.clearUserPushToken({ uid });
  recentTokenByUid.delete(uid);
  return true;
}

type PushTokenConfigExtra = {
  expoPushToken?: unknown;
  fcmToken?: unknown;
};

export function resolvePushTokenFromExtra(
  extra: unknown,
): PushTokenProviderResult | null {
  const config = (extra as PushTokenConfigExtra | undefined) ?? {};
  if (typeof config.expoPushToken === "string" && config.expoPushToken.trim()) {
    return {
      token: requireCleanToken(config.expoPushToken),
      provider: "expo",
    };
  }
  if (typeof config.fcmToken === "string" && config.fcmToken.trim()) {
    return {
      token: requireCleanToken(config.fcmToken),
      provider: "fcm",
    };
  }
  return null;
}

/**
 * Resolves a real device token when possible, with config fallback for demo harnesses.
 */
export async function resolvePushTokenFromConfig(): Promise<PushTokenProviderResult | null> {
  try {
    const Notifications = await import("expo-notifications");
    const ConstantsModule = await import("expo-constants");
    const Constants = ConstantsModule.default as {
      expoConfig?: { extra?: unknown };
      easConfig?: { projectId?: string };
    };
    const currentPermissions = await Notifications.getPermissionsAsync();
    const resolvedPermissions =
      currentPermissions.granted ||
      currentPermissions.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL
        ? currentPermissions
        : await Notifications.requestPermissionsAsync();
    const granted =
      resolvedPermissions.granted ||
      resolvedPermissions.ios?.status ===
        Notifications.IosAuthorizationStatus.PROVISIONAL;
    if (granted) {
      const projectId =
        Constants.easConfig?.projectId ??
        (
          Constants.expoConfig?.extra as
            | { eas?: { projectId?: unknown } }
            | undefined
        )?.eas?.projectId;
      const tokenResponse = projectId
        ? await Notifications.getExpoPushTokenAsync({
            projectId: String(projectId),
          })
        : await Notifications.getExpoPushTokenAsync();
      if (typeof tokenResponse.data === "string") {
        return {
          token: requireCleanToken(tokenResponse.data),
          provider: "expo",
        };
      }
    }
    return resolvePushTokenFromExtra(Constants.expoConfig?.extra);
  } catch {
    try {
      const ConstantsModule = await import("expo-constants");
      const Constants = ConstantsModule.default as {
        expoConfig?: { extra?: unknown };
      };
      return resolvePushTokenFromExtra(Constants.expoConfig?.extra);
    } catch {
      return null;
    }
  }
}
