/** Persisted user profile in Firestore at `users/{uid}`. */
export type UserRole = 'student' | 'admin';

export interface UserProfileDoc {
  role: UserRole;
  /** Firestore Timestamp — set on first write */
  createdAt?: unknown;
  /** Firestore Timestamp */
  updatedAt?: unknown;
  /** Student passport / identity — optional until onboarding completes */
  fullName?: string;
  /** ISO date string (YYYY-MM-DD). */
  birthDate?: string;
  /** Legacy field kept for compatibility with older seeded profiles. */
  age?: string;
  /** Department (faculty) */
  faculty?: string;
  /** Program / major */
  major?: string;
  academicLevel?: string;
}

/** Subset merged into `users/{uid}` alongside `role` (owner-only writes; see firestore.rules). */
export type UserPassportMerge = Partial<
  Pick<UserProfileDoc, 'fullName' | 'birthDate' | 'age' | 'faculty' | 'major' | 'academicLevel'>
>;
