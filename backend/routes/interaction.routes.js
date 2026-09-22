import express from 'express';
import { Bookmark } from '../models/Bookmark.js';
import { Journal } from '../models/Journal.js';
import { History } from '../models/History.js';

const router = express.Router();

// --- Bookmarks ---
router.get('/bookmarks', async (req, res) => {
  const { email, userId } = req.query;
  if (!email && !userId) return res.status(400).json({ error: 'Email or User ID required' });

  try {
    let query = {};
    if (email) query.email = email;
    else if (userId) query.userId = userId;
    
    const bookmarks = await Bookmark.find(query).sort({ createdAt: -1 });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/bookmarks', async (req, res) => {
  const { email, chapter, verse } = req.body;
  if (!email || !chapter || !verse) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await Bookmark.findOne({ email, chapter, verse });
    if (existing) return res.json({ message: 'Already bookmarked', bookmark: existing });

    const newBookmark = new Bookmark({ email, chapter, verse });
    await newBookmark.save();
    res.json({ message: 'Bookmark added', bookmark: newBookmark });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/bookmarks/:chapter/:verse', async (req, res) => {
  const { email } = req.query;
  const { chapter, verse } = req.params;
  
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    await Bookmark.findOneAndDelete({ email, chapter, verse });
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Journals ---
router.get('/journal', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const entries = await Journal.find({ email }).sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/journal', async (req, res) => {
  const { email, chapter, verse, note } = req.body;
  if (!email || !chapter || !verse || !note) return res.status(400).json({ error: 'Missing fields' });

  try {
    let journal = await Journal.findOne({ email, chapter, verse });
    if (journal) {
      journal.note = note;
    } else {
      journal = new Journal({ email, chapter, verse, note });
    }
    await journal.save();
    res.json({ message: 'Journal saved', journal });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/journal/:chapter/:verse', async (req, res) => {
  const { email } = req.query;
  const { chapter, verse } = req.params;
  
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    await Journal.findOneAndDelete({ email, chapter, verse });
    res.json({ message: 'Journal removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// --- History ---
router.get('/history', async (req, res) => {
  const { email, userId } = req.query;
  if (!email && !userId) return res.status(400).json({ error: 'Email or User ID required' });

  try {
    let query = {};
    if (email) query.email = email;
    else if (userId) query.userId = userId;

    const history = await History.find(query).sort({ viewedAt: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/history', async (req, res) => {
  const { email, chapter, verse } = req.body;
  if (!email || !chapter || !verse) return res.status(400).json({ error: 'Missing fields' });

  try {
    const existing = await History.findOne({ email, chapter, verse });
    if (existing) {
      existing.viewedAt = new Date();
      await existing.save();
    } else {
      const newHistory = new History({ email, chapter, verse });
      await newHistory.save();
    }
    res.json({ message: 'History updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Submit Feedback
router.post('/feedback', async (req, res) => {
  try {
    // In a real app we'd save this to a Feedback model
    // For now we'll just acknowledge it
    console.log('[Feedback Received]:', req.body);
    return res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// 7. Get user feedback (stub)
router.get('/feedback/:email', async (req, res) => {
  return res.json([]);
});

export default router;
