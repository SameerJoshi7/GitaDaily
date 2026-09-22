import { Otp } from '../models/Otp.js';

// Generate a random 6-digit OTP and persist to MongoDB (auto-expires via TTL index)
export const generateOTP = async (identifier) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Upsert: replace any existing OTP for this identifier
  await Otp.findOneAndUpdate(
    { identifier: identifier.toLowerCase() },
    { otp, createdAt: new Date() },
    { upsert: true, new: true }
  );
  
  return otp;
};

// Validate the OTP against MongoDB store
export const verifyOTP = async (identifier, inputOtp) => {
  const record = await Otp.findOne({ identifier: identifier.toLowerCase() });
  
  if (!record) {
    return { valid: false, error: 'OTP expired or not found. Please request a new one.' };
  }

  if (record.otp === inputOtp) {
    // Clean up after successful verification
    await Otp.deleteOne({ _id: record._id });
    return { valid: true };
  }

  return { valid: false, error: 'Invalid OTP. Please check and try again.' };
};
