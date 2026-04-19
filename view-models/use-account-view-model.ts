import { ROUTES } from "@/constants/routes";
import { TAB_SCROLL_KEYS } from "@/constants/tab-scroll-keys";
import { useSelection } from "@/contexts/selection-context";
import { usePersistedTabScroll } from "@/hooks/use-persisted-tab-scroll";
import { auth } from "@/lib/firebase";
import { beforeFirebaseSignOut } from "@/lib/sign-out-side-effects";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { Alert } from "react-native";

export function useAccountViewModel() {
  const { userInfo, setUserInfo } = useSelection();
  const { scrollViewProps } = usePersistedTabScroll(
    TAB_SCROLL_KEYS.STUDENT_ACCOUNT,
  );

  const isAdmin = userInfo.userType === "admin";

  const getInitials = (name: string) => {
    if (!name) return "SU";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const formatAcademicLevel = (level: string) => {
    const levelMap: { [key: string]: string } = {
      FRESHMAN: "Freshman",
      SOPHOMORE: "Sophomore",
      JUNIOR: "Junior",
      SENIOR: "Senior",
      MASTER: "Master",
      PHD: "PhD",
    };
    return levelMap[level] || level;
  };

  const handleSignOutPress = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await beforeFirebaseSignOut();
              if (auth) {
                await signOut(auth);
              }
            } catch {
              // Still clear local shell state below.
            }
            router.replace(ROUTES.AUTH.WELCOME);
            setTimeout(() => {
              setUserInfo({
                fullName: "",
                birthDate: "",
                faculty: "",
                major: "",
                academicLevel: "",
                userType: undefined,
              });
            }, 200);
          })();
        },
      },
    ]);
  };

  return {
    userInfo,
    scrollViewProps,
    isAdmin,
    getInitials,
    formatAcademicLevel,
    handleSignOutPress,
  };
}
