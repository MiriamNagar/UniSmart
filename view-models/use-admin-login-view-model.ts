import { ROUTES } from "@/constants/routes";

export function useAdminLoginViewModel() {
  return { redirectHref: ROUTES.AUTH.SIGN_IN };
}
