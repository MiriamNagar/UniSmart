import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserProfileDoc } from '@/types/user-profile';
import { db } from '@/lib/firebase';
import { USER_PROFILE_COLLECTION } from '@/lib/user-profile-helpers';

export {
  isUserRole,
  mapUserProfileWriteErrorToMessage,
  userProfileDocPath,
  USER_PROFILE_COLLECTION,
} from '@/lib/user-profile-helpers';

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
