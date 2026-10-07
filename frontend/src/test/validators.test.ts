import { describe, it, expect } from 'vitest';

export const validatePhone = (phone: string): boolean => {
  const clean = phone.replace(/\s/g, '');
  return /^0\d{9}$/.test(clean);
};

export const validateEmail = (email: string): boolean => {
  return /^\S+@\S+\.\S+$/.test(email.trim());
};

export const validateFeedback = (name: string, email: string, message: string): boolean => {
  return Boolean(name.trim()) && validateEmail(email) && message.trim().length >= 10;
};

describe('validators', () => {
  describe('validatePhone', () => {
    it('accepts valid 10-digit phone numbers starting with 0', () => {
      expect(validatePhone('0900000000')).toBe(true);
      expect(validatePhone('0912345678')).toBe(true);
      expect(validatePhone('090 000 0000')).toBe(true);
    });

    it('rejects numbers not starting with 0 or wrong length', () => {
      expect(validatePhone('1234567890')).toBe(false);
      expect(validatePhone('0900')).toBe(false);
      expect(validatePhone('090000000000')).toBe(false);
      expect(validatePhone('abcdefghij')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('accepts standard email addresses', () => {
      expect(validateEmail('hello@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.vn')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('not-an-email')).toBe(false);
      expect(validateEmail('missing@domain')).toBe(false);
      expect(validateEmail('@missinguser.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateFeedback', () => {
    it('validates name, email and message >= 10 characters', () => {
      expect(validateFeedback('Nam', 'nam@gmail.com', 'Dự án rất tuyệt vời!')).toBe(true);
      expect(validateFeedback('', 'nam@gmail.com', 'Dự án rất tuyệt vời!')).toBe(false);
      expect(validateFeedback('Nam', 'wrong-email', 'Dự án rất tuyệt vời!')).toBe(false);
      expect(validateFeedback('Nam', 'nam@gmail.com', 'Ngắn')).toBe(false);
    });
  });
});
