import type { User } from 'firebase/auth';
import { ROUTES } from '@/constants/routes';
import {
  AUTH_POST_SIGN_IN_MISSING_PROFILE,
  resolvePostSignInNavigation,
} from '@/lib/auth-post-sign-in';
import * as UserProfileFirestore from '@/lib/user-profile-firestore';

jest.mock('@/lib/user-profile-firestore', () => ({
  getUserProfile: jest.fn(),
  ensureStudentProfile: jest.fn(),
  ensureAdminProfile: jest.fn(),
}));

const mockUser = { uid: 'test-uid-1' } as User;

describe('resolvePostSignInNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('profile entry routes admin by Firestore role', async () => {
    (UserProfileFirestore.getUserProfile as jest.Mock).mockResolvedValueOnce({ role: 'admin' });
    const nav = await resolvePostSignInNavigation({ firebaseUser: mockUser, entry: 'profile' });
    expect(nav).toEqual({ userType: 'admin', home: ROUTES.ADMIN.DASHBOARD });
    expect(UserProfileFirestore.ensureStudentProfile).not.toHaveBeenCalled();
    expect(UserProfileFirestore.ensureAdminProfile).not.toHaveBeenCalled();
  });

  it('profile entry routes student by Firestore role', async () => {
    (UserProfileFirestore.getUserProfile as jest.Mock).mockResolvedValueOnce({ role: 'student' });
    const nav = await resolvePostSignInNavigation({ firebaseUser: mockUser, entry: 'profile' });
    expect(nav).toEqual({ userType: 'student', home: ROUTES.STUDENT.PLANNER });
  });

  it('profile entry throws when no profile role', async () => {
    (UserProfileFirestore.getUserProfile as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      resolvePostSignInNavigation({ firebaseUser: mockUser, entry: 'profile' }),
    ).rejects.toThrow(AUTH_POST_SIGN_IN_MISSING_PROFILE);
  });
});
