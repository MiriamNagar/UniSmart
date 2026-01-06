import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';

export default function SetupCompleteScreen() {
  const { userInfo } = useSelection();
  
  // Check if user is admin (admin has empty faculty, major, academicLevel)
  const isAdmin = !userInfo.faculty && !userInfo.major && !userInfo.academicLevel;
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
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBarActive} />
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>Setup Complete</ThemedText>

        {/* Subtitle */}
        <ThemedText style={styles.subtitle}>Tailoring courses for your profile.</ThemedText>

        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="check" size={64} color="#4CAF50" />
          </View>
        </View>
      </View>

      {/* Bottom Navigation Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.backButtonBottom}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ThemedText style={styles.backButtonText}>BACK</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.enterAppButton}
          onPress={() => {
            if (isAdmin) {
              router.push('/admin-dashboard');
            } else {
              router.push('/planner');
            }
          }}
          activeOpacity={0.8}>
          <ThemedText style={styles.enterAppButtonText}>ENTER APP</ThemedText>
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
    justifyContent: 'center',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    marginBottom: 32,
    height: 4,
    alignSelf: 'center',
  },
  progressBarActive: {
    width: '100%',
    height: 4,
    backgroundColor: '#5B4C9D',
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
    paddingBottom: 4,
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
  iconContainer: {
    marginTop: 32,
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  backButtonBottom: {
    flex: 1,
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#1A1A1A',
  },
  enterAppButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#5B4C9D',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enterAppButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
});

