import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNewMemberViewModel } from '@/view-models/use-new-member-view-model';

export default function NewMemberScreen() {
  const {
    isAdmin,
    email,
    password,
    confirmPassword,
    submitError,
    isRegistering,
    isGoogleSigningIn,
    configOk,
    canSubmit,
    googleHint,
    canUseGoogle,
    emailHint,
    passwordHint,
    confirmPasswordHint,
    setEmail,
    setPassword,
    setConfirmPassword,
    googleContinue,
    createProfile,
  } = useNewMemberViewModel();

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
            onChangeText={setEmail}
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
            onChangeText={setPassword}
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

        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>CONFIRM PASSWORD</ThemedText>
          <TextInput
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="...."
            placeholderTextColor="#9B9B9B"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            textContentType="newPassword"
            editable={!isRegistering && !isGoogleSigningIn}
            accessibilityLabel="Confirm password"
          />
          {confirmPasswordHint ? (
            <ThemedText style={styles.fieldHint} accessibilityLiveRegion="polite">
              {confirmPasswordHint}
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
            void createProfile();
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
            void googleContinue();
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
