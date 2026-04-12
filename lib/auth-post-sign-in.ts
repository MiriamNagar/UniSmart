import type { User } from 'firebase/auth';
import { ROUTES } from '@/constants/routes';
import { ensureAdminProfile, ensureStudentProfile, getUserProfile } from '@/lib/user-profile-firestore';

/**
 * After Firebase sign-in on a role-specific login screen, resolves Firestore `role` and the home route.
 * Does not overwrite an existing opposite role (e.g. admin signing in via student screen → admin home).
 */
export async function resolvePostSignInNavigation(params: {
  firebaseUser: User;
  entry: 'student-login' | 'admin-login';
}): Promise<{ userType: 'student' | 'admin'; home: typeof ROUTES.STUDENT.PLANNER | typeof ROUTES.ADMIN.DASHBOARD }> {
  const uid = params.firebaseUser.uid;

  if (params.entry === 'student-login') {
    let profile = await getUserProfile(uid).catch(() => null);
    if (profile?.role === 'admin') {
      return { userType: 'admin', home: ROUTES.ADMIN.DASHBOARD };
    }
    if (!profile) {
      await ensureStudentProfile(uid);
      profile = await getUserProfile(uid).catch(() => null);
    }
    if (profile?.role === 'admin') {
      return { userType: 'admin', home: ROUTES.ADMIN.DASHBOARD };
    }
    return { userType: 'student', home: ROUTES.STUDENT.PLANNER };
  }

  let profile = await getUserProfile(uid).catch(() => null);
  if (profile?.role === 'student') {
    return { userType: 'student', home: ROUTES.STUDENT.PLANNER };
  }
  if (!profile) {
    await ensureAdminProfile(uid);
    profile = await getUserProfile(uid).catch(() => null);
  }
  if (profile?.role === 'student') {
    return { userType: 'student', home: ROUTES.STUDENT.PLANNER };
  }
  return { userType: 'admin', home: ROUTES.ADMIN.DASHBOARD };
}
