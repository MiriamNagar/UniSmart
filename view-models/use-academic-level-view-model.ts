import { ROUTES } from "@/constants/routes";
import { useSelection } from "@/contexts/selection-context";
import { auth } from "@/lib/firebase";
import {
  mapUserProfileWriteErrorToMessage,
  mergeUserPassport,
} from "@/lib/user-profile-firestore";
import { router } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export function useAcademicLevelViewModel() {
  const { userInfo, setUserInfo } = useSelection();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const academicLevels = [
    "FRESHMAN",
    "SOPHOMORE",
    "JUNIOR",
    "SENIOR",
    "MASTER",
    "PHD",
  ];

  const isFormValid = selectedLevel !== null;

  const handleContinue = () => {
    if (!isFormValid || !selectedLevel) {
      return;
    }
    void (async () => {
      setUserInfo({
        ...userInfo,
        academicLevel: selectedLevel,
      });
      if (auth?.currentUser) {
        try {
          await mergeUserPassport(auth.currentUser.uid, {
            academicLevel: selectedLevel,
          });
        } catch (e: unknown) {
          Alert.alert(
            "Could not save profile",
            mapUserProfileWriteErrorToMessage(e),
          );
          return;
        }
      }
      router.push(ROUTES.ONBOARDING.SETUP_COMPLETE);
    })();
  };

  return {
    academicLevels,
    selectedLevel,
    setSelectedLevel,
    isFormValid,
    handleContinue,
    goBack: () => router.back(),
  };
}
