import express from 'express';
import { User } from '../models/User.js';
import { generateOTP, verifyOTP } from '../utils/otp.js';
import { sendEmailOTP } from '../utils/mailer.js';
import { z } from 'zod';

const router = express.Router();

// Input Schemas
const SendOtpSchema = z.object({
  identifier: z.string().email('Valid email address is required.')
});

const VerifyOtpSchema = z.object({
  identifier: z.string().email('Valid email address is required.'),
  otp: z.string().length(6, 'OTP must be exactly 6 characters.')
});

// 0a. Send OTP
router.post('/send-otp', async (req, res) => {
  const parseResult = SendOtpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }
  
  const { identifier } = parseResult.data;

  try {
    const existing = await User.findOne({ email: identifier.toLowerCase() });
    if (!existing) {
      return res.status(404).json({ error: 'User not found. Please subscribe as a new user.' });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    return res.status(500).json({ error: 'Database error' });
  }

  const otp = await generateOTP(identifier);

  // Send via Email
  const result = await sendEmailOTP(identifier, otp);
  if (!result.success) {
    return res.status(500).json({ error: result.error || 'Failed to send email OTP.' });
  }

  return res.json({ message: 'OTP sent via Email' });
});

// 0b. Verify OTP
router.post('/verify-otp', async (req, res) => {
  const parseResult = VerifyOtpSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0].message });
  }

  const { identifier, otp } = parseResult.data;

  const result = await verifyOTP(identifier, otp);
  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid OTP.' });
  }

  // Check if the user already exists in MongoDB
  try {
    const existing = await User.findOne({ email: identifier.toLowerCase() });
    if (existing) {
      return res.json({ 
        verified: true, 
        isNewUser: false, 
        user: existing 
      });
    }

    return res.json({ verified: true, isNewUser: true });
  } catch (err) {
    console.error("Error checking user post-OTP:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// 0c. Register New User
router.post('/register', async (req, res) => {
  const { email, userName, language, pref } = req.body;
  if (!email || !userName) {
    return res.status(400).json({ error: 'Email and Name are required.' });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists. Please verify OTP to login.' });
    }

    const newUser = new User({
      email: email.toLowerCase(),
      userName,
      lang: language || 'english',
      pref: pref || 'none'
    });

    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error("Error registering user:", err);
    return res.status(500).json({ error: 'Database error during registration' });
  }
});

export default router;
