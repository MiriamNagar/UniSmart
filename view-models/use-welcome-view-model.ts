import { designTokens } from "@/constants/design-tokens";
import { getWelcomeEntryHrefs } from "@/lib/welcome-entry-paths";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { signIn, createAccount } = getWelcomeEntryHrefs();

export function useWelcomeViewModel() {
  const insets = useSafeAreaInsets();
  const primary = designTokens.color.primary;
  const textSecondary = designTokens.color.textSecondary;

  return {
    insets,
    primary,
    textSecondary,
    goSignIn: () => {
      router.push(signIn);
    },
    goCreateAccount: () => {
      router.push(createAccount);
    },
  };
}
