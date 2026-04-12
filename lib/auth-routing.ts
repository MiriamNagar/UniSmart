import { ROUTES } from '@/constants/routes';
import type { UserRole } from '@/types/user-profile';

/** Segments under `(student)` that only the student role may use (not admin). */
export function isStudentOnlyStudentSegment(second: string | undefined): boolean {
  if (!second) return false;
  if (second === '(planner-flow)') return true;
  return second === 'planner' || second === 'saved' || second === 'alerts';
}

/** Student routes admins may use (temporary shared notes/account; aligns with existing layouts). */
export function isSharedStudentSegment(second: string | undefined): boolean {
  return second === 'notes' || second === 'account' || second === 'folder-content';
}

/**
 * Path or deep-link URL → segment array like expo-router `useSegments()` for group routes.
 * Strips scheme (`unismart://`) and query string.
 */
export function parseAppPathSegments(pathOrUrl: string): string[] {
  let s = pathOrUrl.trim();
  const schemeIdx = s.indexOf('://');
  if (schemeIdx >= 0) {
    s = s.slice(schemeIdx + 3);
  }
  const q = s.indexOf('?');
  if (q >= 0) {
    s = s.slice(0, q);
  }
  const hash = s.indexOf('#');
  if (hash >= 0) {
    s = s.slice(0, hash);
  }
  return s.split('/').filter(Boolean);
}

/**
 * If the current role must not see this route group, returns the `router.replace` target.
 * Returns `null` when no correction is needed.
 */
export function getRoleRedirect(params: { role: UserRole | undefined; segments: string[] }): string | null {
  const { role, segments } = params;
  if (!role) {
    return null;
  }

  const group = segments[0];
  const second = segments[1];

  if (group === '(admin)') {
    if (role === 'student') {
      return ROUTES.STUDENT.PLANNER;
    }
    return null;
  }

  if (group === '(student)') {
    if (role !== 'admin') {
      return null;
    }
    if (!second) {
      return null;
    }
    if (isSharedStudentSegment(second)) {
      return null;
    }
    // Default-deny: any other `(student)/…` segment is not available to admins (FR8).
    return ROUTES.ADMIN.DASHBOARD;
  }

  return null;
}

/** Pure helper for tests and policy checks: `true` when the role may stay on this path. */
export function canAccessRoute(role: UserRole | undefined, pathnameOrUrl: string): boolean {
  const segments = parseAppPathSegments(pathnameOrUrl);
  return getRoleRedirect({ role, segments }) === null;
}
