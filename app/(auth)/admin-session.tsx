import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { ROUTES } from '@/constants/routes';

export default function AdminSessionScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <ThemedText style={styles.title}>Let&apos;s Start</ThemedText>

        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>How would you like to continue?</ThemedText>

        {/* Sign In Button */}
        <TouchableOpacity 
          style={styles.signInButton} 
          activeOpacity={0.8}
          onPress={() => router.push(ROUTES.AUTH.ADMIN_LOGIN)}>
          <ThemedText style={styles.signInButtonText}>SIGN IN</ThemedText>
        </TouchableOpacity>

        {/* Create Account Button */}
        <TouchableOpacity 
          style={styles.createAccountButton} 
          activeOpacity={0.8}
          onPress={() => router.push({ pathname: ROUTES.AUTH.NEW_MEMBER, params: { userType: 'admin' } })}>
          <ThemedText style={styles.createAccountButtonText}>CREATE ACCOUNT</ThemedText>
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
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9B9B9B',
    marginBottom: 48,
    textAlign: 'center',
  },
  signInButton: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  createAccountButton: {
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#5B4C9D',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createAccountButtonText: {
    color: '#5B4C9D',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

