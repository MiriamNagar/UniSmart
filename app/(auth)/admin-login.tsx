import { StyleSheet, TextInput, TouchableOpacity, View, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useState } from 'react';
import { ROUTES } from '@/constants/routes';
import { useSelection } from '@/contexts/selection-context';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUserInfo, userInfo } = useSelection();

  const isFormValid = email.trim().length > 0 && password.trim().length > 0;

  const handleAuthenticate = () => {
    if (isFormValid) {
      // Set userInfo for admin
      if (!userInfo.fullName) {
        // Extract name from email as a placeholder, or use a default
        const nameFromEmail = email.split('@')[0] || 'Admin';
        setUserInfo({
          fullName: nameFromEmail,
          age: '',
          faculty: '',
          major: '',
          academicLevel: '',
          userType: 'admin',
        });
      } else if (!userInfo.userType) {
        // Ensure userType is set even if fullName already exists
        setUserInfo({
          ...userInfo,
          userType: 'admin',
        });
      }
      // Navigate to admin dashboard after successful login
      router.replace(ROUTES.ADMIN.DASHBOARD);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}>
        <MaterialIcons name="chevron-left" size={28} color="#9B9B9B" />
      </TouchableOpacity>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <ThemedText style={styles.title}>Welcome Back</ThemedText>

        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>Enter your credentials.</ThemedText>

        {/* University Email Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>UNIVERSITY EMAIL</ThemedText>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@university.edu"
            placeholderTextColor="#9B9B9B"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <ThemedText style={styles.label}>PASSWORD</ThemedText>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="........"
            placeholderTextColor="#9B9B9B"
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Authenticate Button */}
        <TouchableOpacity
          style={[styles.authenticateButton, !isFormValid && styles.authenticateButtonDisabled]}
          activeOpacity={isFormValid ? 0.8 : 1}
          onPress={handleAuthenticate}
          disabled={!isFormValid}>
          <ThemedText
            style={[
              styles.authenticateButtonText,
              !isFormValid && styles.authenticateButtonTextDisabled,
            ]}>
            AUTHENTICATE
          </ThemedText>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>OR</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Auth Button */}
        <TouchableOpacity
          style={styles.googleButton}
          activeOpacity={0.8}
          onPress={() => {
            // TODO: Implement Google authentication
            // Set userInfo for admin
            if (!userInfo.fullName) {
              setUserInfo({
                fullName: 'Admin',
                age: '',
                faculty: '',
                major: '',
                academicLevel: '',
                userType: 'admin',
              });
            } else if (!userInfo.userType) {
              setUserInfo({
                ...userInfo,
                userType: 'admin',
              });
            }
            router.replace(ROUTES.ADMIN.DASHBOARD);
          }}>
          <Image
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
            style={styles.googleIcon}
            resizeMode="contain"
          />
          <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
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
    marginBottom: 48,
    textAlign: 'center',
    width: '100%',
  },
  inputContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
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
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
});

