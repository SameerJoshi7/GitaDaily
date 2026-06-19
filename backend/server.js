import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import cron from 'node-cron';
import twilio from 'twilio';
import webpush from 'web-push';
import { generateOTP, verifyOTP } from './utils/otp.js';
import { sendEmailOTP, sendDailyShlokaEmail } from './utils/mailer.js';
import { sendTelegramShloka, startTelegramPolling } from './utils/telegram.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Web Push configuration
let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log('[WebPush] VAPID keys not fully set in .env. Generating one-time keys...');
  const generated = webpush.generateVAPIDKeys();
  vapidKeys.publicKey = generated.publicKey;
  vapidKeys.privateKey = generated.privateKey;
  console.log(`[WebPush] PUBLIC KEY: ${vapidKeys.publicKey}`);
  console.log(`[WebPush] PRIVATE KEY: ${vapidKeys.privateKey}`);
  console.log('[WebPush] Save these in your backend .env to keep them persistent!');
}

webpush.setVapidDetails(
  'mailto:sameer9032@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data files paths
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const GITA_DATA_PATH = path.join(__dirname, 'gita_data.json');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const BOOKMARKS_PATH = path.join(DATA_DIR, 'bookmarks.json');
const REFLECTIONS_CACHE_PATH = path.join(DATA_DIR, 'reflections.json');

// Initialize local JSON DB files
const initFile = (filePath, defaultData) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initFile(USERS_PATH, []);
initFile(BOOKMARKS_PATH, []);
initFile(REFLECTIONS_CACHE_PATH, {});

// Read data helper
const readData = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Error reading ${filePath}`, e);
    return [];
  }
};

// Write data helper
const writeData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(`Error writing ${filePath}`, e);
  }
};

// Normalize phone numbers to E.164 format, default to Indian country code (+91) if 10 digits
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  if (phone.includes('@')) return phone; // Skip email addresses

  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (phone.trim().startsWith('+')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

// Load Gita Data
let gitaData = [];
try {
  gitaData = JSON.parse(fs.readFileSync(GITA_DATA_PATH, 'utf-8'));
} catch (e) {
  console.error("Critical error: Could not read gita_data.json", e);
}

// Initialize Gemini Client
const aiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (aiKey) {
  genAI = new GoogleGenerativeAI(aiKey);
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set.");
}

// Helper to generate reflection using Gemini
async function getGeminiReflection(shloka, language = 'english') {
  if (!genAI) {
    return {
      modernReflection: "Connect with your inner wisdom to find strength in action.",
      emotionalWellbeing: "Maintain equanimity under all circumstances, acknowledging that feelings come and go.",
      careerApplication: "Focus entirely on the execution of your projects rather than obsessing over the promotional reward.",
      mindfulnessTip: "Take 3 deep breaths before starting any task and dedicate your effort to a higher purpose.",
      translatedTranslation: shloka.translation,
      translatedTransliteration: shloka.transliteration
    };
  }

  const langSuffix = (language || 'english').toLowerCase();
  const cacheKey = `${shloka.chapter}_${shloka.verse}_${langSuffix}`;
  const cache = readData(REFLECTIONS_CACHE_PATH);
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an enlightened guide analyzing the Bhagavad Gita for modern audiences.
      Analyze the following Gita Shloka:
      Chapter: ${shloka.chapter}, Verse: ${shloka.verse}
      Sanskrit Shloka:
      "${shloka.sanskrit}"
      
      English Translation:
      "${shloka.translation}"
      
      Provide a deep analysis explaining how this shloka applies to modern-day challenges, emotional well-being, mindfulness, and careers.
      
      You MUST respond and translate the analysis and translation into the following language: ${language}.
      
      Respond STRICTLY in JSON format with the following schema:
      {
        "translatedTransliteration": "The phonetic transliteration of the Sanskrit shloka written in the script of the chosen language: ${language} (e.g. Devanagari script for Hindi, Telugu script for Telugu, Kannada script for Kannada, Latin letters for English). Make it easy to read and phonetically accurate.",
        "translatedTranslation": "The direct translation of the Sanskrit shloka itself into the language: ${language}.",
        "modernReflection": "A detailed, eloquent paragraph (3-4 sentences) connecting this verse to modern societal pressures, relationships, and self-understanding, written in the language: ${language}.",
        "emotionalWellbeing": "Practical advice (2-3 sentences) on mental health, anxiety, self-compassion, and stress management based on this verse, written in the language: ${language}.",
        "careerApplication": "Actionable career advice (2-3 sentences) regarding leadership, work ethic, overcoming professional failure, or professional focus, written in the language: ${language}.",
        "mindfulnessTip": "A simple 1-sentence mindful exercise or affirmation inspired directly by this verse to practice today, written in the language: ${language}."
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);

    // Save to cache
    cache[cacheKey] = parsed;
    writeData(REFLECTIONS_CACHE_PATH, cache);

    return parsed;
  } catch (error) {
    console.error(`Error generating Gemini reflection for ${language}:`, error);
    // Return localized fallback on error
    const lang = (language || 'english').toLowerCase();
    let trans = shloka.translation;
    let translit = shloka.transliteration;

    if (shloka.localizations && shloka.localizations[lang]) {
      trans = shloka.localizations[lang].translation;
      translit = shloka.localizations[lang].transliteration;
    }

    if (lang === 'hindi') {
      return {
        translatedTranslation: trans,
        translatedTransliteration: translit,
        modernReflection: "प्राचीन ज्ञान हमें याद दिलाता है कि आत्म-खोज आधुनिक जीवन की जटिलताओं पर विजय पाने का सर्वोत्तम साधन है।",
        emotionalWellbeing: "भावनाएं लहरों की तरह आती-जाती हैं; स्वयं को स्थिर रखकर उन्हें महसूस करें और बह जाने दें।",
        careerApplication: "कर्म के परिणाम की अत्यधिक चिंता किए बिना अपने व्यावसायिक कर्तव्यों को पूरी लगन से निभाएं।",
        mindfulnessTip: "पुष्टि करें: 'मैं शांत हूँ, एकाग्र हूँ, और परिणामों से अनासक्त हूँ।'"
      };
    } else if (lang === 'telugu') {
      return {
        translatedTranslation: trans,
        translatedTransliteration: translit,
        modernReflection: "ఆధునిక సవాళ్లను అధిగమించడానికి ఆత్మపరిశీలనే నిజమైన సాధనం అని మన పురాతన జ్ఞానం గుర్తుచేస్తుంది.",
        emotionalWellbeing: "భావోద్వేగాలు సముద్రపు అలల లాంటివి; మీ ప్రశాಂತతను కోల్పోకుండా వాటిని రానిచ్చి పోనివ్వండి.",
        careerApplication: "ఫలితాల పట్ల అతిగా ఆశపడకుండా, మీ వృత్తిపరమైన బాధ్యతలను పూర్తి నిబద్ధతతో నిర్వహించండి.",
        mindfulnessTip: "ధృవీకరించుకోండి: 'నేను స్థిరంగా ఉన్నాను, కేంద్రీకృతంగా ఉన్నాను, ఫలితాలకు దూరంగా ఉన్నాను.'"
      };
    } else if (lang === 'kannada') {
      return {
        translatedTranslation: trans,
        translatedTransliteration: translit,
        modernReflection: "ಆಧುನಿಕ ಯುಗದ ಸಂಕೀರ್ಣ ಸವಾಲುಗಳನ್ನು ಎದುರಿಸಲು ನಮಗೆ ಆತ್ಮಾವಲೋಕನವೇ ಪರಮ ಅಸ್ತ್ರ ಎಂದು ಪುರಾತನ ಜ್ಞಾನವು ನೆನಪಿಸುತ್ತದೆ.",
        emotionalWellbeing: "ಭಾವನೆಗಳು ಬಂದು ಹೋಗುವ ಅಲೆಗಳಿದ್ದಂತೆ; ನಿಮ್ಮ ಮನಸ್ಸಿನ ಶಾಂತಿಯನ್ನು ಕಳೆದುಕೊಳ್ಳದೆ ಅವುಗಳನ್ನು ಸಹಜವಾಗಿ ಸ್ವೀಕರಿಸಿ.",
        careerApplication: "ಫಲಿತಾಂಶಗಳ ಬಗ್ಗೆ ಅತಿಯಾಗಿ ಯೋಚಿಸದೆ, ನಿಮ್ಮ ವೃತ್ತಿಪರ ಕರ್ತವ್ಯವನ್ನು ಸಂಪೂರ್ಣ ಬದ್ಧತೆಯಿಂದ ನಿರ್ವಹಿಸಿ.",
        mindfulnessTip: "ಮನದಟ್ಟು ಮಾಡಿಕೊಳ್ಳಿ: 'ನಾನು ಪ್ರಶಾಂತನಾಗಿದ್ದೇನೆ, ಏಕಾಗ್ರತೆಯಿಂದ ಇದ್ದೇನೆ ಮತ್ತು ಫಲಿತಾಂಶಗಳಿಂದ ಮುಕ್ತನಾಗಿದ್ದೇನೆ.'"
      };
    }

    return {
      translatedTranslation: trans,
      translatedTransliteration: translit,
      modernReflection: "Ancient wisdom reminds us that self-discovery is the ultimate tool to overcome modern-day complexities.",
      emotionalWellbeing: "Emotions are like passing waves; let them rise and fall without losing your centeredness.",
      careerApplication: "Perform your professional duty with commitment, while releasing attachment to the exact outcomes.",
      mindfulnessTip: "Affirm: 'I am centered, focused, and detached from results.'"
    };
  }
}

// Routes

// 0a. Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  let { identifier } = req.body; // identifier = email
  if (!identifier || !identifier.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const otp = generateOTP(identifier);

  // Send via Email
  const result = await sendEmailOTP(identifier, otp);
  if (!result.success && !result.simulated) {
    return res.status(500).json({ error: 'Failed to send email OTP.' });
  }
  // In dev mode (no email configured), return the OTP directly for testing
  if (result.simulated) {
    console.log(`[DEV] OTP for ${identifier}: ${otp}`);
    return res.json({ message: 'OTP simulated (no email config). Check server logs.', devOtp: otp });
  }
  return res.json({ message: 'OTP sent via Email' });
});

// 0b. Verify OTP
app.post('/api/auth/verify-otp', (req, res) => {
  let { identifier, otp } = req.body;
  if (!identifier || !otp) {
    return res.status(400).json({ error: 'Identifier and OTP are required.' });
  }

  const result = verifyOTP(identifier, otp);
  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid OTP.' });
  }

  // Check if the user already exists
  const users = readData(USERS_PATH);
  const existing = users.find(u =>
    typeof u === 'object' && u !== null && u.email === identifier
  );

  if (existing) {
    // Existing user - return their full profile (Login)
    return res.json({ verified: true, isNewUser: false, user: existing });
  } else {
    // New user - they need to complete registration
    return res.json({ verified: true, isNewUser: true });
  }
});

// 1. User Registration
app.post('/api/register', (req, res) => {
  const { email, phone, pref, lang } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  const users = readData(USERS_PATH);
  const index = users.findIndex(u => typeof u === 'object' && u !== null ? u.email === email : u === email);
  
  const newUser = { 
    email, 
    phone: phone ? normalizePhoneNumber(phone) : '', 
    pref: pref || 'email',
    lang: lang || 'english'
  };

  if (index >= 0) {
    users[index] = newUser;
  } else {
    users.push(newUser);
  }
  writeData(USERS_PATH, users);

  res.json({ message: 'Success', ...newUser });
});

// Helper to look up user language
function getUserLanguage(email) {
  if (!email) return 'english';
  const users = readData(USERS_PATH);
  const user = users.find(u => typeof u === 'object' && u !== null ? u.email === email : u === email);
  return user && user.lang ? user.lang : 'english';
}

// 2. Get Daily Shloka
app.get('/api/shloka/daily', async (req, res) => {
  if (gitaData.length === 0) {
    return res.status(500).json({ error: 'Gita dataset is empty.' });
  }

  const { email } = req.query;
  const language = getUserLanguage(email);

  // Calculate day-based index
  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % gitaData.length;

  const shloka = gitaData[index];
  const reflection = await getGeminiReflection(shloka, language);

  res.json({
    ...shloka,
    reflection
  });
});

// 3. Get Specific Shloka
app.get('/api/shloka/:chapter/:verse', async (req, res) => {
  const chapter = parseInt(req.params.chapter);
  const verse = parseInt(req.params.verse);
  const { email } = req.query;
  const language = getUserLanguage(email);

  const shloka = gitaData.find(s => s.chapter === chapter && s.verse === verse);
  if (!shloka) {
    return res.status(404).json({ error: 'Shloka not found.' });
  }

  const reflection = await getGeminiReflection(shloka, language);
  res.json({
    ...shloka,
    reflection
  });
});

// 4. Get Chapters List
app.get('/api/chapters', (req, res) => {
  // Group verses by chapter
  const chaptersMap = {};
  gitaData.forEach(s => {
    if (!chaptersMap[s.chapter]) {
      chaptersMap[s.chapter] = {
        chapterNumber: s.chapter,
        theme: s.theme,
        verses: []
      };
    }
    chaptersMap[s.chapter].verses.push(s.verse);
  });

  const chapters = Object.values(chaptersMap).sort((a, b) => a.chapterNumber - b.chapterNumber);
  res.json(chapters);
});

// 5. Search Shlokas
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }

  const query = q.toString().toLowerCase();
  const results = gitaData.filter(s => 
    s.translation.toLowerCase().includes(query) ||
    s.transliteration.toLowerCase().includes(query) ||
    s.theme.toLowerCase().includes(query) ||
    s.topics.some(topic => topic.toLowerCase().includes(query)) ||
    `ch${s.chapter}`.includes(query) ||
    `chapter ${s.chapter}`.includes(query)
  );

  res.json(results);
});

// 6. Get Bookmarks
app.get('/api/bookmarks', (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required.' });
  }

  const bookmarks = readData(BOOKMARKS_PATH);
  const userBookmarks = bookmarks.filter(b => b.email === email);
  
  // Hydrate with shloka data
  const hydrated = userBookmarks.map(b => {
    const shloka = gitaData.find(s => s.chapter === b.chapter && s.verse === b.verse);
    return shloka ? { ...shloka } : null;
  }).filter(Boolean);

  res.json(hydrated);
});

// 7. Add Bookmark
app.post('/api/bookmarks', (req, res) => {
  const { email, chapter, verse } = req.body;
  if (!email || !chapter || !verse) {
    return res.status(400).json({ error: 'Email, chapter, and verse are required.' });
  }

  const bookmarks = readData(BOOKMARKS_PATH);
  const exists = bookmarks.some(b => b.email === email && b.chapter === chapter && b.verse === verse);

  if (!exists) {
    bookmarks.push({ email, chapter, verse });
    writeData(BOOKMARKS_PATH, bookmarks);
  }

  res.json({ message: 'Bookmarked successfully' });
});

// 8. Delete Bookmark
app.delete('/api/bookmarks', (req, res) => {
  const { email, chapter, verse } = req.body;
  if (!email || !chapter || !verse) {
    return res.status(400).json({ error: 'Email, chapter, and verse are required.' });
  }

  let bookmarks = readData(BOOKMARKS_PATH);
  bookmarks = bookmarks.filter(b => !(b.email === email && b.chapter === chapter && b.verse === verse));
  writeData(BOOKMARKS_PATH, bookmarks);

  res.json({ message: 'Bookmark removed successfully' });
});

// WhatsApp Integration Config
const twilioSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
const HEADER_IMAGE_URL = 'https://upload.wikimedia.org/wikipedia/commons/e/e5/Krishna_and_Arjuna_on_the_chariot%2C_Mahabharata%2C_Kurukshetra_War.jpg';

let twilioClient = null;
if (twilioSid && twilioAuthToken) {
  twilioClient = twilio(twilioSid, twilioAuthToken);
}

const ARTWORKS = [
  'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/e/e5/Krishna_and_Arjuna_on_the_chariot%2C_Mahabharata%2C_Kurukshetra_War.jpg',
  'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/8/82/Gita_talk.jpg',
  'https://images.weserv.nl/?url=https://upload.wikimedia.org/wikipedia/commons/d/df/Vishvarupa.jpg'
];

function getArtworkForShloka(shloka) {
  if (!shloka || typeof shloka.chapter === 'undefined' || typeof shloka.verse === 'undefined') {
    return ARTWORKS[0];
  }
  return ARTWORKS[(shloka.chapter + shloka.verse) % ARTWORKS.length];
}

// Format message helper
function formatShlokaMessage(shloka, reflection, language = 'english') {
  const lang = (language || 'english').toLowerCase();
  
  // Custom headers based on language selection
  let title = '🪔 *GitaDaily: Daily Wisdom & AI Reflection* 🪔';
  let chLabel = 'Chapter';
  let vLabel = 'Verse';
  let sansLabel = 'Sanskrit';
  let translitLabel = 'Transliteration';
  let transLabel = 'Translation';
  let aiLabel = 'AI Reflection';
  let mindLabel = 'Mindfulness Practice';
  let artLabel = 'Sacred Art';
  let footer = 'Have a blessed and focused day! 🌸';

  if (lang === 'hindi') {
    title = '🪔 *गीताडेली: दैनिक ज्ञान और एआई चिंतन* 🪔';
    chLabel = 'अध्याय';
    vLabel = 'श्लोक';
    transLabel = 'अनुवाद';
    aiLabel = 'एआई चिंतन';
    mindLabel = 'आज का अभ्यास';
    footer = 'आपका दिन शुभ और मंगलमय हो! 🌸';
  } else if (lang === 'telugu') {
    title = '🪔 *గీతాడైలీ: దినసరి జ్ఞానం మరియు ఎఐ విశ్లేషణ* 🪔';
    chLabel = 'అధ్యాయం';
    vLabel = 'శ్లోకం';
    transLabel = 'అనువాదం';
    aiLabel = 'ఎఐ విశ్లేషణ';
    mindLabel = 'నేటి సాధన';
    footer = 'ఈ రోజు మీకు ప్రశాంతంగా మరియు విజయవంతంగా సాగాలని కోరుకుంటున్నాము! 🌸';
  } else if (lang === 'kannada') {
    title = '🪔 *ಗೀತಾದೈನಿಕ: ದಿನನಿತ್ಯದ ಜ್ಞಾನ ಮತ್ತು ಎಐ ವಿಶ್ಲೇಷಣೆ* 🪔';
    chLabel = 'ಅಧ್ಯಾಯ';
    vLabel = 'ಶ್ಲೋಕ';
    transLabel = 'ಅನುವಾದ';
    aiLabel = 'ಎಐ ವಿಶ್ಲೇಷಣೆ';
    mindLabel = 'ಇಂದಿನ ಅಭ್ಯಾಸ';
    footer = 'ನಿಮ್ಮ ದಿನವು ಶುಭವಾಗಲಿ ಮತ್ತು ಯಶಸ್ವಿಯಾಗಲಿ! 🌸';
  }

  const artLink = getArtworkForShloka(shloka);
  
  return `${title}

*${chLabel} ${shloka.chapter}, ${vLabel} ${shloka.verse}*

_Sanskrit:_
${shloka.sanskrit}

_Transliteration:_
${reflection.translatedTransliteration || shloka.transliteration}

_${transLabel}:_
${reflection.translatedTranslation || shloka.translation}

✨ *${aiLabel}:*
${reflection.modernReflection}

🧘 *${mindLabel}:*
${reflection.mindfulnessTip}

🎨 *Sacred Art:* ${artLink}

Made with ❤️ by [Sameer Joshi](https://www.linkedin.com/in/sameer-joshi-691457146/)

${footer}`;
}

// Service to send WhatsApp message
async function sendWhatsAppMessage(toPhone, messageBody, mediaUrl = null) {
  const cleanPhone = normalizePhoneNumber(toPhone);
  const whatsappTo = `whatsapp:${cleanPhone}`;

  if (twilioClient) {
    try {
      const msgOptions = {
        from: twilioNumber,
        body: messageBody,
        to: whatsappTo
      };
      if (mediaUrl) {
        msgOptions.mediaUrl = Array.isArray(mediaUrl) ? mediaUrl : [mediaUrl];
      }
      const response = await twilioClient.messages.create(msgOptions);
      console.log(`[WhatsApp] Sent message to ${cleanPhone}. SID: ${response.sid}`);
      return { success: true, sid: response.sid };
    } catch (err) {
      console.error(`[WhatsApp] Failed to send message to ${cleanPhone}:`, err);
      return { success: false, error: err.message };
    }
  } else {
    const mockBox = `
========================================
[WHATSAPP SANDBOX SIMULATOR]
To: ${whatsappTo}
From: ${twilioNumber}
Message:
${messageBody}
========================================
`;
    console.log(mockBox);
    return { success: true, simulated: true };
  }
}

// 9. Send Test Delivery across active channels
app.post('/api/test-delivery', async (req, res) => {
  const { email, chapter, verse } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const users = readData(USERS_PATH);
  const user = users.find(u => typeof u === 'object' && u !== null ? u.email === email : u === email);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const language = user.lang || 'english';
  let shloka = gitaData[0];
  if (chapter && verse) {
    const found = gitaData.find(s => s.chapter === parseInt(chapter) && s.verse === parseInt(verse));
    if (found) shloka = found;
  }

  const reflection = await getGeminiReflection(shloka, language);
  const messageText = formatShlokaMessage(shloka, reflection, language);
  const deliveryStatus = {};

  // 1. Email Delivery
  if (user.pref === 'email' || user.pref === 'both' || user.pref === 'all') {
    const emailResult = await sendDailyShlokaEmail(user.email, shloka, reflection, language);
    deliveryStatus.email = emailResult;
  }

  // 2. Telegram Delivery
  if ((user.pref === 'telegram' || user.pref === 'both' || user.pref === 'all') && user.telegramChatId) {
    const tgResult = await sendTelegramShloka(user.telegramChatId, messageText, getArtworkForShloka(shloka));
    deliveryStatus.telegram = tgResult;
  }

  // 3. Web Push Delivery
  if ((user.pref === 'push' || user.pref === 'all') && user.pushSubscription) {
    try {
      const payload = JSON.stringify({
        title: `🪔 Gita Ch ${shloka.chapter}, Verse ${shloka.verse}`,
        body: reflection.translatedTranslation || shloka.translation,
        image: getArtworkForShloka(shloka),
        url: `/#/chapter/${shloka.chapter}/verse/${shloka.verse}`
      });
      await webpush.sendNotification(user.pushSubscription, payload);
      deliveryStatus.push = { success: true };
    } catch (err) {
      console.error('[WebPush] Error sending test notification:', err);
      deliveryStatus.push = { success: false, error: err.message };
    }
  }

  res.json({ message: 'Test delivery triggered', status: deliveryStatus });
});

// 10. Web Push Subscription endpoint
app.post('/api/push/subscribe', (req, res) => {
  const { email, subscription } = req.body;
  if (!email || !subscription) {
    return res.status(400).json({ error: 'Email and subscription are required.' });
  }

  const users = readData(USERS_PATH);
  const index = users.findIndex(u => typeof u === 'object' && u !== null ? u.email === email : u === email);

  if (index >= 0) {
    users[index].pushSubscription = subscription;
    writeData(USERS_PATH, users);
    res.json({ message: 'Push subscription saved successfully.' });
  } else {
    res.status(404).json({ error: 'User not found.' });
  }
});

// 11. Web Push Public Key endpoint
app.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// 12. App configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || 'GitaDailyBot'
  });
});

// Broadcast task
async function broadcastDailyShloka() {
  if (gitaData.length === 0) return;

  const startOfYear = new Date(new Date().getFullYear(), 0, 0);
  const diff = new Date() - startOfYear;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % gitaData.length;

  const shloka = gitaData[index];
  const users = readData(USERS_PATH);
  let sentCount = 0;

  for (const user of users) {
    if (typeof user === 'object' && user.email) {
      const language = user.lang || 'english';
      const reflection = await getGeminiReflection(shloka, language);
      const messageText = formatShlokaMessage(shloka, reflection, language);
      
      let sentToThisUser = false;

      // 1. Email Channel
      if (user.pref === 'email' || user.pref === 'both' || user.pref === 'all') {
        await sendDailyShlokaEmail(user.email, shloka, reflection, language);
        sentToThisUser = true;
      }

      // 2. Telegram Channel
      if ((user.pref === 'telegram' || user.pref === 'both' || user.pref === 'all') && user.telegramChatId) {
        await sendTelegramShloka(user.telegramChatId, messageText, getArtworkForShloka(shloka));
        sentToThisUser = true;
      }

      // 3. Web Push Channel
      if ((user.pref === 'push' || user.pref === 'all') && user.pushSubscription) {
        try {
          const payload = JSON.stringify({
            title: `🪔 Gita Ch ${shloka.chapter}, Verse ${shloka.verse}`,
            body: reflection.translatedTranslation || shloka.translation,
            image: getArtworkForShloka(shloka),
            url: `/#/chapter/${shloka.chapter}/verse/${shloka.verse}`
          });
          await webpush.sendNotification(user.pushSubscription, payload);
          sentToThisUser = true;
        } catch (err) {
          console.error(`[WebPush] Failed for ${user.email}:`, err.message);
        }
      }

      if (sentToThisUser) {
        sentCount++;
      }
    }
  }
  console.log(`[Cron] Broadcast finished. Sent to ${sentCount} user(s).`);
}

// Schedule morning broadcast daily at 6:00 AM local time
cron.schedule('0 6 * * *', async () => {
  console.log('[Cron] Triggering daily morning shloka broadcast...');
  await broadcastDailyShloka();
});

// Polling callback to subscribe a user via Telegram start deep link
const handleTelegramSubscribe = async (email, chatId, triggerTest = false) => {
  const users = readData(USERS_PATH);
  
  if (triggerTest) {
    // If chatId triggered 'shloka' test command manually
    const user = users.find(u => u.telegramChatId === chatId);
    if (user) {
      const shloka = gitaData[0];
      const language = user.lang || 'english';
      const reflection = await getGeminiReflection(shloka, language);
      const messageText = formatShlokaMessage(shloka, reflection, language);
      await sendTelegramShloka(chatId, messageText, getArtworkForShloka(shloka));
    }
    return true;
  }

  const index = users.findIndex(u => typeof u === 'object' && u !== null ? u.email === email : u === email);
  if (index >= 0) {
    users[index].telegramChatId = chatId;
    // Upgrade preferences to telegram or both
    if (users[index].pref === 'email') {
      users[index].pref = 'both';
    } else if (users[index].pref !== 'both' && users[index].pref !== 'all') {
      users[index].pref = 'telegram';
    }
    writeData(USERS_PATH, users);
    return true;
  }
  return false;
};

// Start Server & start Telegram bot polling
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startTelegramPolling(handleTelegramSubscribe);
});
