import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { router, useSegments } from 'expo-router';
import { useSelection } from '@/contexts/selection-context';
import { ROUTES } from '@/constants/routes';

export function StudentBottomNavigation() {
  const segments = useSegments();
  const { alerts } = useSelection();

  const unreadAlertCount = alerts.filter((alert) => !alert.isRead).length;

  const isActive = (route: string) => {
    const currentPath = `/${segments.join('/')}`;
    
    // Special handling for planner tab - also active when in planner-flow
    if (route === ROUTES.STUDENT.PLANNER) {
      return currentPath === ROUTES.STUDENT.PLANNER || 
             currentPath.startsWith(ROUTES.STUDENT.PLANNER + '/') ||
             currentPath.startsWith('/(student)/(planner-flow)');
    }
    
    // Special handling for notes tab - also active when in folder-content
    if (route === ROUTES.STUDENT.NOTES) {
      return currentPath === ROUTES.STUDENT.NOTES || 
             currentPath.startsWith(ROUTES.STUDENT.NOTES + '/') ||
             currentPath === ROUTES.STUDENT.FOLDER_CONTENT ||
             currentPath.startsWith(ROUTES.STUDENT.FOLDER_CONTENT + '/');
    }
    
    return currentPath === route || currentPath.startsWith(route + '/');
  };

  const handleNavigation = (route: string) => {
    // Don't navigate if we're already on this route
    if (isActive(route)) {
      return;
    }
    router.push(route);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.STUDENT.PLANNER)}>
        <MaterialIcons
          name="event-note"
          size={24}
          color={isActive(ROUTES.STUDENT.PLANNER) ? '#5B4C9D' : '#9B9B9B'}
        />
        <ThemedText
          style={isActive(ROUTES.STUDENT.PLANNER) ? styles.navItemTextActive : styles.navItemText}>
          PLANNER
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.STUDENT.SAVED)}>
        <MaterialIcons
          name="bookmark"
          size={24}
          color={isActive(ROUTES.STUDENT.SAVED) ? '#5B4C9D' : '#9B9B9B'}
        />
        <ThemedText
          style={isActive(ROUTES.STUDENT.SAVED) ? styles.navItemTextActive : styles.navItemText}>
          SAVED
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.STUDENT.NOTES)}>
        <MaterialIcons
          name="description"
          size={24}
          color={isActive(ROUTES.STUDENT.NOTES) ? '#5B4C9D' : '#9B9B9B'}
        />
        <ThemedText
          style={isActive(ROUTES.STUDENT.NOTES) ? styles.navItemTextActive : styles.navItemText}>
          NOTES
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.STUDENT.ALERTS)}>
        <View style={styles.alertIconContainer}>
          <MaterialIcons
            name="notifications"
            size={24}
            color={isActive(ROUTES.STUDENT.ALERTS) ? '#5B4C9D' : '#9B9B9B'}
          />
          {unreadAlertCount > 0 && <View style={styles.alertDot} />}
        </View>
        <ThemedText
          style={isActive(ROUTES.STUDENT.ALERTS) ? styles.navItemTextActive : styles.navItemText}>
          ALERTS
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.STUDENT.ACCOUNT)}>
        <MaterialIcons
          name="account-circle"
          size={24}
          color={isActive(ROUTES.STUDENT.ACCOUNT) ? '#5B4C9D' : '#9B9B9B'}
        />
        <ThemedText
          style={isActive(ROUTES.STUDENT.ACCOUNT) ? styles.navItemTextActive : styles.navItemText}>
          ACCOUNT
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

export function AdminBottomNavigation() {
  const segments = useSegments();

  const isActive = (route: string) => {
    const currentPath = `/${segments.join('/')}`;
    // For admin navigation, also check student routes (notes/account are shared)
    if (route === ROUTES.STUDENT.NOTES) {
      // Notes tab should be active when in notes or folder-content
      return currentPath === ROUTES.STUDENT.NOTES || 
             currentPath.startsWith(ROUTES.STUDENT.NOTES + '/') ||
             currentPath === ROUTES.STUDENT.FOLDER_CONTENT ||
             currentPath.startsWith(ROUTES.STUDENT.FOLDER_CONTENT + '/');
    }
    if (route === ROUTES.STUDENT.ACCOUNT) {
      return currentPath === ROUTES.STUDENT.ACCOUNT || currentPath.startsWith(ROUTES.STUDENT.ACCOUNT + '/');
    }
    return currentPath === route || currentPath.startsWith(route + '/');
  };

  const handleNavigation = (route: string) => {
    // Don't navigate if we're already on this route
    if (isActive(route)) {
      return;
    }
    router.push(route);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.ADMIN.DASHBOARD)}>
        <MaterialIcons
          name="bar-chart"
          size={24}
          color={isActive(ROUTES.ADMIN.DASHBOARD) ? '#5B4C9D' : '#9B9B9B'}
        />
        <ThemedText
          style={
            isActive(ROUTES.ADMIN.DASHBOARD) ? styles.navItemTextActive : styles.navItemText
          }>
          ANALYSIS
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.STUDENT.NOTES)}>
        <MaterialIcons
          name="description"
          size={24}
          color={isActive(ROUTES.STUDENT.NOTES) ? '#5B4C9D' : '#9B9B9B'}
        />
        <ThemedText
          style={isActive(ROUTES.STUDENT.NOTES) ? styles.navItemTextActive : styles.navItemText}>
          NOTES
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.7}
        onPress={() => handleNavigation(ROUTES.STUDENT.ACCOUNT)}>
        <MaterialIcons
          name="account-circle"
          size={24}
          color={isActive(ROUTES.STUDENT.ACCOUNT) ? '#5B4C9D' : '#9B9B9B'}
        />
        <ThemedText
          style={isActive(ROUTES.STUDENT.ACCOUNT) ? styles.navItemTextActive : styles.navItemText}>
          ACCOUNT
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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

