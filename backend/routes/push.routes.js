import express from 'express';
import { User } from '../models/User.js';
import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// 1. Subscribe User / Set Preferences
router.post('/subscribe', async (req, res) => {
  const { email, pushSubscription, pref = 'email', language = 'english' } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Valid email address is required to subscribe.' });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        email: email.toLowerCase(),
        pushSubscription,
        pref,
        lang: language,
        currentStreak: 0,
        longestStreak: 0,
        lastActiveAt: new Date(),
        missedDaysCount: 0
      });
    } else {
      if (pushSubscription) user.pushSubscription = pushSubscription;
      user.pref = pref;
      user.lang = language;
    }
    
    await user.save();
    return res.status(200).json({ message: 'Preferences updated successfully.', user });
  } catch (err) {
    console.error("Error saving user:", err);
    return res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

// 2. Get Public VAPID Key for frontend
router.get('/public-key', (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(500).json({ error: 'VAPID public key not configured on server.' });
  }
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// 3. Test Push Delivery
router.post('/test-delivery', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.pushSubscription) {
      return res.status(404).json({ error: 'User or push subscription not found' });
    }

    const payload = JSON.stringify({
      title: '🦚 GitaDaily Test Notification',
      body: 'If you see this, push notifications are working perfectly!',
      url: '/'
    });

    await webpush.sendNotification(user.pushSubscription, payload);
    res.json({ message: 'Test notification sent successfully!' });
  } catch (err) {
    console.error('[WebPush Test] Failed:', err);
    res.status(500).json({ error: 'Failed to process test delivery.' });
  }
});

export default router;
