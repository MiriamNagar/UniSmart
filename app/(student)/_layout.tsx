import {
    AdminBottomNavigation,
    StudentBottomNavigation,
} from "@/components/bottom-navigation";
import { useSelection } from "@/contexts/selection-context";
import { useStudentShellRoleGate } from "@/hooks/use-role-gate";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function StudentLayout() {
  const { userInfo } = useSelection();
  useStudentShellRoleGate();

  return (
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
  );
}
