import type { User } from 'firebase/auth';
import { ROUTES } from '@/constants/routes';
import { ensureAdminProfile, ensureStudentProfile, getUserProfile } from '@/lib/user-profile-firestore';

export type PostSignInEntry = 'student-login' | 'admin-login' | 'profile';

export type PostSignInNavigation = {
  userType: 'student' | 'admin';
  home: typeof ROUTES.STUDENT.PLANNER | typeof ROUTES.ADMIN.DASHBOARD;
};

/** Thrown when `entry === 'profile'` but Firestore has no `student`/`admin` role yet. */
export const AUTH_POST_SIGN_IN_MISSING_PROFILE = 'AUTH_POST_SIGN_IN_MISSING_PROFILE';

/**
 * After Firebase sign-in: student/admin entry points force or promote role; unified `profile` reads Firestore only.
 */
export async function resolvePostSignInNavigation(params: {
  firebaseUser: User;
  entry: PostSignInEntry;
}): Promise<PostSignInNavigation> {
  const uid = params.firebaseUser.uid;

  if (params.entry === 'student-login') {
    await ensureStudentProfile(uid, { force: true });
    return { userType: 'student', home: ROUTES.STUDENT.PLANNER };
  }

  if (params.entry === 'profile') {
    const profile = await getUserProfile(uid).catch(() => null);
    if (profile?.role === 'admin') {
      return { userType: 'admin', home: ROUTES.ADMIN.DASHBOARD };
    }
    if (profile?.role === 'student') {
      return { userType: 'student', home: ROUTES.STUDENT.PLANNER };
    }
    throw new Error(AUTH_POST_SIGN_IN_MISSING_PROFILE);
  }

  // admin-login: persist `role: admin` (promotes prior student docs) and always land in admin.
  const profile = await getUserProfile(uid).catch(() => null);
  if (profile?.role !== 'admin') {
    await ensureAdminProfile(uid);
  }
  return { userType: 'admin', home: ROUTES.ADMIN.DASHBOARD };
}
