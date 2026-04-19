import type { UserRole } from '@/types/user-profile';

export const USER_PROFILE_COLLECTION = 'users';

export function userProfileDocPath(uid: string): string {
  return `${USER_PROFILE_COLLECTION}/${uid}`;
}

export function isUserRole(value: unknown): value is UserRole {
  return value === 'student' || value === 'admin';
}

function firestoreErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const c = (error as { code: unknown }).code;
    if (typeof c === 'string') return c;
  }
  return null;
}

/** User-facing copy for profile write failures (no raw Firebase dumps). Duck-types `code` like Auth helpers (tests avoid loading firebase/app ESM). */
export function mapUserProfileWriteErrorToMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'Firestore is not configured.') {
    return 'Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).';
  }
  const code = firestoreErrorCode(error);
  if (code) {
    switch (code) {
      case 'permission-denied':
        return 'Could not save your profile. Check your connection or try again.';
      case 'unavailable':
        return 'Could not save your profile right now. Check your connection and try again.';
      case 'deadline-exceeded':
        return 'Saving your profile took too long. Try again.';
      default:
        if (code.startsWith('firestore/') || code === 'failed-precondition') {
          return 'Could not save your profile. Please try again.';
        }
    }
  }
  return 'Could not save your profile. Please try again.';
}
