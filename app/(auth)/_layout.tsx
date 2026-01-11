import { Stack, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';

export default function AuthLayout() {
  const { userInfo } = useSelection();
  const segments = useSegments();

  useEffect(() => {
    // Only redirect if user is authenticated and we're not already on an auth screen
    // Don't redirect immediately to avoid race conditions with logout
    const timer = setTimeout(() => {
      // Check if we're on an auth screen, onboarding, or already in app - if so, don't redirect
      const currentPath = `/${segments.join('/')}`;
      const isOnAuthScreen = currentPath.startsWith('/(auth)');
      const isOnOnboarding = currentPath.startsWith('/(onboarding)');
      const isOnStudentRoute = currentPath.startsWith('/(student)');
      const isOnAdminRoute = currentPath.startsWith('/(admin)');
      
      // Don't redirect if user is in onboarding flow or already in app
      if (isOnOnboarding || isOnStudentRoute || isOnAdminRoute) {
        return;
      }
      
      // Only redirect if user is authenticated AND we're not on an auth screen
      // AND we're not already in the app (student/admin routes)
      if (userInfo.fullName && !isOnAuthScreen) {
        const isAdmin = userInfo.userType === 'admin';
        if (isAdmin) {
          router.replace(ROUTES.ADMIN.DASHBOARD);
        } else if (userInfo.userType === 'student' || userInfo.faculty) {
          router.replace(ROUTES.STUDENT.PLANNER);
        }
      }
    }, 300); // Increased delay to ensure state is cleared

    return () => clearTimeout(timer);
  }, [userInfo, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="student-session" />
      <Stack.Screen name="student-login" />
      <Stack.Screen name="admin-login" />
      <Stack.Screen name="admin-session" />
      <Stack.Screen name="new-member" />
    </Stack>
  );
}

