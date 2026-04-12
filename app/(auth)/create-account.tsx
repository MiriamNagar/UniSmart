import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { designTokens } from '@/constants/design-tokens';
import { ROUTES } from '@/constants/routes';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateAccountScreen() {
  const insets = useSafeAreaInsets();
  const primary = designTokens.color.primary;
  const border = designTokens.color.border;
  const textSecondary = designTokens.color.textSecondary;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <Pressable
        style={styles.backRow}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <MaterialIcons name="chevron-left" size={28} color="#9B9B9B" />
        <ThemedText style={styles.backLabel}>Back</ThemedText>
      </Pressable>

      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: `${primary}26` }]}>
          <MaterialIcons name="person-add" size={44} color={primary} />
        </View>
      </View>

      <ThemedText style={styles.title}>Create account</ThemedText>
      <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
        Choose who this account is for. You can sign in later from one place; we open student or admin based on this
        choice.
      </ThemedText>

      <ThemedText style={[styles.policyNote, { color: textSecondary }]}>
        Today each email has one role in UniSmart (student or admin). If you need both in real life, use two accounts
        until multi-role support exists.
      </ThemedText>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue as student"
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: primary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={() =>
            router.push({ pathname: ROUTES.AUTH.NEW_MEMBER, params: { userType: 'student' } })
          }>
          <MaterialIcons name="school" size={22} color="#FFFFFF" />
          <ThemedText style={styles.primaryButtonText}>Student account</ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue as admin"
          style={({ pressed }) => [
            styles.outlineButton,
            { borderColor: border, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={() =>
            router.push({ pathname: ROUTES.AUTH.NEW_MEMBER, params: { userType: 'admin' } })
          }>
          <MaterialIcons name="admin-panel-settings" size={22} color="#2C2C2C" />
          <ThemedText style={styles.outlineButtonText}>Admin account</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
  },
  backLabel: {
    fontSize: 16,
    color: '#6B6B6B',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 22,
    marginBottom: 16,
    alignSelf: 'center',
  },
  policyNote: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 28,
    alignSelf: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    gap: 14,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  outlineButtonText: {
    color: '#1A1A1A',
    fontSize: 17,
    fontWeight: '600',
  },
});
