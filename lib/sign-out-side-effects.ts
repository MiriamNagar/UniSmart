/**
 * Side effects that must run as part of signing out (Account flow and any future entry points).
 *
 * **Epic 5 (push notifications):** Register device token removal or server-side invalidation
 * here so it stays aligned with `firebase/auth` `signOut`. Until that work exists, this hook is a
 * no-op and sign-out still clears the Firebase session from the client.
 */
export async function beforeFirebaseSignOut(): Promise<void> {
  // Epic 5: clear local push registration / notify backend before auth session ends.
}
