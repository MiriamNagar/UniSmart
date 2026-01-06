import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';

export default function AccountScreen() {
  const { lastPlannerRoute, userInfo, alerts } = useSelection();

  // Check if user is admin (admin has empty faculty, major, academicLevel)
  const isAdmin = !userInfo.faculty && !userInfo.major && !userInfo.academicLevel;

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
          router.replace('/student-session');
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

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {isAdmin ? (
          <>
            {/* Admin Navigation */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => router.push('/admin-dashboard')}>
              <MaterialIcons name="bar-chart" size={24} color="#9B9B9B" />
              <ThemedText style={styles.navItemText}>ANALYSIS</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => router.push('/notes')}>
              <MaterialIcons name="description" size={24} color="#9B9B9B" />
              <ThemedText style={styles.navItemText}>NOTES</ThemedText>
            </TouchableOpacity>
            <View style={styles.navItem}>
              <MaterialIcons name="account-circle" size={24} color="#5B4C9D" />
              <ThemedText style={styles.navItemTextActive}>ACCOUNT</ThemedText>
            </View>
          </>
        ) : (
          <>
            {/* Student Navigation */}
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => {
                const route = lastPlannerRoute || '/planner';
                router.push(route as any);
              }}>
              <MaterialIcons name="event-note" size={24} color="#9B9B9B" />
              <ThemedText style={styles.navItemText}>PLANNER</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => router.push('/saved')}>
              <MaterialIcons name="bookmark" size={24} color="#9B9B9B" />
              <ThemedText style={styles.navItemText}>SAVED</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => router.push('/notes')}>
              <MaterialIcons name="description" size={24} color="#9B9B9B" />
              <ThemedText style={styles.navItemText}>NOTES</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => router.push('/alerts')}>
              <View style={styles.alertIconContainer}>
                <MaterialIcons name="notifications" size={24} color="#9B9B9B" />
                {alerts.filter((alert) => !alert.isRead).length > 0 && (
                  <View style={styles.alertDot} />
                )}
              </View>
              <ThemedText style={styles.navItemText}>ALERTS</ThemedText>
            </TouchableOpacity>
            <View style={styles.navItem}>
              <MaterialIcons name="account-circle" size={24} color="#5B4C9D" />
              <ThemedText style={styles.navItemTextActive}>ACCOUNT</ThemedText>
            </View>
          </>
        )}
      </View>
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
  bottomNav: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  navItemText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9B9B9B',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  navItemTextActive: {
    fontSize: 10,
    fontWeight: '600',
    color: '#5B4C9D',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  alertIconContainer: {
    position: 'relative',
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
});

