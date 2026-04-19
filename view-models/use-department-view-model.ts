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

export function useDepartmentViewModel() {
  const { userInfo, setUserInfo } = useSelection();
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null);

  const faculties = [
    "ENGINEERING",
    "BUSINESS",
    "SCIENCE",
    "ARTS",
    "MEDICINE",
    "LAW",
    "EDUCATION",
  ];

  const majors = [
    "Software Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Computer Science",
    "Electrical Engineering",
    "Data Science",
  ];

  const isFormValid = selectedFaculty !== null && selectedMajor !== null;

  const handleContinue = () => {
    if (!isFormValid || !selectedFaculty || !selectedMajor) {
      return;
    }
    void (async () => {
      setUserInfo({
        ...userInfo,
        faculty: selectedFaculty,
        major: selectedMajor,
      });
      if (auth?.currentUser) {
        try {
          await mergeUserPassport(auth.currentUser.uid, {
            faculty: selectedFaculty,
            major: selectedMajor,
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
    faculties,
    majors,
    selectedFaculty,
    setSelectedFaculty,
    selectedMajor,
    setSelectedMajor,
    isFormValid,
    handleContinue,
    goBack: () => router.back(),
  };
}
