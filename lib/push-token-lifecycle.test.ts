import {
  clearPushTokenForCurrentUser,
  registerPushTokenForCurrentUser,
  resolvePushTokenFromExtra,
  resolvePushTokenFromConfig,
} from "@/lib/push-token-lifecycle";

describe("registerPushTokenForCurrentUser", () => {
  it("writes token metadata for the signed-in user", async () => {
    const writeUserPushToken = jest.fn<
      Promise<void>,
      [
        {
          uid: string;
          token: string;
          provider: "expo" | "fcm";
          updatedAtMs: number;
        },
      ]
    >();
    const now = new Date("2026-04-17T13:00:00.000Z");

    const result = await registerPushTokenForCurrentUser(
      async () => ({ token: "ExponentPushToken[abc123]", provider: "expo" }),
      {
        getCurrentUserUid: () => "student-1",
        now: () => now,
        getCurrentPushToken: async () => ({
          token: "ExponentPushToken[abc123]",
          provider: "expo",
        }),
        writeUserPushToken: async (input) => writeUserPushToken(input),
      },
    );

    expect(writeUserPushToken).toHaveBeenCalledWith({
      uid: "student-1",
      token: "ExponentPushToken[abc123]",
      provider: "expo",
      updatedAtMs: now.getTime(),
    });
    expect(result).toEqual({
      uid: "student-1",
      token: "ExponentPushToken[abc123]",
      provider: "expo",
      updatedAtMs: now.getTime(),
    });
  });

  it("returns null when no signed-in user exists", async () => {
    const result = await registerPushTokenForCurrentUser(async () => ({
      token: "ExponentPushToken[abc123]",
      provider: "expo",
    }), {
      getCurrentUserUid: () => undefined,
      now: () => new Date(),
      getCurrentPushToken: async () => ({
        token: "ExponentPushToken[abc123]",
        provider: "expo",
      }),
      writeUserPushToken: async () => undefined,
    });

    expect(result).toBeNull();
  });

  it("throws when provider returns a token with surrounding spaces", async () => {
    await expect(
      registerPushTokenForCurrentUser(
        async () => ({ token: " bad-token ", provider: "fcm" }),
        {
          getCurrentUserUid: () => "student-1",
          now: () => new Date(),
          getCurrentPushToken: async () => ({ token: " bad-token ", provider: "fcm" }),
          writeUserPushToken: async () => undefined,
        },
      ),
    ).rejects.toThrow("Push token must not contain leading or trailing spaces.");
  });
});

describe("clearPushTokenForCurrentUser", () => {
  it("clears token metadata when a user is signed in", async () => {
    const clearUserPushToken = jest.fn<Promise<void>, [{ uid: string }]>();
    const cleared = await clearPushTokenForCurrentUser({
      getCurrentUserUid: () => "student-1",
      clearUserPushToken: async (input) => clearUserPushToken(input),
    });

    expect(cleared).toBe(true);
    expect(clearUserPushToken).toHaveBeenCalledWith({ uid: "student-1" });
  });

  it("returns false when user is missing", async () => {
    const clearUserPushToken = jest.fn<Promise<void>, [{ uid: string }]>();
    const cleared = await clearPushTokenForCurrentUser({
      getCurrentUserUid: () => undefined,
      clearUserPushToken: async (input) => clearUserPushToken(input),
    });

    expect(cleared).toBe(false);
    expect(clearUserPushToken).not.toHaveBeenCalled();
  });
});

describe("resolvePushTokenFromConfig", () => {
  it("returns either null or a configured provider token shape", async () => {
    const result = await resolvePushTokenFromConfig();
    if (result === null) {
      expect(result).toBeNull();
      return;
    }
    expect(typeof result.token).toBe("string");
    expect(result.provider === "expo" || result.provider === "fcm").toBe(true);
  });
});

describe("resolvePushTokenFromExtra", () => {
  it("prefers expo token when both providers are present", () => {
    expect(
      resolvePushTokenFromExtra({
        expoPushToken: "ExponentPushToken[expo-priority-123]",
        fcmToken: "fcm_token_value_1234567890",
      }),
    ).toEqual({
      token: "ExponentPushToken[expo-priority-123]",
      provider: "expo",
    });
  });

  it("returns fcm token when expo token is missing", () => {
    expect(
      resolvePushTokenFromExtra({
        fcmToken: "fcm_token_value_1234567890",
      }),
    ).toEqual({
      token: "fcm_token_value_1234567890",
      provider: "fcm",
    });
  });

  it("returns null when values are missing or blank", () => {
    expect(resolvePushTokenFromExtra({})).toBeNull();
    expect(resolvePushTokenFromExtra({ expoPushToken: "   " })).toBeNull();
  });

  it("throws when token has surrounding whitespace", () => {
    expect(() =>
      resolvePushTokenFromExtra({
        expoPushToken: " ExponentPushToken[bad] ",
      }),
    ).toThrow("Push token must not contain leading or trailing spaces.");
  });
});
