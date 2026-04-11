import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function NewMemberScreen() {
  const { userType } = useLocalSearchParams<{ userType?: string }>();
  const isAdmin = userType === 'admin';
  const { setUserInfo, userInfo } = useSelection();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  /** Same rules as Firebase email/password sign-in (valid email + 6+ chars). */
  const formValid = isEmailPasswordAuthFormValid(email, password);
  const configOk = isFirebaseConfigured() && auth !== undefined;
  const canSubmit = configOk && formValid && !isRegistering && !isGoogleSigningIn;
  const googleHint = configOk ? googleSignInUnavailableReason() : null;
  const canUseGoogle =
    configOk && isGoogleSignInAvailableOnThisRuntime() && !isRegistering && !isGoogleSigningIn;

  const emailHint =
    email.length > 0 && !isValidAuthEmail(email)
      ? 'Use your full institutional email (check @ and domain).'
      : null;
  const passwordHint =
    password.length > 0 && !isValidAuthPassword(password)
      ? 'Password must be at least 6 characters.'
      : null;

  const handleGoogleContinue = async () => {
    if (isGoogleSigningIn || isRegistering) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        'Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
      );
      return;
    }

    if (!auth) {
      setSubmitError(
        'Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
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

    /** Already signed in (e.g. just registered with email/password). Do not call Google again — it conflicts and yields a generic Firebase error. */
    if (auth.currentUser) {
      const u = auth.currentUser;
      const display =
        u.displayName?.trim() || (u.email?.split('@')[0] ?? '').trim() || (isAdmin ? 'Admin' : 'Student');
      setUserInfo({
        ...userInfo,
        fullName: userInfo.fullName || display,
        userType: isAdmin ? 'admin' : 'student',
      });
      router.push({ pathname: ROUTES.ONBOARDING.IDENTITY_HUB, params: { userType: userType || 'student' } });
      return;
    }

    setIsGoogleSigningIn(true);
    try {
      const cred = await signInWithGoogle(auth);
      const u = cred.user;
      const display =
        u.displayName?.trim() || (u.email?.split('@')[0] ?? '').trim() || (isAdmin ? 'Admin' : 'Student');

      setUserInfo({
        ...userInfo,
        fullName: userInfo.fullName || display,
        userType: isAdmin ? 'admin' : 'student',
      });

      router.push({ pathname: ROUTES.ONBOARDING.IDENTITY_HUB, params: { userType: userType || 'student' } });
    } catch (e: unknown) {
      setSubmitError(mapGoogleSignInFlowErrorToMessage(e, { flow: 'sign-up' }));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleCreateProfile = async () => {
    if (isRegistering || isGoogleSigningIn) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        'Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
      );
      return;
    }

    if (!formValid) return;

    if (!auth) {
      setSubmitError(
        'Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).',
      );
      return;
    }

    setIsRegistering(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      const trimmed = email.trim();
      const nameFromEmail = trimmed.split('@')[0] || (isAdmin ? 'Admin' : 'Student');
      setUserInfo({
        ...userInfo,
        fullName: userInfo.fullName || nameFromEmail,
        userType: isAdmin ? 'admin' : 'student',
      });

      router.push({ pathname: ROUTES.ONBOARDING.IDENTITY_HUB, params: { userType: userType || 'student' } });
    } catch (e: unknown) {
      setSubmitError(mapFirebaseAuthErrorToMessage(e, { flow: 'sign-up' }));
    } finally {
      setIsRegistering(false);
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
        <View style={styles.progressContainer}>
          <View style={[styles.progressBarActive, { width: isAdmin ? 107 : 80 }]} />
          <View style={styles.progressBarInactive} />
        </View>

        <ThemedText style={styles.title} accessibilityRole="header">
          New Member
        </ThemedText>

        <ThemedText style={styles.subtitle}>Enter your credentials.</ThemedText>

        {!configOk ? (
          <ThemedText
            style={styles.configBanner}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            Registration uses Firebase Authentication. Add EXPO_PUBLIC_FIREBASE_* values (see README). Create Profile
            stays disabled until Firebase is configured.
          </ThemedText>
        ) : null}

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>UNIVERSITY EMAIL</ThemedText>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setSubmitError(null);
            }}
            placeholder={isAdmin ? 'admin@msmail.ariel.ac.il' : 'student-name@msmail.ariel.ac.il'}
            placeholderTextColor="#9B9B9B"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!isRegistering && !isGoogleSigningIn}
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
            style={styles.passwordInput}
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              setSubmitError(null);
            }}
            placeholder="...."
            placeholderTextColor="#9B9B9B"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            editable={!isRegistering && !isGoogleSigningIn}
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
          style={[
            styles.createProfileButton,
            (!canSubmit || isRegistering) && styles.createProfileButtonDisabled,
          ]}
          activeOpacity={canSubmit && !isRegistering ? 0.8 : 1}
          onPress={() => {
            void handleCreateProfile();
          }}
          disabled={!canSubmit || isRegistering}
          accessibilityLabel="Create profile"
          accessibilityState={{ disabled: !canSubmit || isRegistering }}>
          {isRegistering ? (
            <ActivityIndicator color="#FFFFFF" accessibilityLabel="Creating account" />
          ) : (
            <ThemedText
              style={[
                styles.createProfileButtonText,
                (!canSubmit || isRegistering) && styles.createProfileButtonTextDisabled,
              ]}>
              CREATE PROFILE
            </ThemedText>
          )}
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
            void handleGoogleContinue();
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
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    marginBottom: 32,
    height: 4,
  },
  progressBarActive: {
    height: 4,
    backgroundColor: '#5B4C9D',
    borderRadius: 2,
    marginRight: 4,
  },
  progressBarInactive: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
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
  fieldHint: {
    marginTop: 6,
    fontSize: 12,
    color: '#9B9B9B',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  emailInput: {
    width: '100%',
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  passwordInput: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5B4C9D',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  submitError: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 12,
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
  },
  createProfileButton: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  createProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createProfileButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  createProfileButtonTextDisabled: {
    color: '#9B9B9B',
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
