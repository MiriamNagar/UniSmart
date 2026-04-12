import { beforeFirebaseSignOut } from '@/lib/sign-out-side-effects';

describe('beforeFirebaseSignOut', () => {
  it('resolves (placeholder until Epic 5 push token clearing)', async () => {
    await expect(beforeFirebaseSignOut()).resolves.toBeUndefined();
  });
});
