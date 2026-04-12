import type { User } from 'firebase/auth';
import { ROUTES } from '@/constants/routes';
import { ensureAdminProfile, ensureStudentProfile, getUserProfile } from '@/lib/user-profile-firestore';

/**
 * After Firebase sign-in on a role-specific login screen, persists `role` and the home route.
 * Student and admin entry points are separate: student login always student + planner; admin login always admin + dashboard.
 */
export async function resolvePostSignInNavigation(params: {
  firebaseUser: User;
  entry: 'student-login' | 'admin-login';
}): Promise<{ userType: 'student' | 'admin'; home: typeof ROUTES.STUDENT.PLANNER | typeof ROUTES.ADMIN.DASHBOARD }> {
  const uid = params.firebaseUser.uid;

  if (params.entry === 'student-login') {
    await ensureStudentProfile(uid, { force: true });
    return { userType: 'student', home: ROUTES.STUDENT.PLANNER };
  }

  // Admin login screen: persist `role: admin` (promotes prior student docs) and always land in admin.
  const profile = await getUserProfile(uid).catch(() => null);
  if (profile?.role !== 'admin') {
    await ensureAdminProfile(uid);
  }
  return { userType: 'admin', home: ROUTES.ADMIN.DASHBOARD };
}
