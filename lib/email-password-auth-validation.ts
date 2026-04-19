/**
 * Pure validation for email/password Firebase Auth flows (sign-in and sign-up).
 * Shared by student and admin sign-in and registration — not student-specific.
 */

/** Syntactic check: trimmed, single @, local + domain with a dot in domain. */
const EMAIL_SYNTAX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidAuthEmail(email: string): boolean {
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  return EMAIL_SYNTAX.test(trimmed);
}

/** Firebase email/password requires at least 6 characters. */
export function isValidAuthPassword(password: string): boolean {
  return password.length >= 6;
}

export function isEmailPasswordAuthFormValid(email: string, password: string): boolean {
  return isValidAuthEmail(email) && isValidAuthPassword(password);
}

/** True when the confirmation field matches the password (same string as sent to Firebase). */
export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

/**
 * Email/password registration: valid email and password, non-empty confirmation that matches password.
 */
export function isEmailPasswordRegistrationFormValid(
  email: string,
  password: string,
  confirmPassword: string,
): boolean {
  if (!isEmailPasswordAuthFormValid(email, password)) return false;
  if (confirmPassword.length === 0) return false;
  return passwordsMatch(password, confirmPassword);
}
