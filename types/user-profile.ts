/** Persisted user profile in Firestore at `users/{uid}`. */
export type UserRole = 'student' | 'admin';

export interface UserProfileDoc {
  role: UserRole;
  /** Firestore Timestamp — set on first write */
  createdAt?: unknown;
  /** Firestore Timestamp */
  updatedAt?: unknown;
}
