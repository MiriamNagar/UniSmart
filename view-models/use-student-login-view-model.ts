import { ROUTES } from "@/constants/routes";

export function useStudentLoginViewModel() {
  return { redirectHref: ROUTES.AUTH.SIGN_IN };
}
