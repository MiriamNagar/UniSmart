import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAccountViewModel } from '@/view-models/use-account-view-model';

export default function AccountScreen() {
  const {
    userInfo,
    scrollViewProps,
    isAdmin,
    getInitials,
    formatAcademicLevel,
    handleSignOutPress,
  } = useAccountViewModel();

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={styles.headerTitleUni}>Uni</ThemedText>
          <ThemedText style={styles.headerTitleSmart}>Smart</ThemedText>
        </View>
        <ThemedText style={styles.headerSubtitle}>ACCOUNT HUB</ThemedText>
      </View>

      {/* Main Content */}
      <ScrollView
        {...scrollViewProps}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <ThemedText style={styles.avatarText}>
                {getInitials(userInfo.fullName || 'Student User')}
              </ThemedText>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <ThemedText style={styles.userName}>
              {userInfo.fullName || 'Student User'}
            </ThemedText>
            <View style={styles.roleContainer}>
              <ThemedText style={styles.roleLabel}>ROLE: </ThemedText>
              <ThemedText style={styles.roleValue}>{isAdmin ? 'ADMIN' : 'STUDENT'}</ThemedText>
            </View>
          </View>
        </View>

        {/* Academic Passport Card - Only for students */}
        {!isAdmin && (
          <View style={styles.passportCard}>
            <ThemedText style={styles.passportTitle}>ACADEMIC PASSPORT</ThemedText>
            <View style={styles.passportInfo}>
              <View style={styles.passportRow}>
                <ThemedText style={styles.passportLabel}>FULL NAME</ThemedText>
                <ThemedText style={styles.passportValue}>
                  {userInfo.fullName?.trim() ? userInfo.fullName : 'Not set'}
                </ThemedText>
              </View>
              <View style={styles.passportRow}>
                <ThemedText style={styles.passportLabel}>BIRTH DATE</ThemedText>
                <ThemedText style={styles.passportValue}>
                  {userInfo.birthDate?.trim() ? userInfo.birthDate : 'Not set'}
                </ThemedText>
              </View>
              <View style={styles.passportRow}>
                <ThemedText style={styles.passportLabel}>DEPARTMENT</ThemedText>
                <ThemedText style={styles.passportValue}>
                  {userInfo.faculty?.trim() ? userInfo.faculty : 'Not set'}
                </ThemedText>
              </View>
              <View style={styles.passportRow}>
                <ThemedText style={styles.passportLabel}>PROGRAM / MAJOR</ThemedText>
                <ThemedText style={styles.passportValue}>
                  {userInfo.major?.trim() ? userInfo.major : 'Not set'}
                </ThemedText>
              </View>
              <View style={styles.passportRow}>
                <ThemedText style={styles.passportLabel}>LEVEL</ThemedText>
                <ThemedText style={styles.passportValue}>
                  {userInfo.academicLevel
                    ? formatAcademicLevel(userInfo.academicLevel)
                    : 'Not set'}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Sign out — confirmation required (Story 1.7); cancel leaves session intact */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOutPress} activeOpacity={0.7}>
          <ThemedText style={styles.signOutText}>SIGN OUT</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitleUni: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerTitleSmart: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B4C9D',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#5B4C9D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9B9B9B',
  },
  roleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5B4C9D',
  },
  passportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  passportTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  passportInfo: {
    gap: 16,
  },
  passportRow: {
    gap: 4,
  },
  passportLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9B9B9B',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  passportValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  signOutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF4444',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4444',
    letterSpacing: 0.5,
  },
});

