import { ROUTES } from "@/constants/routes";
import { useSelection } from "@/contexts/selection-context";
import { router } from "expo-router";

export function useSetupCompleteViewModel() {
  const { userInfo } = useSelection();
  const isAdmin = userInfo.userType === "admin";

  const enterApp = () => {
    if (isAdmin) {
      router.replace(ROUTES.ADMIN.DASHBOARD);
    } else {
      router.replace(ROUTES.STUDENT.PLANNER);
    }
  };

  return {
    isAdmin,
    goBack: () => router.back(),
    enterApp,
  };
}
