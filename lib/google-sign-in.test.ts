import { mapGoogleSignInFlowErrorToMessage, GOOGLE_SIGN_IN_CANCELLED_CODE } from './google-sign-in-error-message';

function authError(code: string) {
  return { code, message: 'x', name: 'FirebaseError' };
}

describe('mapGoogleSignInFlowErrorToMessage', () => {
  it('maps custom cancellation code', () => {
    expect(mapGoogleSignInFlowErrorToMessage({ code: GOOGLE_SIGN_IN_CANCELLED_CODE })).toMatch(/cancelled/i);
  });

  it('delegates Firebase auth errors to mapFirebaseAuthErrorToMessage', () => {
    expect(mapGoogleSignInFlowErrorToMessage({ code: 'auth/network-request-failed' })).toMatch(/Network/i);
  });

  it('passes registration flow to Firebase mapper for generic errors', () => {
    expect(mapGoogleSignInFlowErrorToMessage(authError('auth/unknown-code'), { flow: 'sign-up' })).toMatch(
      /Registration could not complete.*auth\/unknown-code/i,
    );
  });

  it('maps Android DEVELOPER_ERROR / code 10 to configuration guidance', () => {
    expect(mapGoogleSignInFlowErrorToMessage({ code: '10', message: 'x' }, { flow: 'sign-up' })).toMatch(/SHA-1/i);
    expect(
      mapGoogleSignInFlowErrorToMessage(new Error('com.google.android.gms.common.api.ApiException: 10'), {
        flow: 'sign-up',
      }),
    ).toMatch(/SHA-1/i);
  });

  it('appends setup hint when Firebase mapping is fully generic', () => {
    expect(mapGoogleSignInFlowErrorToMessage(new Error('oops'), { flow: 'sign-up' })).toMatch(
      /SHA-1|Sign-in methods/i,
    );
  });

  it('maps missing web client id configuration message', () => {
    expect(
      mapGoogleSignInFlowErrorToMessage(new Error('Google sign-in requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID')),
    ).toMatch(/EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID/i);
  });
});

describe('signInWithGoogle (native wiring)', () => {
  const signInWithCredential = jest.fn(() => Promise.resolve({ user: { uid: 'u1' } }));

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    signInWithCredential.mockResolvedValue({ user: { uid: 'u1' } });

    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: {
        expoConfig: {
          extra: { googleWebClientId: '123-abc.apps.googleusercontent.com' },
        },
      },
    }));

    jest.doMock('@react-native-google-signin/google-signin', () => ({
      GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn(() => Promise.resolve(true)),
        signIn: jest.fn(() =>
          Promise.resolve({
            type: 'success',
            data: {
              idToken: 'mock-id-token',
              scopes: [],
              serverAuthCode: null,
              user: {
                id: '1',
                email: 'a@b.com',
                familyName: null,
                givenName: null,
                name: null,
                photo: null,
              },
            },
          }),
        ),
        getTokens: jest.fn(() => Promise.resolve({ idToken: 'from-getTokens', accessToken: '' })),
      },
    }));

    jest.doMock('firebase/auth', () => ({
      GoogleAuthProvider: {
        credential: jest.fn(() => ({ providerId: 'google.com' })),
      },
      signInWithCredential,
    }));

    jest.doMock('react-native', () => ({
      Platform: { OS: 'android' },
    }));
  });

  it('calls signInWithCredential with auth and a Google credential', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- fresh module after resetModules + doMock
    const { signInWithGoogle } = require('./google-sign-in');
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    const auth = { app: { name: '[DEFAULT]' } };
    await signInWithGoogle(auth);
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
    expect(signInWithCredential).toHaveBeenCalledWith(
      auth,
      expect.objectContaining({ providerId: 'google.com' }),
    );
    expect(GoogleSignin.getTokens).not.toHaveBeenCalled();
  });
});
