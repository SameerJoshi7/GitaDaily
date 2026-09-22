import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { User } from '../models/User.js';
import { QueryLog } from '../models/QueryLog.js';
import { getGitaData } from '../services/data.service.js';
import { generateContentWithFallback, getGenAIInstance } from '../services/ai.service.js';
import { GUIDANCE_PROMPT } from '../config/ai-prompts.js';

const router = express.Router();

// Rate limiter for guest (unauthenticated) guidance requests
const guestGuidanceLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 2, // 2 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  },
  skip: (req) => !!req.body.userId, // Skip rate limiting for authenticated users
  handler: (req, res) => {
    res.status(403).json({ error: 'Guest limit reached', requireSubscription: true });
  }
});

router.post('/', guestGuidanceLimiter, async (req, res) => {
  const { userId, email, query, language, userName } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Please describe the challenge or feeling you are facing.' });
  }

  let clientIp = req.socket.remoteAddress || 'unknown';
  if (req.headers['x-forwarded-for']) {
    clientIp = req.headers['x-forwarded-for'].split(',')[0].trim();
  }

  const lang = (language || 'english').toLowerCase();
  const gitaData = getGitaData();

  // Helper to log query with geolocation asynchronously
  const logQueryInBackground = async (suggestedChapter, suggestedVerse) => {
    try {
      let location = 'unknown';
      if (clientIp !== 'unknown' && clientIp !== '127.0.0.1' && clientIp !== '::1') {
        try {
          const geoRes = await fetch(`https://get.geojs.io/v1/ip/geo/${clientIp}.json`);
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.city && geo.country) {
              location = `${geo.city}, ${geo.country}`;
            } else if (geo.country) {
              location = geo.country;
            }
          }
        } catch (e) {
          console.error('[Geo] Error:', e.message);
        }
      }
      const logEntry = {
        query,
        language: lang,
        suggestedChapter,
        suggestedVerse,
        location
      };
      if (userId) {
        logEntry.userId = userId;
        await QueryLog.create(logEntry);
        
        // Optimize DB storage: Keep only the 5 most recent queries per user
        const userQueries = await QueryLog.find({ userId }).sort({ createdAt: -1 });
        if (userQueries.length > 5) {
          const queriesToDelete = userQueries.slice(5).map(q => q._id);
          await QueryLog.deleteMany({ _id: { $in: queriesToDelete } });
        }
      } else {
        await QueryLog.create(logEntry);
      }
    } catch (err) {
      console.error('[Guidance] Failed to log query:', err);
    }
  };

  const genAI = getGenAIInstance();
  if (!genAI) {
    return res.status(500).json({ error: 'Gemini AI is not configured on this server.' });
  }

  let contextPrompt = '';
  let userRecord = null;
  if (email) {
    try {
      userRecord = await User.findOne({ email });
      if (userRecord && userRecord.guidanceHistory && userRecord.guidanceHistory.length > 0) {
        const history = userRecord.guidanceHistory.slice(-3).map((entry, i) => `${i + 1}. "${entry.query}"`).join('\n');
        contextPrompt = `\n[MEMORY CONTEXT]: The user has recently sought guidance on these topics:\n${history}\nKeep this continuity in mind if it relates to their current query. Subtly acknowledge their ongoing journey if appropriate.\n`;
      }
    } catch (err) {
      console.error('[Guidance] Error fetching user history:', err);
    }
  }

  try {
    const addressName = userName && userName.trim() !== '' ? userName.trim() : "";
    const prompt = GUIDANCE_PROMPT(query, addressName, contextPrompt, language);

    console.log(`[Guidance] Seeking counsel for query: "${query}" in language: ${lang}`);
    const result = await generateContentWithFallback(prompt, "application/json", "guidance");
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    // Retrieve the full original shloka to get Sanskrit, etc. if it exists locally
    const originalShloka = gitaData.find(s => s.chapter === parsed.selectedChapter && s.verse === parsed.selectedVerse);

    if (userRecord) {
      userRecord.guidanceHistory.push({ query });
      if (userRecord.guidanceHistory.length > 3) {
        userRecord.guidanceHistory = userRecord.guidanceHistory.slice(-3);
      }
      userRecord.lastGuidanceAt = new Date();
      userRecord.save().catch(err => console.error('[Guidance] Failed to save history:', err));
    }

    // Async log the query to MongoDB AFTER we get the chapter and verse
    logQueryInBackground(parsed.selectedChapter, parsed.selectedVerse);

    res.json({
      success: true,
      query,
      shloka: {
        chapter: parsed.selectedChapter,
        verse: parsed.selectedVerse,
        sanskrit: originalShloka ? originalShloka.sanskrit : parsed.sanskrit,
        transliteration: parsed.translatedTransliteration || (originalShloka ? originalShloka.transliteration : parsed.transliteration),
        translation: parsed.translatedTranslation || (originalShloka ? originalShloka.translation : parsed.translation),
        theme: originalShloka ? originalShloka.theme : parsed.theme,
      },
      counsel: {
        modernCounsel: parsed.modernCounsel,
        wellbeingInsight: parsed.wellbeingInsight,
        actionStep: parsed.actionStep
      }
    });
  } catch (error) {
    if (error.status === 429) {
      return res.status(429).json({ error: 'High traffic: The divine servers are currently busy. Please wait a moment and try again.', retryAfter: 30 });
    }
    
    // Explicitly handle unauthorized/invalid keys
    if (error.status === 401 || error.status === 403) {
      return res.status(500).json({ error: `AI Authentication Failed: The API key provided is invalid or out of credits. (${error.message})` });
    }

    console.error('[Guidance] Error fetching Gita counsel, using offline fallback:', error);
    try {
      const queryLower = query.toLowerCase();

      // Basic scoring of shlokas offline
      let bestShloka = gitaData[0];
      let bestScore = -1;

      for (const shloka of gitaData) {
        let score = 0;

        if (shloka.topics && Array.isArray(shloka.topics)) {
          for (const topic of shloka.topics) {
            if (shloka.chapter === 8 && shloka.verse === 5 && topic === 'focus') {
              continue;
            }
            if (queryLower.includes(topic.toLowerCase())) {
              score += 10;
            }
          }
        }

        if (shloka.translation && shloka.translation.toLowerCase().includes(queryLower)) {
          score += 5;
        }

        if (score > bestScore) {
          bestScore = score;
          bestShloka = shloka;
        }
      }

      if (bestScore === -1 && gitaData.length > 0) {
        bestShloka = gitaData[Math.floor(Math.random() * gitaData.length)];
      }

      const modernCounsel = `When the mind is clouded by "${query}", turn to the eternal wisdom of the Gita. This verse reminds us that true peace comes from understanding our divine nature and performing our duties without attachment to the results. Focus on the action, not the fruit.`;
      const wellbeingInsight = `Acknowledge your feelings, but do not let them define you. You are the eternal soul, untouched by temporary sorrows.`;
      const actionStep = `Take a deep breath. Release your anxieties to the Divine. Perform your next immediate task with complete dedication.`;

      let transToUse = bestShloka.translation;
      let translitToUse = bestShloka.transliteration;

      if (bestShloka.localizations && bestShloka.localizations[lang]) {
        transToUse = bestShloka.localizations[lang].translation || bestShloka.translation;
        translitToUse = bestShloka.localizations[lang].transliteration || bestShloka.transliteration;
      }

      res.json({
        success: true,
        query,
        shloka: {
          chapter: bestShloka.chapter,
          verse: bestShloka.verse,
          sanskrit: bestShloka.sanskrit,
          transliteration: translitToUse,
          translation: transToUse,
          theme: bestShloka.theme
        },
        counsel: {
          modernCounsel: `[OFFLINE MODE - AI UNREACHABLE]\n\n${modernCounsel}`,
          wellbeingInsight,
          actionStep
        }
      });
    } catch (fallbackErr) {
      console.error('[Guidance] Critical failure in guidance offline fallback:', fallbackErr);
      res.status(500).json({ error: 'Failed to seek divine guidance. Please try again.' });
    }
  }
});

export default router;
