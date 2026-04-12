import { router, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ROUTES } from '@/constants/routes';
import { useSelection } from '@/contexts/selection-context';
import { getRoleRedirect } from '@/lib/auth-routing';

/**
 * Auth stack: when the user is already signed in (has profile shell state), leave auth entry for the correct home.
 * Uses Firestore-backed `userInfo.userType` only (no faculty heuristic).
 */
export function useAuthShellRoleGate() {
  const { userInfo } = useSelection();
  const segments = useSegments();

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentPath = `/${segments.join('/')}`;
      const isOnAuthScreen = currentPath.startsWith('/(auth)');
      const isOnOnboarding = currentPath.startsWith('/(onboarding)');
      const isOnStudentRoute = currentPath.startsWith('/(student)');
      const isOnAdminRoute = currentPath.startsWith('/(admin)');

      if (isOnOnboarding || isOnStudentRoute || isOnAdminRoute) {
        return;
      }

      if (!userInfo.fullName || isOnAuthScreen) {
        return;
      }

      if (userInfo.userType === 'admin') {
        router.replace(ROUTES.ADMIN.DASHBOARD);
      } else if (userInfo.userType === 'student') {
        router.replace(ROUTES.STUDENT.PLANNER);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userInfo, segments]);

  /** If Auth has a display name but Firestore never resolved a role, leave auth entry (AC4 recovery). */
  useEffect(() => {
    if (!userInfo.fullName) {
      return;
    }
    if (userInfo.userType === 'student' || userInfo.userType === 'admin') {
      return;
    }
    const escape = setTimeout(() => {
      router.replace(ROUTES.AUTH.WELCOME);
    }, 3800);
    return () => clearTimeout(escape);
  }, [userInfo.fullName, userInfo.userType]);
}

/**
 * Student group shell: unauthenticated → welcome; cross-role → admin dashboard when appropriate.
 */
export function useStudentShellRoleGate() {
  const { userInfo } = useSelection();
  const segments = useSegments();
  const redirectingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentPath = `/${segments.join('/')}`;
      const isNavigatingToAuth = currentPath.startsWith('/(auth)');
      const isOnOnboarding = currentPath.startsWith('/(onboarding)');

      if (isOnOnboarding) {
        return;
      }

      if (redirectingRef.current) {
        return;
      }

      if (!userInfo.fullName && !isNavigatingToAuth) {
        redirectingRef.current = true;
        router.replace(ROUTES.AUTH.WELCOME);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
        return;
      }

      if (!userInfo.fullName) {
        return;
      }

      const target = getRoleRedirect({ role: userInfo.userType, segments });
      if (target) {
        redirectingRef.current = true;
        router.replace(target);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [userInfo, segments]);
}

/**
 * Admin group shell: unauthenticated → welcome; cross-role redirect via `getRoleRedirect`.
 */
export function useAdminShellRoleGate() {
  const { userInfo } = useSelection();
  const segments = useSegments();
  const redirectingRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentPath = `/${segments.join('/')}`;
      const isNavigatingToAuth = currentPath.startsWith('/(auth)');
      const isOnOnboarding = currentPath.startsWith('/(onboarding)');

      if (isOnOnboarding) {
        return;
      }

      if (redirectingRef.current) {
        return;
      }

      if (!userInfo.fullName && !isNavigatingToAuth) {
        redirectingRef.current = true;
        router.replace(ROUTES.AUTH.WELCOME);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
        return;
      }

      if (!userInfo.fullName) {
        return;
      }

      const target = getRoleRedirect({ role: userInfo.userType, segments });
      if (target) {
        redirectingRef.current = true;
        router.replace(target);
        setTimeout(() => {
          redirectingRef.current = false;
        }, 500);
        return;
      }

      const currentRoute = `/${segments.join('/')}`;
      const isOnDashboard =
        (segments[0] === '(admin)' && segments[1] === 'admin-dashboard') ||
        currentRoute === ROUTES.ADMIN.DASHBOARD ||
        currentRoute.startsWith(`${ROUTES.ADMIN.DASHBOARD}/`);

      const isOnNotes =
        (segments[0] === '(student)' && segments[1] === 'notes') ||
        currentRoute === ROUTES.STUDENT.NOTES ||
        currentRoute.startsWith(`${ROUTES.STUDENT.NOTES}/`);
      const isOnAccount =
        (segments[0] === '(student)' && segments[1] === 'account') ||
        currentRoute === ROUTES.STUDENT.ACCOUNT ||
        currentRoute.startsWith(`${ROUTES.STUDENT.ACCOUNT}/`);
      const isOnFolderContent =
        (segments[0] === '(student)' && segments[1] === 'folder-content') ||
        currentRoute === ROUTES.STUDENT.FOLDER_CONTENT ||
        currentRoute.startsWith(`${ROUTES.STUDENT.FOLDER_CONTENT}/`);

      if (isOnDashboard || isOnNotes || isOnAccount || isOnFolderContent) {
        return;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [userInfo, segments]);
}
