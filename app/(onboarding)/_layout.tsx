import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="identity-hub" />
      <Stack.Screen name="department" />
      <Stack.Screen name="academic-level" />
      <Stack.Screen name="setup-complete" />
    </Stack>
  );
}

