import express from 'express';
import { User } from '../models/User.js';
import { getDailyShloka, getShlokaByVerse, getChapters, getGitaData } from '../services/data.service.js';
import { getGeminiReflection } from '../services/ai.service.js';

const router = express.Router();

// Helper to extract user's preferred language from DB
async function getUserLanguage(email, req) {
  const queryLang = req.query.language || req.query.lang;
  if (queryLang) return queryLang.toLowerCase();
  
  if (!email) return 'english';
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return user && user.lang ? user.lang : 'english';
  } catch (err) {
    return 'english';
  }
}

// 1. Get Daily Shloka
router.get('/daily', async (req, res) => {
  const shloka = getDailyShloka();
  if (!shloka) {
    return res.status(500).json({ error: 'Gita dataset is empty.' });
  }

  const { email } = req.query;
  const language = await getUserLanguage(email, req);

  const reflection = await getGeminiReflection(shloka, language);

  res.json({
    ...shloka,
    reflection
  });
});

// 2. Get Chapters List
router.get('/chapters', (req, res) => {
  const chapters = getChapters().map(ch => ({
    ...ch,
    verses: Array.from({ length: ch.versesCount }, (_, i) => i + 1)
  }));
  res.json(chapters);
});

// 3. Search Shlokas
router.get('/search', (req, res) => {
  const { q } = req.query;
  const gitaData = getGitaData();
  
  if (!q) return res.json([]);
  if (gitaData.length === 0) return res.json([]);
  
  const query = q.toLowerCase().trim();
  
  // Try to parse "chapter.verse" format (e.g. "2.47")
  const numMatch = query.match(/^(\d+)[.\s:]+(\d+)$/);
  if (numMatch) {
    const ch = parseInt(numMatch[1]);
    const ve = parseInt(numMatch[2]);
    const specific = gitaData.find(s => s.chapter === ch && s.verse === ve);
    if (specific) return res.json([specific]);
  }

  // Text search in sanskrit, translation, transliteration
  const results = gitaData.filter(s => {
    return (s.sanskrit && s.sanskrit.toLowerCase().includes(query)) ||
           (s.translation && s.translation.toLowerCase().includes(query)) ||
           (s.transliteration && s.transliteration.toLowerCase().includes(query));
  }).slice(0, 10); // Limit to 10 results for performance
  
  res.json(results);
});

// 4. Get Specific Shloka
router.get('/:chapter/:verse', async (req, res) => {
  const chapter = parseInt(req.params.chapter);
  const verse = parseInt(req.params.verse);
  const { email } = req.query;
  const language = await getUserLanguage(email, req);

  let shloka = getShlokaByVerse(chapter, verse);

  if (!shloka) {
    return res.status(404).json({ error: 'Shloka not found in local dataset.' });
  }

  const reflection = await getGeminiReflection(shloka, language);

  res.json({
    ...shloka,
    reflection
  });
});

export default router;
