import express from 'express';
import { User } from '../models/User.js';

const router = express.Router();

// 1. Update Preferences (Without Web Push data, e.g. from Profile page)
router.put('/preferences', async (req, res) => {
  const { email, pref, language, lang, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (pref) user.pref = pref;
    if (language || lang) user.lang = language || lang;
    if (name !== undefined) user.name = name;
    
    await user.save();
    return res.json({ 
      message: 'Preferences updated successfully', 
      pref: user.pref, 
      lang: user.lang, 
      name: user.name 
    });
  } catch (err) {
    console.error('Failed to update preferences:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Unsubscribe / Delete Account
router.delete('/:userId', async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.userId);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper for streak calculation
function calculateStreak(lastActiveDate, currentStreak = 0, longestStreak = 0, nowDate = new Date()) {
  const now = new Date(nowDate);
  now.setHours(0, 0, 0, 0);

  let lastActive = lastActiveDate ? new Date(lastActiveDate) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  // Calculate day difference
  let diffDays = 0;
  if (lastActive) {
    const timeDiff = now.getTime() - lastActive.getTime();
    diffDays = Math.floor(timeDiff / (1000 * 3600 * 24));
  }

  let newStreak = currentStreak;
  
  if (!lastActive) {
    newStreak = 1; // First time ever
  } else if (diffDays === 1) {
    newStreak += 1; // Consecutive day
  } else if (diffDays > 1) {
    newStreak = 1; // Streak broken
  }
  // if diffDays === 0, they already logged in today, streak remains same

  let newLongest = Math.max(longestStreak, newStreak);

  return { currentStreak: newStreak, longestStreak: newLongest };
}

// 3. Mark User Active (Streak Tracking)
router.post('/active', async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const { currentStreak, longestStreak } = calculateStreak(
      user.lastActiveAt, 
      user.currentStreak, 
      user.longestStreak, 
      now
    );

    user.lastActiveAt = now;
    user.missedDaysCount = 0;
    user.currentStreak = currentStreak;
    user.longestStreak = longestStreak;
    
    await user.save();

    res.json({ currentStreak, longestStreak, lastActiveAt: user.lastActiveAt });
  } catch (err) {
    console.error('[Tracking] Active endpoint failed:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message, stack: err.stack });
  }
});

// Check guidance limits / ping
router.post('/guidance-ping', async (req, res) => {
  const { userId, email } = req.body;
  if (!userId && !email) {
    return res.status(400).json({ error: 'User ID or Email required' });
  }

  try {
    let query = {};
    if (userId) query._id = userId;
    else if (email) query.email = email.toLowerCase();

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // In a real app we'd increment their limit here or verify it
    return res.json({ 
      guidanceUsedToday: user.guidanceUsedToday || 0 
    });
  } catch (err) {
    console.error('[Guidance Ping Error]', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
