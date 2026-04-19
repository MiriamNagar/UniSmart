import { ROUTES } from "@/constants/routes";
import { router } from "expo-router";

export function useAdminSessionViewModel() {
  return {
    goSignIn: () => router.push(ROUTES.AUTH.SIGN_IN),
    goCreateAccount: () => router.push(ROUTES.AUTH.CREATE_ACCOUNT),
  };
}
