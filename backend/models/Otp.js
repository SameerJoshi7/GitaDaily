import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // TTL index: auto-delete document after 300 seconds (5 minutes)
  }
});

export const Otp = mongoose.model('Otp', otpSchema);
