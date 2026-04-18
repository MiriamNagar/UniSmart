import { ROUTES } from "@/constants/routes";
import { useSelection } from "@/contexts/selection-context";
import { auth } from "@/lib/firebase";
import { evaluateBirthDateForStudentPolicy } from "@/lib/birth-date-policy";
import {
  mapUserProfileWriteErrorToMessage,
  mergeUserPassport,
} from "@/lib/user-profile-firestore";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";

export function useIdentityHubViewModel() {
  const { userType } = useLocalSearchParams<{ userType?: string }>();
  const isAdmin = userType === "admin";
  const { userInfo, setUserInfo } = useSelection();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const policyEvaluation = evaluateBirthDateForStudentPolicy(birthDate);
  const isFormValid =
    fullName.trim().length > 0 && policyEvaluation.accepted;
  const birthDateHint =
    policyEvaluation.reason === "invalid-format"
      ? "Use YYYY-MM-DD format (for example: 2005-09-14)."
      : policyEvaluation.reason === "future-date"
        ? "Birth date cannot be in the future."
        : policyEvaluation.reason === "under-13"
          ? "Students under 13 cannot continue in this app flow. Use your institutional support path."
          : null;

  const handleContinue = () => {
    if (!isFormValid) {
      return;
    }
    void (async () => {
      if (isAdmin) {
        setUserInfo({
          ...userInfo,
          fullName,
          birthDate: policyEvaluation.normalizedBirthDate ?? birthDate.trim(),
          faculty: "",
          major: "",
          academicLevel: "",
          userType: "admin",
        });
        if (auth?.currentUser) {
          try {
            await mergeUserPassport(auth.currentUser.uid, {
              fullName,
              birthDate:
                policyEvaluation.normalizedBirthDate ?? birthDate.trim(),
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
      } else {
        setUserInfo({
          ...userInfo,
          fullName,
          birthDate: policyEvaluation.normalizedBirthDate ?? birthDate.trim(),
          userType: "student",
        });
        if (auth?.currentUser) {
          try {
            await mergeUserPassport(auth.currentUser.uid, {
              fullName,
              birthDate:
                policyEvaluation.normalizedBirthDate ?? birthDate.trim(),
            });
          } catch (e: unknown) {
            Alert.alert(
              "Could not save profile",
              mapUserProfileWriteErrorToMessage(e),
            );
            return;
          }
        }
        router.push(ROUTES.ONBOARDING.DEPARTMENT);
      }
    })();
  };

  return {
    isAdmin,
    fullName,
    setFullName,
    birthDate,
    setBirthDate,
    isFormValid,
    birthDateHint,
    handleContinue,
    goBack: () => router.back(),
  };
}
