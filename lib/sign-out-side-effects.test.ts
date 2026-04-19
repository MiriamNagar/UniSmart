import { beforeFirebaseSignOut } from '@/lib/sign-out-side-effects';

describe('beforeFirebaseSignOut', () => {
  it('clears push token before sign-out', async () => {
    const clearPushToken = jest.fn<Promise<boolean>, []>().mockResolvedValue(true);
    const warn = jest.fn<void, [string, unknown]>();

    await expect(beforeFirebaseSignOut({ clearPushToken, warn })).resolves.toBeUndefined();
    expect(clearPushToken).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
  });

  it('does not block sign-out if token clearing fails', async () => {
    const clearPushToken = jest.fn<Promise<boolean>, []>().mockRejectedValue(new Error('boom'));
    const warn = jest.fn<void, [string, unknown]>();

    await expect(beforeFirebaseSignOut({ clearPushToken, warn })).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('does not block sign-out if token clearing hangs', async () => {
    const clearPushToken = jest.fn<Promise<boolean>, []>(
      () =>
        new Promise<boolean>(() => {
          // Intentionally unresolved to exercise timeout behavior.
        }),
    );
    const warn = jest.fn<void, [string, unknown]>();

    await expect(
      beforeFirebaseSignOut({
        clearPushToken,
        warn,
        timeoutMs: 1,
      }),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
