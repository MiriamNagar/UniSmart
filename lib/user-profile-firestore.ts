import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserPassportMerge, UserProfileDoc, UserRole } from '@/types/user-profile';
import { auth, db } from '@/lib/firebase';
import { mapFirestoreDataToUserProfile } from '@/lib/map-firestore-user-profile';
import { USER_PROFILE_COLLECTION } from '@/lib/user-profile-helpers';

export {
  isUserRole,
  mapUserProfileWriteErrorToMessage,
  userProfileDocPath,
  USER_PROFILE_COLLECTION,
} from '@/lib/user-profile-helpers';

export { mapFirestoreDataToUserProfile } from '@/lib/map-firestore-user-profile';

/**
 * Merges passport / identity fields into `users/{uid}` (owner must match; see Firestore rules).
 */
export async function mergeUserPassport(uid: string, partial: UserPassportMerge): Promise<void> {
  if (!uid.trim()) {
    throw new Error('User id is required.');
  }
  if (!db) {
    throw new Error('Firestore is not configured.');
  }
  const keys = ['fullName', 'age', 'faculty', 'major', 'academicLevel'] as const;
  const payload: Record<string, unknown> = {};
  for (const k of keys) {
    if (k in partial && partial[k] !== undefined) {
      const v = partial[k];
      payload[k] = typeof v === 'string' ? v.trim() : v;
    }
  }
  if (Object.keys(payload).length === 0) {
    return;
  }
  const ref = doc(db, USER_PROFILE_COLLECTION, uid);
  payload.updatedAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
}

/**
 * Reads `users/{uid}`. Returns `null` if missing or `role` is not a valid `UserRole`.
 */
export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  if (!uid.trim()) {
    return null;
  }
  if (!db) {
    return null;
  }
  const ref = doc(db, USER_PROFILE_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists) {
    return null;
  }
  const raw = snap.data();
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  return mapFirestoreDataToUserProfile(raw as Record<string, unknown>);
}

export type EnsureStudentProfileOptions = {
  /**
   * Student login screen only: always write `role: 'student'` (overwrites admin).
   * Registration / new-member flows omit this so an existing admin doc is not downgraded by mistake.
   */
  force?: boolean;
};

/**
 * Ensures `users/{uid}` exists with `role: 'student'` (merge upsert).
 * Does **not** downgrade an existing **`admin`** profile unless `force` is true (see {@link EnsureStudentProfileOptions}).
 */
export async function ensureStudentProfile(uid: string, options?: EnsureStudentProfileOptions): Promise<void> {
  if (!uid.trim()) {
    throw new Error('User id is required.');
  }
  if (!db) {
    throw new Error('Firestore is not configured.');
  }
  if (auth?.currentUser?.uid === uid) {
    await auth.currentUser.getIdToken();
  }
  const ref = doc(db, USER_PROFILE_COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!options?.force && snap.exists) {
    const raw = snap.data();
    const role = raw && typeof raw === 'object' ? (raw as { role?: unknown }).role : undefined;
    if (role === 'admin') {
      return;
    }
  }
  const partial: Partial<UserProfileDoc> & Record<string, unknown> = {
    role: 'student' as UserRole,
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists) {
    partial.createdAt = serverTimestamp();
  }
  await setDoc(ref, partial, { merge: true });
}

/**
 * Persists admin role for the signed-in user at `users/{uid}` (merge upsert).
 * MVP: client-written `role` is trusted for UX; tighten with claims/server later.
 *
 * **Recovery (MVP):** If this fails after Auth succeeded, callers must not treat onboarding as complete.
 * On a later sign-in, invoke again (e.g. from the auth gate in Story 1.6) so `role` is written.
 */
export async function ensureAdminProfile(uid: string): Promise<void> {
  if (!uid.trim()) {
    throw new Error('User id is required.');
  }
  if (!db) {
    throw new Error('Firestore is not configured.');
  }
  if (auth?.currentUser?.uid === uid) {
    await auth.currentUser.getIdToken();
  }
  const ref = doc(db, USER_PROFILE_COLLECTION, uid);
  const snap = await getDoc(ref);
  const partial: Partial<UserProfileDoc> & Record<string, unknown> = {
    role: 'admin',
    updatedAt: serverTimestamp(),
  };
  if (!snap.exists) {
    partial.createdAt = serverTimestamp();
  }
  await setDoc(ref, partial, { merge: true });
}
