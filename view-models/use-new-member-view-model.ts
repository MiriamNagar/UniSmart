import { ROUTES } from "@/constants/routes";
import { useSelection } from "@/contexts/selection-context";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { mapFirebaseAuthErrorToMessage } from "@/lib/firebase-auth-error-message";
import {
  isEmailPasswordRegistrationFormValid,
  isValidAuthEmail,
  isValidAuthPassword,
  passwordsMatch,
} from "@/lib/email-password-auth-validation";
import {
  googleSignInUnavailableReason,
  isGoogleSignInAvailableOnThisRuntime,
} from "@/lib/google-sign-in-config";
import { mapGoogleSignInFlowErrorToMessage } from "@/lib/google-sign-in-error-message";
import { signInWithGoogle } from "@/lib/google-sign-in";
import { normalizeSearchParam } from "@/lib/router-search-param";
import {
  ensureAdminProfile,
  ensureStudentProfile,
  mapUserProfileWriteErrorToMessage,
} from "@/lib/user-profile-firestore";
import { router, useLocalSearchParams } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

export function useNewMemberViewModel() {
  const { userType: userTypeRaw } = useLocalSearchParams<{
    userType?: string | string[];
  }>();
  const userType = normalizeSearchParam(userTypeRaw);
  const isAdmin = userType === "admin";
  const { setUserInfo, userInfo } = useSelection();

  const [email, setEmailState] = useState("");
  const [password, setPasswordState] = useState("");
  const [confirmPassword, setConfirmPasswordState] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const formValid = isEmailPasswordRegistrationFormValid(
    email,
    password,
    confirmPassword,
  );
  const configOk = isFirebaseConfigured() && auth !== undefined;
  const canSubmit = configOk && formValid && !isRegistering && !isGoogleSigningIn;
  const googleHint = configOk ? googleSignInUnavailableReason() : null;
  const canUseGoogle =
    configOk &&
    isGoogleSignInAvailableOnThisRuntime() &&
    !isRegistering &&
    !isGoogleSigningIn;

  const emailHint =
    email.length > 0 && !isValidAuthEmail(email)
      ? "Use your full institutional email (check @ and domain)."
      : null;
  const passwordHint =
    password.length > 0 && !isValidAuthPassword(password)
      ? "Password must be at least 6 characters."
      : null;
  const confirmPasswordHint =
    confirmPassword.length > 0 && !passwordsMatch(password, confirmPassword)
      ? "Passwords do not match. Re-enter to match the field above."
      : null;

  const setEmail = (t: string) => {
    setEmailState(t);
    setSubmitError(null);
  };
  const setPassword = (t: string) => {
    setPasswordState(t);
    setSubmitError(null);
  };
  const setConfirmPassword = (t: string) => {
    setConfirmPasswordState(t);
    setSubmitError(null);
  };

  const googleContinue = async () => {
    if (isGoogleSigningIn || isRegistering) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        "Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
      );
      return;
    }

    if (!auth) {
      setSubmitError(
        "Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
      );
      return;
    }

    if (!isGoogleSignInAvailableOnThisRuntime()) {
      setSubmitError(
        googleSignInUnavailableReason() ??
          "Google sign-in is not available. Check configuration (see README).",
      );
      return;
    }

    if (auth.currentUser) {
      const u = auth.currentUser;
      if (isAdmin) {
        try {
          await ensureAdminProfile(u.uid);
        } catch (e: unknown) {
          setSubmitError(mapUserProfileWriteErrorToMessage(e));
          return;
        }
      } else {
        try {
          await ensureStudentProfile(u.uid);
        } catch (e: unknown) {
          setSubmitError(mapUserProfileWriteErrorToMessage(e));
          return;
        }
      }
      const display =
        u.displayName?.trim() ||
        (u.email?.split("@")[0] ?? "").trim() ||
        (isAdmin ? "Admin" : "Student");
      setUserInfo({
        ...userInfo,
        fullName: userInfo.fullName || display,
        userType: isAdmin ? "admin" : "student",
      });
      router.push({
        pathname: ROUTES.ONBOARDING.IDENTITY_HUB,
        params: { userType: userType || "student" },
      });
      return;
    }

    setIsGoogleSigningIn(true);
    try {
      const cred = await signInWithGoogle(auth);
      const u = cred.user;
      if (isAdmin) {
        try {
          await ensureAdminProfile(u.uid);
        } catch (e: unknown) {
          setSubmitError(mapUserProfileWriteErrorToMessage(e));
          return;
        }
      } else {
        try {
          await ensureStudentProfile(u.uid);
        } catch (e: unknown) {
          setSubmitError(mapUserProfileWriteErrorToMessage(e));
          return;
        }
      }
      const display =
        u.displayName?.trim() ||
        (u.email?.split("@")[0] ?? "").trim() ||
        (isAdmin ? "Admin" : "Student");

      setUserInfo({
        ...userInfo,
        fullName: userInfo.fullName || display,
        userType: isAdmin ? "admin" : "student",
      });

      router.push({
        pathname: ROUTES.ONBOARDING.IDENTITY_HUB,
        params: { userType: userType || "student" },
      });
    } catch (e: unknown) {
      setSubmitError(mapGoogleSignInFlowErrorToMessage(e, { flow: "sign-up" }));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const createProfile = async () => {
    if (isRegistering || isGoogleSigningIn) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        "Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
      );
      return;
    }

    if (!formValid) return;

    if (!auth) {
      setSubmitError(
        "Registration requires Firebase configuration. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
      );
      return;
    }

    setIsRegistering(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);

      if (auth.currentUser) {
        if (isAdmin) {
          try {
            await ensureAdminProfile(auth.currentUser.uid);
          } catch (e: unknown) {
            setSubmitError(mapUserProfileWriteErrorToMessage(e));
            return;
          }
        } else {
          try {
            await ensureStudentProfile(auth.currentUser.uid);
          } catch (e: unknown) {
            setSubmitError(mapUserProfileWriteErrorToMessage(e));
            return;
          }
        }
      }

      const trimmed = email.trim();
      const nameFromEmail =
        trimmed.split("@")[0] || (isAdmin ? "Admin" : "Student");
      setUserInfo({
        ...userInfo,
        fullName: userInfo.fullName || nameFromEmail,
        userType: isAdmin ? "admin" : "student",
      });

      router.push({
        pathname: ROUTES.ONBOARDING.IDENTITY_HUB,
        params: { userType: userType || "student" },
      });
    } catch (e: unknown) {
      setSubmitError(mapFirebaseAuthErrorToMessage(e, { flow: "sign-up" }));
    } finally {
      setIsRegistering(false);
    }
  };

  return {
    isAdmin,
    email,
    password,
    confirmPassword,
    submitError,
    isRegistering,
    isGoogleSigningIn,
    configOk,
    canSubmit,
    googleHint,
    canUseGoogle,
    emailHint,
    passwordHint,
    confirmPasswordHint,
    setEmail,
    setPassword,
    setConfirmPassword,
    googleContinue,
    createProfile,
  };
}
