import { Stack } from "expo-router";

/** Catalog context is provided by `app/(student)/_layout.tsx` for all student routes (saved detail + planner flow). */
export default function PlannerFlowLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: false,
      }}
    >
      <Stack.Screen name="course-selection" />
      <Stack.Screen name="custom-rules" />
      <Stack.Screen name="generated-options" />
    </Stack>
  );
}
