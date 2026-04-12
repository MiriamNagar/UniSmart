import type { UserProfileDoc } from '@/types/user-profile';
import { isUserRole } from '@/lib/user-profile-helpers';

function readTrimmedString(data: Record<string, unknown>, key: string): string | undefined {
  const v = data[key];
  if (typeof v !== 'string') {
    return undefined;
  }
  const t = v.trim();
  return t === '' ? undefined : t;
}

/**
 * Maps raw Firestore document data to {@link UserProfileDoc} (role + optional passport fields).
 */
export function mapFirestoreDataToUserProfile(data: Record<string, unknown>): UserProfileDoc | null {
  const role = data.role;
  if (!isUserRole(role)) {
    return null;
  }
  return {
    role,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    fullName: readTrimmedString(data, 'fullName'),
    age: readTrimmedString(data, 'age'),
    faculty: readTrimmedString(data, 'faculty'),
    major: readTrimmedString(data, 'major'),
    academicLevel: readTrimmedString(data, 'academicLevel'),
  };
}
