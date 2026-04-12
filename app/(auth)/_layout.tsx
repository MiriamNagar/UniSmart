import { Stack } from 'expo-router';
import { useAuthShellRoleGate } from '@/hooks/use-role-gate';

export default function AuthLayout() {
  useAuthShellRoleGate();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="student-session" />
      <Stack.Screen name="student-login" />
      <Stack.Screen name="admin-login" />
      <Stack.Screen name="admin-session" />
      <Stack.Screen name="new-member" />
    </Stack>
  );
}

