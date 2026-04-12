import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useState } from 'react';
import { ROUTES } from '@/constants/routes';
import { useSelection } from '@/contexts/selection-context';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { mapFirebaseAuthErrorToMessage } from '@/lib/firebase-auth-error-message';
import {
  isEmailPasswordAuthFormValid,
  isValidAuthEmail,
  isValidAuthPassword,
} from '@/lib/email-password-auth-validation';
import { googleSignInUnavailableReason, isGoogleSignInAvailableOnThisRuntime } from '@/lib/google-sign-in-config';
import { mapGoogleSignInFlowErrorToMessage } from '@/lib/google-sign-in-error-message';
import { signInWithGoogle } from '@/lib/google-sign-in';
import {
  AUTH_POST_SIGN_IN_MISSING_PROFILE,
  resolvePostSignInNavigation,
} from '@/lib/auth-post-sign-in';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const { setUserInfo, userInfo } = useSelection();

  const configOk = isFirebaseConfigured() && auth !== undefined;
  const formValid = isEmailPasswordAuthFormValid(email, password);
  const canSubmit = configOk && formValid && !isSigningIn && !isGoogleSigningIn;
  const googleHint = configOk ? googleSignInUnavailableReason() : null;
  const canUseGoogle = configOk && isGoogleSignInAvailableOnThisRuntime() && !isSigningIn && !isGoogleSigningIn;

  const emailHint =
    email.length > 0 && !isValidAuthEmail(email)
      ? 'Use your full institutional email (check @ and domain).'
      : null;
  const passwordHint =
    password.length > 0 && !isValidAuthPassword(password)
      ? 'Password must be at least 6 characters.'
      : null;

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn || isSigningIn) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        'Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
      );
      return;
    }

    if (!auth) {
      setSubmitError(
        'Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
      );
      return;
    }

    if (!isGoogleSignInAvailableOnThisRuntime()) {
      setSubmitError(
        googleSignInUnavailableReason() ??
          'Google sign-in is not available. Check configuration (see README).',
      );
      return;
    }

    setIsGoogleSigningIn(true);
    try {
      const cred = await signInWithGoogle(auth);
      const u = cred.user;
      const display =
        u.displayName?.trim() || (u.email?.split('@')[0] ?? '').trim() || 'User';

      try {
        const nav = await resolvePostSignInNavigation({ firebaseUser: u, entry: 'profile' });
        setUserInfo({
          ...userInfo,
          fullName: userInfo.fullName || display,
          userType: nav.userType,
        });
        router.replace(nav.home);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === AUTH_POST_SIGN_IN_MISSING_PROFILE) {
          setSubmitError(
            'No UniSmart profile for this Google account yet. Use Create account, or sign in with the method you used to register.',
          );
        } else {
          setSubmitError('Could not open the next screen. Please try again.');
        }
      }
    } catch (e: unknown) {
      setSubmitError(mapGoogleSignInFlowErrorToMessage(e));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleAuthenticate = async () => {
    if (isSigningIn || isGoogleSigningIn) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        'Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
      );
      return;
    }

    if (!formValid) {
      return;
    }

    if (!auth) {
      setSubmitError(
        'Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
      );
      return;
    }

    setIsSigningIn(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      const trimmed = email.trim();
      const nameFromEmail = trimmed.split('@')[0] || 'User';
      try {
        const nav = await resolvePostSignInNavigation({
          firebaseUser: cred.user,
          entry: 'profile',
        });
        setUserInfo({
          ...userInfo,
          fullName: userInfo.fullName || nameFromEmail,
          userType: nav.userType,
        });
        router.replace(nav.home);
      } catch (e: unknown) {
        if (e instanceof Error && e.message === AUTH_POST_SIGN_IN_MISSING_PROFILE) {
          setSubmitError(
            'No UniSmart profile for this email yet. Create an account first, then complete onboarding.',
          );
        } else {
          setSubmitError('Could not open the next screen. Please try again.');
        }
      }
    } catch (e: unknown) {
      setSubmitError(mapFirebaseAuthErrorToMessage(e));
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
        accessibilityLabel="Go back">
        <MaterialIcons name="chevron-left" size={28} color="#9B9B9B" />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <ThemedText style={styles.title} accessibilityRole="header">
          Sign in
        </ThemedText>

        <ThemedText style={styles.subtitle}>
          We open the student or admin app based on the role saved for your account.
        </ThemedText>

        {!configOk ? (
          <ThemedText
            style={styles.configBanner}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            Sign-in requires Firebase configuration. Add EXPO_PUBLIC_FIREBASE_* values (see README). The Authenticate
            button stays disabled until then.
          </ThemedText>
        ) : null}

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>UNIVERSITY EMAIL</ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setSubmitError(null);
            }}
            placeholder="you@university.edu"
            placeholderTextColor="#9B9B9B"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="username"
            editable={!isSigningIn && !isGoogleSigningIn}
            accessibilityLabel="University email"
          />
          {emailHint ? (
            <ThemedText style={styles.fieldHint} accessibilityLiveRegion="polite">
              {emailHint}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>PASSWORD</ThemedText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setSubmitError(null);
            }}
            placeholder="........"
            placeholderTextColor="#9B9B9B"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            editable={!isSigningIn && !isGoogleSigningIn}
            accessibilityLabel="Password"
          />
          {passwordHint ? (
            <ThemedText style={styles.fieldHint} accessibilityLiveRegion="polite">
              {passwordHint}
            </ThemedText>
          ) : null}
        </View>

        {submitError ? (
          <ThemedText
            style={styles.submitError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {submitError}
          </ThemedText>
        ) : null}

        <TouchableOpacity
          style={[styles.authenticateButton, (!canSubmit || isSigningIn) && styles.authenticateButtonDisabled]}
          activeOpacity={canSubmit && !isSigningIn ? 0.8 : 1}
          onPress={() => {
            void handleAuthenticate();
          }}
          disabled={!canSubmit || isSigningIn}
          accessibilityLabel="Authenticate"
          accessibilityState={{ disabled: !canSubmit || isSigningIn }}>
          {isSigningIn ? (
            <ActivityIndicator color="#FFFFFF" accessibilityLabel="Signing in" />
          ) : (
            <ThemedText
              style={[
                styles.authenticateButtonText,
                (!canSubmit || isSigningIn) && styles.authenticateButtonTextDisabled,
              ]}>
              AUTHENTICATE
            </ThemedText>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.inlineLink}
          onPress={() => router.push(ROUTES.AUTH.CREATE_ACCOUNT)}
          accessibilityRole="button"
          accessibilityLabel="Go to create account">
          <ThemedText style={styles.inlineLinkText}>New here? Create an account</ThemedText>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>OR</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        {googleHint ? (
          <ThemedText
            style={styles.googleConfigHint}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {googleHint}
          </ThemedText>
        ) : null}

        <TouchableOpacity
          style={[styles.googleButton, !canUseGoogle && styles.googleButtonDisabled]}
          activeOpacity={canUseGoogle ? 0.8 : 1}
          disabled={!canUseGoogle}
          onPress={() => {
            void handleGoogleSignIn();
          }}
          accessibilityLabel="Continue with Google"
          accessibilityState={{ disabled: !canUseGoogle }}>
          {isGoogleSigningIn ? (
            <ActivityIndicator color="#1A1A1A" accessibilityLabel="Signing in with Google" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleIcon}
                resizeMode="contain"
              />
              <ThemedText style={!canUseGoogle ? styles.googleButtonTextMuted : styles.googleButtonText}>
                Continue with Google
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1,
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 16,
    color: '#9B9B9B',
    marginBottom: 24,
    textAlign: 'center',
    width: '100%',
  },
  configBanner: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
    fontSize: 14,
    color: '#B45309',
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  fieldHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#9B9B9B',
  },
  submitError: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
  },
  authenticateButton: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  authenticateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  authenticateButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  authenticateButtonTextDisabled: {
    color: '#9B9B9B',
  },
  inlineLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  inlineLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5B4C9D',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 14,
    color: '#9B9B9B',
    marginHorizontal: 16,
    fontWeight: '500',
  },
  googleButton: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  googleButtonDisabled: {
    opacity: 0.55,
  },
  googleConfigHint: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
    fontSize: 13,
    color: '#B45309',
    textAlign: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonTextMuted: {
    color: '#9B9B9B',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
});
