import { Stack, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';
import { StudentBottomNavigation, AdminBottomNavigation } from '@/components/bottom-navigation';
import { View } from 'react-native';

export default function StudentLayout() {
  const { userInfo } = useSelection();
  const segments = useSegments();
  const redirectingRef = useRef(false);

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    // Don't redirect immediately on mount to avoid race conditions
    const timer = setTimeout(() => {
      // Check current route - if we're navigating to auth or onboarding, don't redirect
      const currentPath = `/${segments.join('/')}`;
      const isNavigatingToAuth = currentPath.startsWith('/(auth)');
      const isOnOnboarding = currentPath.startsWith('/(onboarding)');
      
      // Don't redirect if user is in onboarding flow
      if (isOnOnboarding) {
        return;
      }
      
      // Check if we're already on a valid student screen FIRST
      // This prevents unnecessary redirects when navigating between tabs
      // Use segments for more reliable checking
      const isOnPlanner = segments[0] === '(student)' && segments[1] === 'planner';
      const isOnSaved = segments[0] === '(student)' && segments[1] === 'saved';
      const isOnNotes = segments[0] === '(student)' && segments[1] === 'notes';
      const isOnAlerts = segments[0] === '(student)' && segments[1] === 'alerts';
      const isOnAccount = segments[0] === '(student)' && segments[1] === 'account';
      const isOnFolderContent = segments[0] === '(student)' && segments[1] === 'folder-content';
      const isOnPlannerFlow = segments[0] === '(student)' && segments[1] === '(planner-flow)';
      
      // If we're already on a valid student route, don't redirect at all
      if (isOnPlanner || isOnSaved || isOnNotes || isOnAlerts || isOnAccount || isOnFolderContent || isOnPlannerFlow) {
        return;
      }
      
      // Prevent multiple redirects in quick succession
      if (redirectingRef.current) {
        return;
      }
      
      // Only check authentication if we're not on a valid route
      if (!userInfo.fullName && !isNavigatingToAuth) {
        redirectingRef.current = true;
        router.replace(ROUTES.AUTH.WELCOME);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
        return;
      }
      
      // If userInfo is cleared and we're on a student route, we should have already navigated away
      if (!userInfo.fullName) {
        return; // Don't redirect if we're already navigating away
      }
      
      // Allow admins to access notes and account screens
      const isNotesOrAccount = isOnNotes || isOnAccount;
      
      // Check if we're navigating to admin routes (don't redirect if already navigating there)
      const isNavigatingToAdmin = currentPath.startsWith('/(admin)');
      
      // If userType is explicitly 'admin', redirect to admin dashboard (unless accessing notes/account or already navigating to admin)
      if (userInfo.userType === 'admin' && !isNotesOrAccount && !isNavigatingToAdmin) {
        redirectingRef.current = true;
        router.replace(ROUTES.ADMIN.DASHBOARD);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
        return;
      }
      
      // If userType is not set, check legacy method (for backwards compatibility)
      // Only treat as admin if all onboarding fields are empty AND userType is not 'student'
      if (!userInfo.userType && !userInfo.faculty && !userInfo.major && !userInfo.academicLevel) {
        // Could be admin or student who hasn't completed onboarding
        // Since we're in student layout, assume student (don't redirect)
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [userInfo, segments]);

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="planner" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="notes" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="account" />
        <Stack.Screen name="folder-content" />
        <Stack.Screen name="(planner-flow)" options={{ presentation: 'modal' }} />
      </Stack>
      {userInfo.userType === 'admin' ? (
        <AdminBottomNavigation />
      ) : (
        <StudentBottomNavigation />
      )}
    </View>
  );
}

