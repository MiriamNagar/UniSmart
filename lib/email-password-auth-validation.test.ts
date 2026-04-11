import {
  isEmailPasswordAuthFormValid,
  isEmailPasswordRegistrationFormValid,
  isValidAuthEmail,
  isValidAuthPassword,
  passwordsMatch,
} from './email-password-auth-validation';

describe('email-password-auth-validation', () => {
  describe('isValidAuthEmail', () => {
    it('rejects empty and whitespace-only', () => {
      expect(isValidAuthEmail('')).toBe(false);
      expect(isValidAuthEmail('   ')).toBe(false);
    });

    it('rejects missing @ or invalid shape', () => {
      expect(isValidAuthEmail('nope')).toBe(false);
      expect(isValidAuthEmail('a@')).toBe(false);
      expect(isValidAuthEmail('@b.com')).toBe(false);
      expect(isValidAuthEmail('a@b')).toBe(false);
    });

    it('accepts reasonable institutional-style addresses', () => {
      expect(isValidAuthEmail('student@university.edu')).toBe(true);
      expect(isValidAuthEmail('  user@school.ac.uk  ')).toBe(true);
    });
  });

  describe('isValidAuthPassword', () => {
    it('requires at least 6 characters', () => {
      expect(isValidAuthPassword('')).toBe(false);
      expect(isValidAuthPassword('12345')).toBe(false);
      expect(isValidAuthPassword('123456')).toBe(true);
    });
  });

  describe('isEmailPasswordAuthFormValid', () => {
    it('requires both email and password rules', () => {
      expect(isEmailPasswordAuthFormValid('bad', '123456')).toBe(false);
      expect(isEmailPasswordAuthFormValid('good@uni.edu', '12345')).toBe(false);
      expect(isEmailPasswordAuthFormValid('good@uni.edu', '123456')).toBe(true);
    });
  });

  describe('passwordsMatch', () => {
    it('requires exact string equality', () => {
      expect(passwordsMatch('secret1', 'secret1')).toBe(true);
      expect(passwordsMatch('secret1', 'secret2')).toBe(false);
      expect(passwordsMatch('abc', 'abc ')).toBe(false);
    });
  });

  describe('isEmailPasswordRegistrationFormValid', () => {
    it('requires confirmation non-empty and matching password', () => {
      expect(isEmailPasswordRegistrationFormValid('u@uni.edu', '123456', '')).toBe(false);
      expect(isEmailPasswordRegistrationFormValid('u@uni.edu', '123456', '12345')).toBe(false);
      expect(isEmailPasswordRegistrationFormValid('u@uni.edu', '123456', '123456')).toBe(true);
    });

    it('reuses base email/password rules', () => {
      expect(isEmailPasswordRegistrationFormValid('bad', '123456', '123456')).toBe(false);
      expect(isEmailPasswordRegistrationFormValid('good@uni.edu', '12345', '12345')).toBe(false);
    });
  });
});
