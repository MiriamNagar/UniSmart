import { ROUTES } from "@/constants/routes";

export function useStudentSessionViewModel() {
  return { redirectHref: ROUTES.AUTH.WELCOME };
}
