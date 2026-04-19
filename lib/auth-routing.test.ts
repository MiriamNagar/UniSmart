import { ROUTES } from '@/constants/routes';
import {
  canAccessRoute,
  getRoleRedirect,
  isSharedStudentSegment,
  isStudentOnlyStudentSegment,
  parseAppPathSegments,
} from '@/lib/auth-routing';

describe('parseAppPathSegments', () => {
  it('strips scheme and query', () => {
    expect(parseAppPathSegments('unismart:///(student)/planner?x=1')).toEqual(['(student)', 'planner']);
  });

  it('accepts leading slash path', () => {
    expect(parseAppPathSegments('/(admin)/admin-dashboard')).toEqual(['(admin)', 'admin-dashboard']);
  });

  it('normalizes no leading slash', () => {
    expect(parseAppPathSegments('(student)/saved/')).toEqual(['(student)', 'saved']);
  });
});

describe('isStudentOnlyStudentSegment / isSharedStudentSegment', () => {
  it('marks planner-flow as student-only', () => {
    expect(isStudentOnlyStudentSegment('(planner-flow)')).toBe(true);
  });

  it('marks notes as shared', () => {
    expect(isSharedStudentSegment('notes')).toBe(true);
    expect(isStudentOnlyStudentSegment('notes')).toBe(false);
  });
});

describe('getRoleRedirect', () => {
  it('sends student away from admin group', () => {
    expect(
      getRoleRedirect({ role: 'student', segments: ['(admin)', 'admin-dashboard'] }),
    ).toBe(ROUTES.STUDENT.PLANNER);
  });

  it('allows student on student planner', () => {
    expect(getRoleRedirect({ role: 'student', segments: ['(student)', 'planner'] })).toBeNull();
  });

  it('sends admin away from student-only tabs', () => {
    expect(getRoleRedirect({ role: 'admin', segments: ['(student)', 'planner'] })).toBe(
      ROUTES.ADMIN.DASHBOARD,
    );
    expect(getRoleRedirect({ role: 'admin', segments: ['(student)', '(planner-flow)', 'course-selection'] })).toBe(
      ROUTES.ADMIN.DASHBOARD,
    );
  });

  it('sends admin away from unknown student child routes (default-deny)', () => {
    expect(getRoleRedirect({ role: 'admin', segments: ['(student)', 'future-feature'] })).toBe(
      ROUTES.ADMIN.DASHBOARD,
    );
  });

  it('allows admin on shared student routes', () => {
    expect(getRoleRedirect({ role: 'admin', segments: ['(student)', 'notes'] })).toBeNull();
    expect(getRoleRedirect({ role: 'admin', segments: ['(student)', 'account'] })).toBeNull();
  });

  it('returns null when role is undefined', () => {
    expect(getRoleRedirect({ role: undefined, segments: ['(admin)', 'admin-dashboard'] })).toBeNull();
  });
});

describe('canAccessRoute', () => {
  it('matches getRoleRedirect', () => {
    expect(canAccessRoute('student', '/(admin)/admin-dashboard')).toBe(false);
    expect(canAccessRoute('admin', '/(student)/planner')).toBe(false);
    expect(canAccessRoute('admin', '/(student)/notes')).toBe(true);
    expect(canAccessRoute('admin', '/(student)/unknown-route')).toBe(false);
  });
});
