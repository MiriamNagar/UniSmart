import { Stack } from 'expo-router';

export default function PlannerFlowLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: false,
      }}>
      <Stack.Screen name="course-selection" />
      <Stack.Screen name="custom-rules" />
      <Stack.Screen name="generated-options" />
    </Stack>
  );
}

