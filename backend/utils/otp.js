const otpStore = new Map();

// Generate a random 6-digit OTP
export const generateOTP = (identifier) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  // Store OTP with an expiration of 5 minutes (300000 ms)
  otpStore.set(identifier, {
    otp,
    expiresAt: Date.now() + 300000,
  });
  return otp;
};

// Validate the OTP
export const verifyOTP = (identifier, inputOtp) => {
  const record = otpStore.get(identifier);
  if (!record) return { valid: false, error: 'OTP expired or not found' };

  if (Date.now() > record.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, error: 'OTP expired' };
  }

  if (record.otp === inputOtp) {
    otpStore.delete(identifier); // Clean up after successful use
    return { valid: true };
  }

  return { valid: false, error: 'Invalid OTP' };
};
