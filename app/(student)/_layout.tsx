import {
  AdminBottomNavigation,
  StudentBottomNavigation,
} from "@/components/bottom-navigation";
import { BguPlannerCatalogProvider } from "@/contexts/bgu-planner-catalog-context";
import { useSelection } from "@/contexts/selection-context";
import { useStudentShellRoleGate } from "@/hooks/use-role-gate";
import { markAlertReadFromDismissal } from "@/lib/notification-dismiss-read-sync";
import { subscribeNotificationDismissals } from "@/lib/push-notification-runtime";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function StudentLayout() {
  const { setAlerts, userInfo } = useSelection();
  useStudentShellRoleGate();
  useEffect(() => {
    let unsubscribe = () => {};
    void subscribeNotificationDismissals((dismissedAlertId) => {
      setAlerts((prevAlerts) =>
        markAlertReadFromDismissal(prevAlerts, dismissedAlertId),
      );
    }).then((teardown) => {
      unsubscribe = teardown;
    });
    return () => {
      unsubscribe();
    };
  }, [setAlerts]);

  return (
    <BguPlannerCatalogProvider>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="planner" />
          <Stack.Screen name="saved" />
          <Stack.Screen name="notes" />
          <Stack.Screen name="alerts" />
          <Stack.Screen name="account" />
          <Stack.Screen name="folder-content" />
          <Stack.Screen
            name="(planner-flow)"
            options={{ presentation: "modal" }}
          />
        </Stack>
        {userInfo.userType === "admin" ? (
          <AdminBottomNavigation />
        ) : (
          <StudentBottomNavigation />
        )}
      </View>
    </BguPlannerCatalogProvider>
  );
}
