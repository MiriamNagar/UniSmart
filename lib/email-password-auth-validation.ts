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
