import { clearPushTokenForCurrentUser } from "@/lib/push-token-lifecycle";

type BeforeSignOutDeps = {
  clearPushToken: () => Promise<boolean>;
  warn: (message: string, error: unknown) => void;
  timeoutMs: number;
};

const defaultDeps: BeforeSignOutDeps = {
  clearPushToken: () => clearPushTokenForCurrentUser(),
  warn: (message, error) => console.warn(message, error),
  timeoutMs: 2500,
};

/**
 * Side effects that must run as part of signing out (Account flow and any future entry points).
 *
 * Story 5.2: token clearing belongs next to Auth sign-out so push delivery does not continue
 * after a user intentionally ends their session.
 */
export async function beforeFirebaseSignOut(deps?: Partial<BeforeSignOutDeps>): Promise<void> {
  const resolvedDeps: BeforeSignOutDeps = {
    clearPushToken: deps?.clearPushToken ?? defaultDeps.clearPushToken,
    warn: deps?.warn ?? defaultDeps.warn,
    timeoutMs: deps?.timeoutMs ?? defaultDeps.timeoutMs,
  };
  try {
    await Promise.race([
      resolvedDeps.clearPushToken(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Push token clear timed out.")), resolvedDeps.timeoutMs);
      }),
    ]);
  } catch (error) {
    resolvedDeps.warn("[sign-out] Failed to clear push token before sign-out.", error);
  }
}
