import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useRef, type ReactNode } from 'react';
import { useSelection } from '@/contexts/selection-context';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { getRoleRedirect, parseAppPathSegments } from '@/lib/auth-routing';
import { getUserProfile } from '@/lib/user-profile-firestore';
import type { UserProfileDoc } from '@/types/user-profile';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Retries on thrown errors; one delayed re-read after null for eventual consistency (AC4 / offline). */
async function loadUserProfileResilient(uid: string): Promise<UserProfileDoc | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        return profile;
      }
      break;
    } catch {
      if (attempt < 2) {
        await delay(200 * 2 ** attempt);
      }
    }
  }
  await delay(450);
  try {
    return await getUserProfile(uid);
  } catch {
    return null;
  }
}

const emptyUserInfo = {
  fullName: '',
  age: '',
  faculty: '',
  major: '',
  academicLevel: '',
  userType: undefined as undefined | 'student' | 'admin',
};

/**
 * Single `onAuthStateChanged` subscription: loads Firestore `role` into SelectionContext after Auth.
 * Deep links (`unismart://`): same role-vs-segment check as shell layouts when a URL opens the app.
 */
export function AuthProfileSync({ children }: { children: ReactNode }) {
  const { setUserInfo, userInfo } = useSelection();
  const userInfoRef = useRef(userInfo);
  userInfoRef.current = userInfo;
  const router = useRouter();

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUserInfo({ ...emptyUserInfo });
        return;
      }

      const display =
        user.displayName?.trim() || (user.email?.split('@')[0] ?? '').trim() || '';

      try {
        const profile = await loadUserProfileResilient(user.uid);
        if (!profile) {
          setUserInfo({
            ...userInfoRef.current,
            fullName: userInfoRef.current.fullName || display,
            userType: undefined,
          });
          return;
        }
        setUserInfo({
          ...userInfoRef.current,
          fullName: userInfoRef.current.fullName || display,
          userType: profile.role,
        });
      } catch {
        setUserInfo({
          ...userInfoRef.current,
          fullName: userInfoRef.current.fullName || display,
          userType: undefined,
        });
      }
    });

    return () => unsub();
  }, [setUserInfo]);

  const role = userInfo.userType;

  useEffect(() => {
    const runGuard = (url: string) => {
      if (!role) {
        return;
      }
      const parsed = Linking.parse(url);
      const path = parsed.path ?? url;
      const segs = parseAppPathSegments(path.startsWith('/') ? path : `/${path}`);
      const target = getRoleRedirect({ role, segments: segs });
      if (target) {
        router.replace(target);
      }
    };

    const sub = Linking.addEventListener('url', ({ url }) => {
      runGuard(url);
    });

    void Linking.getInitialURL().then((initial) => {
      if (initial) {
        runGuard(initial);
      }
    });

    return () => sub.remove();
  }, [role, router]);

  return <>{children}</>;
}
