import { ThemedText } from "@/components/themed-text";
import { designTokens } from "@/constants/design-tokens";
import { ROUTES } from "@/constants/routes";
import { useSelection } from "@/contexts/selection-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useGlobalSearchParams, useSegments } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const MIN_TAB_TOUCH_PTS = 44;
const { color: C } = designTokens;

const TAB_HIT_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

function paramToString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function iconColorFor(isActive: (route: string) => boolean) {
  return (route: string) => (isActive(route) ? C.primary : C.textSecondary);
}

export function StudentBottomNavigation() {
  const segments = useSegments();
  const globalParams = useGlobalSearchParams();
  const { alerts, lastPlannerFlowRoute, lastNotesFolderName } = useSelection();

  const unreadAlertCount = alerts.filter((alert) => !alert.isRead).length;

  const isActive = (route: string) => {
    const currentPath = `/${segments.join("/")}`;

    // Special handling for planner tab - also active when in planner-flow
    if (route === ROUTES.STUDENT.PLANNER) {
      return (
        currentPath === ROUTES.STUDENT.PLANNER ||
        currentPath.startsWith(ROUTES.STUDENT.PLANNER + "/") ||
        currentPath.startsWith("/(student)/(planner-flow)")
      );
    }

    // Special handling for notes tab - also active when in folder-content
    if (route === ROUTES.STUDENT.NOTES) {
      return (
        currentPath === ROUTES.STUDENT.NOTES ||
        currentPath.startsWith(ROUTES.STUDENT.NOTES + "/") ||
        currentPath === ROUTES.STUDENT.FOLDER_CONTENT ||
        currentPath.startsWith(ROUTES.STUDENT.FOLDER_CONTENT + "/")
      );
    }

    return currentPath === route || currentPath.startsWith(route + "/");
  };

  const handleNavigation = (route: string) => {
    // Special handling for planner tab - navigate to saved route if available
    if (route === ROUTES.STUDENT.PLANNER) {
      const currentPath = `/${segments.join("/")}`;

      // If we have a saved route and we're not already on it, go to the saved route
      if (lastPlannerFlowRoute && currentPath !== lastPlannerFlowRoute) {
        router.push(lastPlannerFlowRoute);
        return;
      }

      // If we're already on the saved route or on the planner screen, go to main planner
      // This allows returning to the main planner screen
      if (currentPath !== ROUTES.STUDENT.PLANNER) {
        router.push(ROUTES.STUDENT.PLANNER);
        return;
      }

      // If already on main planner, don't navigate
      return;
    }

    if (route === ROUTES.STUDENT.NOTES) {
      const currentPath = `/${segments.join("/")}`;
      const activeFolderName = paramToString(globalParams.folderName);

      const onNotesHub =
        currentPath === ROUTES.STUDENT.NOTES ||
        currentPath.startsWith(ROUTES.STUDENT.NOTES + "/");
      const onFolder =
        currentPath === ROUTES.STUDENT.FOLDER_CONTENT ||
        currentPath.startsWith(ROUTES.STUDENT.FOLDER_CONTENT + "/");
      const outsideNotes = !onNotesHub && !onFolder;

      if (outsideNotes) {
        if (lastNotesFolderName) {
          router.push({
            pathname: ROUTES.STUDENT.FOLDER_CONTENT,
            params: { folderName: lastNotesFolderName },
          });
        } else {
          router.push(ROUTES.STUDENT.NOTES);
        }
        return;
      }

      if (
        onFolder &&
        lastNotesFolderName &&
        activeFolderName === lastNotesFolderName
      ) {
        router.push(ROUTES.STUDENT.NOTES);
        return;
      }

      return;
    }

    // Don't navigate if we're already on this route
    if (isActive(route)) {
      return;
    }

    router.push(route);
  };

  const iconColor = iconColorFor(isActive);

  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Planner"
        accessibilityState={{ selected: isActive(ROUTES.STUDENT.PLANNER) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.STUDENT.PLANNER)}
      >
        <MaterialIcons
          name="event-note"
          size={24}
          color={iconColor(ROUTES.STUDENT.PLANNER)}
        />
        <ThemedText
          style={
            isActive(ROUTES.STUDENT.PLANNER)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          PLANNER
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Saved"
        accessibilityState={{ selected: isActive(ROUTES.STUDENT.SAVED) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.STUDENT.SAVED)}
      >
        <MaterialIcons
          name="bookmark"
          size={24}
          color={iconColor(ROUTES.STUDENT.SAVED)}
        />
        <ThemedText
          style={
            isActive(ROUTES.STUDENT.SAVED)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          SAVED
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Notes"
        accessibilityState={{ selected: isActive(ROUTES.STUDENT.NOTES) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.STUDENT.NOTES)}
      >
        <MaterialIcons
          name="description"
          size={24}
          color={iconColor(ROUTES.STUDENT.NOTES)}
        />
        <ThemedText
          style={
            isActive(ROUTES.STUDENT.NOTES)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          NOTES
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel={
          unreadAlertCount > 0 ? `Alerts, ${unreadAlertCount} unread` : "Alerts"
        }
        accessibilityState={{ selected: isActive(ROUTES.STUDENT.ALERTS) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.STUDENT.ALERTS)}
      >
        <View style={styles.alertIconContainer}>
          <MaterialIcons
            name="notifications"
            size={24}
            color={iconColor(ROUTES.STUDENT.ALERTS)}
          />
          {unreadAlertCount > 0 && (
            <View
              style={styles.alertDot}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          )}
        </View>
        <ThemedText
          style={
            isActive(ROUTES.STUDENT.ALERTS)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          ALERTS
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Account"
        accessibilityState={{ selected: isActive(ROUTES.STUDENT.ACCOUNT) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.STUDENT.ACCOUNT)}
      >
        <MaterialIcons
          name="account-circle"
          size={24}
          color={iconColor(ROUTES.STUDENT.ACCOUNT)}
        />
        <ThemedText
          style={
            isActive(ROUTES.STUDENT.ACCOUNT)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          ACCOUNT
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export function AdminBottomNavigation() {
  const segments = useSegments();
  const globalParams = useGlobalSearchParams();
  const { lastNotesFolderName } = useSelection();

  const isActive = (route: string) => {
    const currentPath = `/${segments.join("/")}`;
    if (route === ROUTES.ADMIN.NOTES) {
      // Notes tab should be active when in notes or folder-content
      return (
        currentPath === ROUTES.ADMIN.NOTES ||
        currentPath.startsWith(ROUTES.ADMIN.NOTES + "/") ||
        currentPath === ROUTES.ADMIN.FOLDER_CONTENT ||
        currentPath.startsWith(ROUTES.ADMIN.FOLDER_CONTENT + "/")
      );
    }
    if (route === ROUTES.STUDENT.ACCOUNT) {
      return (
        currentPath === ROUTES.STUDENT.ACCOUNT ||
        currentPath.startsWith(ROUTES.STUDENT.ACCOUNT + "/")
      );
    }
    return currentPath === route || currentPath.startsWith(route + "/");
  };

  const handleNavigation = (route: string) => {
    if (route === ROUTES.ADMIN.NOTES) {
      const currentPath = `/${segments.join("/")}`;
      const activeFolderName = paramToString(globalParams.folderName);

      const onNotesHub =
        currentPath === ROUTES.ADMIN.NOTES ||
        currentPath.startsWith(ROUTES.ADMIN.NOTES + "/");
      const onFolder =
        currentPath === ROUTES.ADMIN.FOLDER_CONTENT ||
        currentPath.startsWith(ROUTES.ADMIN.FOLDER_CONTENT + "/");
      const outsideNotes = !onNotesHub && !onFolder;

      if (outsideNotes) {
        if (lastNotesFolderName) {
          router.push({
            pathname: ROUTES.ADMIN.FOLDER_CONTENT,
            params: { folderName: lastNotesFolderName },
          });
        } else {
          router.push(ROUTES.ADMIN.NOTES);
        }
        return;
      }

      if (
        onFolder &&
        lastNotesFolderName &&
        activeFolderName === lastNotesFolderName
      ) {
        router.push(ROUTES.ADMIN.NOTES);
        return;
      }

      return;
    }

    // Don't navigate if we're already on this route
    if (isActive(route)) {
      return;
    }
    router.push(route);
  };

  const iconColor = iconColorFor(isActive);

  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Analysis"
        accessibilityState={{ selected: isActive(ROUTES.ADMIN.DASHBOARD) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.ADMIN.DASHBOARD)}
      >
        <MaterialIcons
          name="bar-chart"
          size={24}
          color={iconColor(ROUTES.ADMIN.DASHBOARD)}
        />
        <ThemedText
          style={
            isActive(ROUTES.ADMIN.DASHBOARD)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          ANALYSIS
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Notes"
        accessibilityState={{ selected: isActive(ROUTES.ADMIN.NOTES) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.ADMIN.NOTES)}
      >
        <MaterialIcons
          name="description"
          size={24}
          color={iconColor(ROUTES.ADMIN.NOTES)}
        />
        <ThemedText
          style={
            isActive(ROUTES.ADMIN.NOTES)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          NOTES
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityLabel="Account"
        accessibilityState={{ selected: isActive(ROUTES.STUDENT.ACCOUNT) }}
        hitSlop={TAB_HIT_SLOP}
        onPress={() => handleNavigation(ROUTES.STUDENT.ACCOUNT)}
      >
        <MaterialIcons
          name="account-circle"
          size={24}
          color={iconColor(ROUTES.STUDENT.ACCOUNT)}
        />
        <ThemedText
          style={
            isActive(ROUTES.STUDENT.ACCOUNT)
              ? styles.navItemTextActive
              : styles.navItemText
          }
        >
          ACCOUNT
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: C.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: C.border,
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 8,
    minHeight: MIN_TAB_TOUCH_PTS,
  },
  navItemText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textSecondary,
    marginTop: 4,
    textTransform: "uppercase",
  },
  navItemTextActive: {
    fontSize: 10,
    fontWeight: "600",
    color: C.primary,
    marginTop: 4,
    textTransform: "uppercase",
  },
  alertIconContainer: {
    position: "relative",
  },
  alertDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.alert,
    borderWidth: 1,
    borderColor: C.surfaceCard,
  },
});
