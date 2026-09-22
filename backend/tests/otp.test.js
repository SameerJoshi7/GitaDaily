import { generateOTP, verifyOTP } from '../utils/otp.js';
import { Otp } from '../models/Otp.js';
import { jest } from '@jest/globals';

describe('OTP Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('generateOTP returns a 6-digit string', async () => {
    jest.spyOn(Otp, 'findOneAndUpdate').mockResolvedValueOnce({});
    const otp = await generateOTP('test@example.com');
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
    expect(Otp.findOneAndUpdate).toHaveBeenCalled();
  });

  test('generateOTP returns different values on successive calls', async () => {
    jest.spyOn(Otp, 'findOneAndUpdate').mockResolvedValue({});
    const otp1 = await generateOTP('a@test.com');
    const otp2 = await generateOTP('b@test.com');
    // They could theoretically match, but probability is very low
    expect(typeof otp1).toBe('string');
    expect(typeof otp2).toBe('string');
    expect(otp1).not.toBe(otp2);
  });

  test('verifyOTP returns valid=true for correct OTP', async () => {
    const mockOtp = '123456';
    jest.spyOn(Otp, 'findOne').mockResolvedValueOnce({ _id: '123', otp: mockOtp });
    jest.spyOn(Otp, 'deleteOne').mockResolvedValueOnce({});

    const result = await verifyOTP('user@test.com', mockOtp);
    expect(result.valid).toBe(true);
    expect(Otp.deleteOne).toHaveBeenCalled();
  });

  test('verifyOTP returns valid=false for incorrect OTP', async () => {
    const mockOtp = '123456';
    jest.spyOn(Otp, 'findOne').mockResolvedValueOnce({ _id: '123', otp: mockOtp });

    const result = await verifyOTP('wrongtest@test.com', '000000');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('verifyOTP returns valid=false for unknown identifier', async () => {
    jest.spyOn(Otp, 'findOne').mockResolvedValueOnce(null);
    const result = await verifyOTP('notregistered@test.com', '123456');
    expect(result.valid).toBe(false);
  });

  test('verifyOTP deletes OTP after successful use (one-time use)', async () => {
    const mockOtp = '123456';
    
    // First call succeeds and deletes
    jest.spyOn(Otp, 'findOne').mockResolvedValueOnce({ _id: '123', otp: mockOtp });
    jest.spyOn(Otp, 'deleteOne').mockResolvedValueOnce({});
    const firstUse = await verifyOTP('oneuse@test.com', mockOtp);
    expect(firstUse.valid).toBe(true);

    // Second call finds nothing
    jest.spyOn(Otp, 'findOne').mockResolvedValueOnce(null);
    const secondUse = await verifyOTP('oneuse@test.com', mockOtp);
    expect(secondUse.valid).toBe(false);
  });
});
