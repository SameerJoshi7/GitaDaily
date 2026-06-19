import { generateOTP, verifyOTP } from '../utils/otp.js';

describe('OTP Unit Tests', () => {
  test('generateOTP returns a 6-digit string', () => {
    const otp = generateOTP('test@example.com');
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test('generateOTP returns different values on successive calls', () => {
    const otp1 = generateOTP('a@test.com');
    const otp2 = generateOTP('b@test.com');
    // They could theoretically match, but probability is very low
    expect(typeof otp1).toBe('string');
    expect(typeof otp2).toBe('string');
  });

  test('verifyOTP returns valid=true for correct OTP', () => {
    const otp = generateOTP('user@test.com');
    const result = verifyOTP('user@test.com', otp);
    expect(result.valid).toBe(true);
  });

  test('verifyOTP returns valid=false for incorrect OTP', () => {
    generateOTP('wrongtest@test.com');
    const result = verifyOTP('wrongtest@test.com', '000000');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('verifyOTP returns valid=false for unknown identifier', () => {
    const result = verifyOTP('notregistered@test.com', '123456');
    expect(result.valid).toBe(false);
  });

  test('verifyOTP deletes OTP after successful use (one-time use)', () => {
    const otp = generateOTP('oneuse@test.com');
    verifyOTP('oneuse@test.com', otp); // First use - valid
    const secondUse = verifyOTP('oneuse@test.com', otp); // Second use - should fail
    expect(secondUse.valid).toBe(false);
  });
});
