import { useSelection } from "@/contexts/selection-context";
import {
  isEmailPasswordAuthFormValid,
  isValidAuthEmail,
  isValidAuthPassword,
} from "@/lib/email-password-auth-validation";
import {
  AUTH_POST_SIGN_IN_MISSING_PROFILE,
  resolvePostSignInNavigation,
} from "@/lib/auth-post-sign-in";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { mapFirebaseAuthErrorToMessage } from "@/lib/firebase-auth-error-message";
import {
  googleSignInUnavailableReason,
  isGoogleSignInAvailableOnThisRuntime,
} from "@/lib/google-sign-in-config";
import { mapGoogleSignInFlowErrorToMessage } from "@/lib/google-sign-in-error-message";
import { signInWithGoogle } from "@/lib/google-sign-in";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

export function useSignInViewModel() {
  const [email, setEmailState] = useState("");
  const [password, setPasswordState] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const { setUserInfo, userInfo } = useSelection();

  const configOk = isFirebaseConfigured() && auth !== undefined;
  const formValid = isEmailPasswordAuthFormValid(email, password);
  const canSubmit = configOk && formValid && !isSigningIn && !isGoogleSigningIn;
  const googleHint = configOk ? googleSignInUnavailableReason() : null;
  const canUseGoogle =
    configOk &&
    isGoogleSignInAvailableOnThisRuntime() &&
    !isSigningIn &&
    !isGoogleSigningIn;

  const emailHint =
    email.length > 0 && !isValidAuthEmail(email)
      ? "Use your full institutional email (check @ and domain)."
      : null;
  const passwordHint =
    password.length > 0 && !isValidAuthPassword(password)
      ? "Password must be at least 6 characters."
      : null;

  const setEmail = (t: string) => {
    setEmailState(t);
    setSubmitError(null);
  };

  const setPassword = (t: string) => {
    setPasswordState(t);
    setSubmitError(null);
  };

  const googleSignIn = async () => {
    if (isGoogleSigningIn || isSigningIn) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        "Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
      );
      return;
    }

    if (!auth) {
      setSubmitError(
        "Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
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

    setIsGoogleSigningIn(true);
    try {
      const cred = await signInWithGoogle(auth);
      const u = cred.user;
      const display =
        u.displayName?.trim() || (u.email?.split("@")[0] ?? "").trim() || "User";

      try {
        const nav = await resolvePostSignInNavigation({
          firebaseUser: u,
          entry: "profile",
        });
        setUserInfo({
          ...userInfo,
          fullName: userInfo.fullName || display,
          userType: nav.userType,
        });
        router.replace(nav.home);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          e.message === AUTH_POST_SIGN_IN_MISSING_PROFILE
        ) {
          setSubmitError(
            "No UniSmart profile for this Google account yet. Use Create account, or sign in with the method you used to register.",
          );
        } else {
          setSubmitError("Could not open the next screen. Please try again.");
        }
      }
    } catch (e: unknown) {
      setSubmitError(mapGoogleSignInFlowErrorToMessage(e));
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const authenticate = async () => {
    if (isSigningIn || isGoogleSigningIn) return;
    setSubmitError(null);

    if (!configOk) {
      setSubmitError(
        "Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
      );
      return;
    }

    if (!formValid) {
      return;
    }

    if (!auth) {
      setSubmitError(
        "Sign-in is not available until Firebase is configured. Set EXPO_PUBLIC_FIREBASE_* in your environment (see README).",
      );
      return;
    }

    setIsSigningIn(true);
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );

      const trimmed = email.trim();
      const nameFromEmail = trimmed.split("@")[0] || "User";
      try {
        const nav = await resolvePostSignInNavigation({
          firebaseUser: cred.user,
          entry: "profile",
        });
        setUserInfo({
          ...userInfo,
          fullName: userInfo.fullName || nameFromEmail,
          userType: nav.userType,
        });
        router.replace(nav.home);
      } catch (e: unknown) {
        if (
          e instanceof Error &&
          e.message === AUTH_POST_SIGN_IN_MISSING_PROFILE
        ) {
          setSubmitError(
            "No UniSmart profile for this email yet. Create an account first, then complete onboarding.",
          );
        } else {
          setSubmitError("Could not open the next screen. Please try again.");
        }
      }
    } catch (e: unknown) {
      setSubmitError(mapFirebaseAuthErrorToMessage(e));
    } finally {
      setIsSigningIn(false);
    }
  };

  return {
    email,
    password,
    submitError,
    isSigningIn,
    isGoogleSigningIn,
    configOk,
    formValid,
    canSubmit,
    googleHint,
    canUseGoogle,
    emailHint,
    passwordHint,
    setEmail,
    setPassword,
    authenticate,
    googleSignIn,
  };
}
