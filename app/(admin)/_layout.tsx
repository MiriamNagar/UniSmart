import { Stack } from 'expo-router';
import { AdminBottomNavigation } from '@/components/bottom-navigation';
import { useSelection } from '@/contexts/selection-context';
import { useAdminShellRoleGate } from '@/hooks/use-role-gate';
import { View } from 'react-native';

export default function AdminLayout() {
  const { userInfo } = useSelection();
  useAdminShellRoleGate();

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="admin-dashboard" />
      </Stack>
      <AdminBottomNavigation />
    </View>
  );
}

