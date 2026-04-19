import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaterialIcons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useWelcomeViewModel } from '@/view-models/use-welcome-view-model';

export default function WelcomeScreen() {
  const { insets, primary, textSecondary, goSignIn, goCreateAccount } =
    useWelcomeViewModel();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.iconContainer}>
        <View style={[styles.iconCircle, { backgroundColor: `${primary}26` }]}>
          <MaterialIcons name="menu-book" size={48} color={primary} />
        </View>
      </View>

      <ThemedText style={styles.title}>Welcome</ThemedText>
      <ThemedText style={[styles.subtitle, { color: textSecondary }]}>
        Sign in with your existing account, or create one and choose student or admin.
      </ThemedText>

      <ThemedText style={[styles.policyNote, { color: textSecondary }]}>
        Each sign-in uses the role stored for your email (student or admin). One role per account today—use two emails
        if you truly need both experiences.
      </ThemedText>

      <View style={styles.actions} accessibilityRole="menu">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: primary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={goSignIn}>
          <MaterialIcons name="login" size={22} color="#FFFFFF" />
          <ThemedText style={styles.primaryButtonText}>Sign in</ThemedText>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create account"
          style={({ pressed }) => [
            styles.outlineButton,
            { borderColor: primary, opacity: pressed ? 0.88 : 1 },
          ]}
          onPress={goCreateAccount}>
          <MaterialIcons name="person-add" size={22} color={primary} />
          <ThemedText style={[styles.outlineButtonText, { color: primary }]}>Create account</ThemedText>
        </Pressable>
      </View>
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
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 16,
    textAlign: 'center',
    maxWidth: 340,
    lineHeight: 22,
  },
  policyNote: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 340,
    marginBottom: 28,
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
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
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  outlineButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
