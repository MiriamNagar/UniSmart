import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ROUTES } from '@/constants/routes';

export default function WelcomeScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isSignIn = mode === 'signin';

  const handleStudentPress = () => {
    if (isSignIn) {
      router.push(ROUTES.AUTH.STUDENT_LOGIN);
    } else {
      router.push({ pathname: ROUTES.AUTH.NEW_MEMBER, params: { userType: 'student' } });
    }
  };

  const handleAdminPress = () => {
    if (isSignIn) {
      router.push(ROUTES.AUTH.ADMIN_LOGIN);
    } else {
      router.push({ pathname: ROUTES.AUTH.NEW_MEMBER, params: { userType: 'admin' } });
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Icon Circle */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="menu-book" size={48} color="#5B4C9D" />
        </View>
      </View>

      {/* Title */}
      <ThemedText style={styles.title}>Academic Portal</ThemedText>

      {/* Subtitle */}
      <ThemedText style={styles.subtitle}>Who&apos;s accessing the system today?</ThemedText>

      {/* Student Entrance Button */}
      <TouchableOpacity
        style={styles.studentButton}
        activeOpacity={0.8}
        onPress={handleStudentPress}>
        <MaterialIcons name="school" size={24} color="#FFFFFF" />
        <ThemedText style={styles.studentButtonText}>Student Entrance</ThemedText>
      </TouchableOpacity>

      {/* Admin Credentials Button */}
      <TouchableOpacity
        style={styles.adminButton}
        activeOpacity={0.8}
        onPress={handleAdminPress}>
        <MaterialIcons name="verified" size={24} color="#2C2C2C" />
        <ThemedText style={styles.adminButtonText}>Admin Credentials</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#B8B3E0',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    marginBottom: 48,
    textAlign: 'center',
  },
  studentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  studentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 320,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 16,
    paddingHorizontal: 24,
    gap: 12,
  },
  adminButtonText: {
    color: '#1A1A1A',
    fontSize: 18,
    fontWeight: '600',
  },
});

