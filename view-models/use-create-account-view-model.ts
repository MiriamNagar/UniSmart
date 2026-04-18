import { ROUTES } from "@/constants/routes";
import { designTokens } from "@/constants/design-tokens";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useCreateAccountViewModel() {
  const insets = useSafeAreaInsets();
  const primary = designTokens.color.primary;
  const border = designTokens.color.border;
  const textSecondary = designTokens.color.textSecondary;

  return {
    insets,
    primary,
    border,
    textSecondary,
    goBack: () => router.back(),
    goStudentNewMember: () =>
      router.push({
        pathname: ROUTES.AUTH.NEW_MEMBER,
        params: { userType: "student" },
      }),
    goAdminNewMember: () =>
      router.push({
        pathname: ROUTES.AUTH.NEW_MEMBER,
        params: { userType: "admin" },
      }),
  };
}
