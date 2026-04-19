import {
    extractAlertIdFromNotificationResponse,
    MARK_AS_READ_ACTION_IDENTIFIER,
} from "@/lib/notification-dismiss-read-sync";

let initialized = false;

export async function initializePushNotificationRuntime(): Promise<void> {
  if (initialized) {
    return;
  }
  initialized = true;
  try {
    const Notifications = await import("expo-notifications");
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    const { Platform } = await import("react-native");
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    await Notifications.setNotificationCategoryAsync("alerts", [
      {
        identifier: MARK_AS_READ_ACTION_IDENTIFIER,
        buttonTitle: "Mark as read",
        options: {
          // Ensure JS runtime is active so read-state sync can run reliably.
          opensAppToForeground: true,
        },
      },
    ]);
  } catch {
    // Runtime notification setup is best-effort; app should continue without crashing.
  }
}

async function ensureLocalNotificationPermission(): Promise<boolean> {
  try {
    const Notifications = await import("expo-notifications");
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === "granted") {
      return true;
    }
    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === "granted";
  } catch {
    return false;
  }
}

export async function sendLocalNotification(input: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    const allowed = await ensureLocalNotificationPermission();
    if (!allowed) {
      if (__DEV__) {
        console.warn(
          "[notifications] local notification not scheduled (permission not granted)",
        );
      }
      return;
    }
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: {
        title: input.title,
        body: input.body,
        data: input.data ?? {},
        categoryIdentifier:
          typeof input.data?.alertId === "string" ? "alerts" : undefined,
      },
      trigger: null,
    });
  } catch (e) {
    if (__DEV__) {
      console.warn("[notifications] scheduleNotificationAsync failed:", e);
    }
  }
}

export async function subscribeNotificationDismissals(
  onDismissedAlert: (alertId: string) => void,
): Promise<() => void> {
  try {
    const Notifications = await import("expo-notifications");
    const notificationsRecord = Notifications as unknown as Record<
      string,
      unknown
    >;
    const dismissedActionIdentifier =
      notificationsRecord.DISMISSED_ACTION_IDENTIFIER ??
      notificationsRecord.NotificationDismissActionIdentifier;
    const normalizedDismissedActionIdentifier =
      typeof dismissedActionIdentifier === "string" &&
      dismissedActionIdentifier.trim()
        ? dismissedActionIdentifier
        : undefined;
    const defaultActionIdentifier =
      notificationsRecord.DEFAULT_ACTION_IDENTIFIER;
    const normalizedDefaultActionIdentifier =
      typeof defaultActionIdentifier === "string" &&
      defaultActionIdentifier.trim()
        ? defaultActionIdentifier
        : undefined;

    const actionableIdentifiers = [
      normalizedDismissedActionIdentifier,
      normalizedDefaultActionIdentifier,
      MARK_AS_READ_ACTION_IDENTIFIER,
    ].filter((value): value is string => typeof value === "string");

    if (actionableIdentifiers.length === 0) {
      return () => {};
    }

    const maybeHandleResponse = (
      response:
        | {
            actionIdentifier: string;
            notification: { request: { content: { data: unknown } } };
          }
        | null
        | undefined,
    ) => {
      if (!response) {
        return;
      }
      const dismissedAlertId = extractAlertIdFromNotificationResponse(
        {
          actionIdentifier: response.actionIdentifier,
          notificationData: response.notification.request.content.data,
        },
        actionableIdentifiers,
      );

      if (dismissedAlertId) {
        onDismissedAlert(dismissedAlertId);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        maybeHandleResponse(response);
      },
    );
    void Notifications.getLastNotificationResponseAsync().then(
      (lastResponse) => {
        maybeHandleResponse(lastResponse);
      },
    );

    return () => {
      subscription.remove();
    };
  } catch {
    // Some environments do not expose dismiss callbacks; keep app stable.
    return () => {};
  }
}
