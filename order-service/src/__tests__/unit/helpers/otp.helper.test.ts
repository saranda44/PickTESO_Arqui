import { describe, it, expect, beforeEach } from 'vitest';
import { generateOTP, validateOTP } from '../../../helpers/otp.helper';

describe('OTP Helper', () => {
  const userId = 123;
  const orderId = 456;

  it('should generate a 6-digit OTP', () => {
    const otp = generateOTP(userId, orderId);
    expect(otp).toMatch(/^\d{6}$/);
  });

  it('should generate deterministic OTP for same inputs', () => {
    const otp1 = generateOTP(userId, orderId);
    const otp2 = generateOTP(userId, orderId);
    expect(otp1).toBe(otp2);
  });

  it('should generate different OTP for different userId', () => {
    const otp1 = generateOTP(userId, orderId);
    const otp2 = generateOTP(999, orderId);
    expect(otp1).not.toBe(otp2);
  });

  it('should generate different OTP for different orderId', () => {
    const otp1 = generateOTP(userId, orderId);
    const otp2 = generateOTP(userId, 999);
    expect(otp1).not.toBe(otp2);
  });

  it('should validate correct OTP', () => {
    const otp = generateOTP(userId, orderId);
    const isValid = validateOTP(otp, userId, orderId);
    expect(isValid).toBe(true);
  });

  it('should reject invalid OTP', () => {
    const isValid = validateOTP('000000', userId, orderId);
    expect(isValid).toBe(false);
  });

  it('should reject OTP with wrong userId', () => {
    const otp = generateOTP(userId, orderId);
    const isValid = validateOTP(otp, 999, orderId);
    expect(isValid).toBe(false);
  });

  it('should reject OTP with wrong orderId', () => {
    const otp = generateOTP(userId, orderId);
    const isValid = validateOTP(otp, userId, 999);
    expect(isValid).toBe(false);
  });
});
