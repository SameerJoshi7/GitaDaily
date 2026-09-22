import express from 'express';
import { Bookmark } from '../models/Bookmark.js';
import { Journal } from '../models/Journal.js';
import { History } from '../models/History.js';

const router = express.Router();

// --- Bookmarks ---
router.get('/bookmarks', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const bookmarks = await Bookmark.find({ email }).sort({ createdAt: -1 });
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
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const history = await History.find({ email }).sort({ viewedAt: -1 }).limit(50);
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

export default router;
