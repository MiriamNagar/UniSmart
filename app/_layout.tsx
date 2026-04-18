import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import '@/lib/firebase';
import { AuthProfileSync } from '@/components/auth-profile-sync';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializePushNotificationRuntime } from '@/lib/push-notification-runtime';
import { SelectionProvider } from '@/contexts/selection-context';
import { TabScrollProvider } from '@/contexts/tab-scroll-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useEffect(() => {
    void initializePushNotificationRuntime();
  }, []);

  return (
    <SelectionProvider>
      <TabScrollProvider>
      <AuthProfileSync>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(student)" options={{ headerShown: false }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      </AuthProfileSync>
      </TabScrollProvider>
    </SelectionProvider>
  );
}
