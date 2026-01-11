import { Stack, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';
import { AdminBottomNavigation } from '@/components/bottom-navigation';
import { View } from 'react-native';

export default function AdminLayout() {
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
      
      // Check if we're already on a valid admin screen FIRST
      // This prevents unnecessary redirects when navigating between tabs
      const currentRoute = `/${segments.join('/')}`;
      
      // Check if we're on the admin dashboard - use segments for more reliable check
      const isOnDashboard = (segments[0] === '(admin)' && segments[1] === 'admin-dashboard') ||
                           currentRoute === ROUTES.ADMIN.DASHBOARD || 
                           currentRoute.startsWith(ROUTES.ADMIN.DASHBOARD + '/');
      
      // Check if we're on notes or account (which admins can access)
      const isOnNotes = (segments[0] === '(student)' && segments[1] === 'notes') ||
                       currentRoute === ROUTES.STUDENT.NOTES || 
                       currentRoute.startsWith(ROUTES.STUDENT.NOTES + '/');
      const isOnAccount = (segments[0] === '(student)' && segments[1] === 'account') ||
                         currentRoute === ROUTES.STUDENT.ACCOUNT || 
                         currentRoute.startsWith(ROUTES.STUDENT.ACCOUNT + '/');
      const isOnFolderContent = (segments[0] === '(student)' && segments[1] === 'folder-content') ||
                               currentRoute === ROUTES.STUDENT.FOLDER_CONTENT || 
                               currentRoute.startsWith(ROUTES.STUDENT.FOLDER_CONTENT + '/');
      
      // If we're already on a valid admin route, don't redirect at all
      if (isOnDashboard || isOnNotes || isOnAccount || isOnFolderContent) {
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
      
      // If userInfo is cleared and we're on an admin route, we should have already navigated away
      if (!userInfo.fullName) {
        return; // Don't redirect if we're already navigating away
      }
      
      // If userType is explicitly 'student', redirect to student planner
      if (userInfo.userType === 'student') {
        redirectingRef.current = true;
        router.replace(ROUTES.STUDENT.PLANNER);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
        return;
      }
      
      // If userType is not set, check legacy method (for backwards compatibility)
      // Only treat as student if they have onboarding data OR userType is 'student'
      if (!userInfo.userType && (userInfo.faculty || userInfo.major || userInfo.academicLevel)) {
        // Has student data, redirect to student planner
        redirectingRef.current = true;
        router.replace(ROUTES.STUDENT.PLANNER);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
        return;
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
        <Stack.Screen name="admin-dashboard" />
      </Stack>
      <AdminBottomNavigation />
    </View>
  );
}

