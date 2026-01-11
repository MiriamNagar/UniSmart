import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';

export default function AccountScreen() {
  const { userInfo, setUserInfo } = useSelection();

  // Check if user is admin
  const isAdmin = userInfo.userType === 'admin';

  const getInitials = (name: string) => {
    if (!name) return 'SU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatAcademicLevel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      FRESHMAN: 'Freshman',
      SOPHOMORE: 'Sophomore',
      JUNIOR: 'Junior',
      SENIOR: 'Senior',
      MASTER: 'Master',
      PHD: 'PhD',
    };
    return levelMap[level] || level;
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          // Navigate first to get to auth route before layouts check
          router.replace(ROUTES.AUTH.STUDENT_SESSION);
          
          // Clear userInfo after navigation has completed
          // This prevents student/admin layouts from redirecting
          setTimeout(() => {
            setUserInfo({
              fullName: '',
              age: '',
              faculty: '',
              major: '',
              academicLevel: '',
              userType: undefined,
            });
          }, 200);
        },
      },
    ]);
  };

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
                <ThemedText style={styles.passportLabel}>DEPARTMENT</ThemedText>
                <ThemedText style={styles.passportValue}>
                  {userInfo.faculty && userInfo.major
                    ? `${userInfo.faculty} - ${userInfo.major}`
                    : 'Not set'}
                </ThemedText>
              </View>
              <View style={styles.passportRow}>
                <ThemedText style={styles.passportLabel}>CURRENT YEAR</ThemedText>
                <ThemedText style={styles.passportValue}>
                  {userInfo.academicLevel
                    ? formatAcademicLevel(userInfo.academicLevel)
                    : 'Not set'}
                </ThemedText>
              </View>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <ThemedText style={styles.logoutText}>LOGOUT</ThemedText>
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
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF4444',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4444',
    letterSpacing: 0.5,
  },
});

