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
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
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
  if (!result.success) {
    return res.status(500).json({ error: result.error || 'Failed to send email OTP.' });
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
  'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/chariot.jpg',
  'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/discourse.jpg',
  'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/vishwaroopa.jpg'
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

// 13. Trigger daily broadcast manually (for external cron schedules)
app.post('/api/trigger-daily-broadcast', async (req, res) => {
  try {
    console.log('[API] Triggering daily morning shloka broadcast manually...');
    await broadcastDailyShloka();
    res.json({ success: true, message: 'Broadcast triggered successfully.' });
  } catch (error) {
    console.error('[API] Error during broadcast:', error);
    res.status(500).json({ error: 'Broadcast failed.' });
  }
});

// 14. Gita Guidance (Reflect by Mood/Problem) endpoint
app.post('/api/guidance', async (req, res) => {
  const { query, language } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Please describe the challenge or feeling you are facing.' });
  }

  const lang = (language || 'english').toLowerCase();
  
  if (!genAI) {
    return res.status(500).json({ error: 'Gemini AI is not configured on this server.' });
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
      You are a warm, wise, and compassionate friend who knows the Bhagavad Gita by heart.
      The user is coming to you for personal advice on a challenge, feeling, or query they are facing:
      "${query}"
      
      Your tasks:
      1. Listen deeply to the user's challenge.
      2. Search the entire Bhagavad Gita (all 18 chapters and 700 verses) to select the absolute best shloka that precisely speaks to their situation and guides them forward.
      3. Write a comforting response in a highly personal, warm, and conversational tone, speaking directly to them like a close friend who wants their betterment (use terms like "I understand how you feel...", "We all face times when...", "You've got this..."). Avoid dry, analytical, or textbook explanations.
      
      Respond STRICTLY in JSON format with the following schema:
      {
        "selectedChapter": [chapter number of the shloka you selected, 1-18],
        "selectedVerse": [verse number of the shloka you selected],
        "sanskrit": "The original Sanskrit text of the selected shloka in Devanagari script",
        "transliteration": "The standard English/Roman transliteration (IAST style) of the Sanskrit shloka",
        "translation": "The direct English translation of the selected shloka",
        "translatedTranslation": "Direct translation of the selected shloka into the language: ${lang}",
        "translatedTransliteration": "Phonetic transliteration of the selected shloka written in the script of the chosen language: ${lang}",
        "theme": "A brief theme or title for this verse (e.g. 'Karma Yoga', 'Dhyana Yoga')",
        "modernCounsel": "Write a warm, empathetic, and friendly counsel (3-4 sentences) in the language: ${lang}. Speak to them as a supportive friend, explaining naturally how this shloka relates to their specific problem and how it can help them overcome it. Speak in a caring, conversational style.",
        "wellbeingInsight": "A gentle piece of comfort or advice (2 sentences) for their emotional well-being, written as a caring friend in the language: ${lang}.",
        "actionStep": "One simple, practical step they can take today inspired by the shloka to help them make progress, written in a warm, encouraging tone in the language: ${lang}."
      }
    `;

    console.log(`[Guidance] Seeking counsel for query: "${query}" in language: ${lang}`);
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText);

    // Retrieve the full original shloka to get Sanskrit, etc. if it exists locally
    const originalShloka = gitaData.find(s => s.chapter === parsed.selectedChapter && s.verse === parsed.selectedVerse);

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
    console.error('[Guidance] Error fetching Gita counsel, using offline fallback:', error);
    try {
      const queryLower = query.toLowerCase();
      
      // Basic scoring of shlokas offline
      let bestShloka = gitaData[0];
      let bestScore = -1;
      
      for (const shloka of gitaData) {
        let score = 0;
        
        // Topic matches
        if (shloka.topics && Array.isArray(shloka.topics)) {
          for (const topic of shloka.topics) {
            // De-prioritize Chapter 8 Verse 5 for general focus queries
            if (shloka.chapter === 8 && shloka.verse === 5 && topic === 'focus') {
              continue;
            }
            if (queryLower.includes(topic.toLowerCase())) {
              score += 10;
            }
          }
        }
        
        // Give Ch 6 Verse 5 a massive boost for focus/mind queries
        if (shloka.chapter === 6 && shloka.verse === 5) {
          const mindKeywords = ['focus', 'concentration', 'attention', 'distracted', 'study', 'concentrate', 'mind', 'stress', 'anxious', 'anxiety', 'depression'];
          if (mindKeywords.some(kw => queryLower.includes(kw))) {
            score += 50;
          }
        }
        
        // Theme matches
        if (shloka.theme && queryLower.includes(shloka.theme.toLowerCase())) {
          score += 5;
        }
        
        // Translation word matches (minimum 4 letters)
        if (shloka.translation) {
          const words = shloka.translation.toLowerCase().split(/\W+/);
          for (const word of words) {
            if (word.length > 3 && queryLower.includes(word)) {
              score += 1;
            }
          }
        }
        
        if (score > bestScore) {
          bestScore = score;
          bestShloka = shloka;
        }
      }
      
      // If we couldn't match anything well, decide a default based on keywords
      if (bestScore <= 0) {
        const stressKeywords = [
          'anxious', 'stress', 'fear', 'mind', 'worry', 'depression', 'sad', 'anxiety', 'anger',
          'मन', 'डर', 'चिंता', 'तनाव', 'क्रोध', 'दुख', 'पस्तचाप', 'पश्चाताप', 'गलत', 'ग़लत',
          'ఆందోళన', 'భయం', 'కోపం', 'మనస్సు',
          'ಮನಸ್ಸು', 'ಭಯ', 'ಕೋಪ', 'ಚಿಂತೆ'
        ];
        const isStress = stressKeywords.some(keyword => queryLower.includes(keyword));
        if (isStress) {
          // Chapter 6, Verse 5 (Self-control & mind)
          bestShloka = gitaData.find(s => s.chapter === 6 && s.verse === 5) || gitaData[0];
        } else {
          // Chapter 2, Verse 47 (Karma / Duty)
          bestShloka = gitaData.find(s => s.chapter === 2 && s.verse === 47) || gitaData[0];
        }
      }

      // Determine counsel content based on the selected shloka topic/theme
      const selectedTheme = (bestShloka.chapter === 6 && bestShloka.verse === 5) ? 'mind' : 
                            (bestShloka.chapter === 2 && bestShloka.verse === 47) ? 'duty' : 'general';

      const fallbackContent = {
        english: {
          mind: {
            modernCounsel: "I know how exhausting it feels when your mind is racing and you can't stay focused. In this verse, Krishna reminds us that our mind can either be our greatest ally or our toughest enemy, depending on how we treat it. Don't be too hard on yourself when you drift; instead, gently bring your attention back like a friend guiding you home.",
            wellbeingInsight: "Your mind is just tired, and that's completely okay. Take a deep breath right now, let go of the pressure to be perfect, and remember you are doing great.",
            actionStep: "Whenever you feel distracted today, just pause, take one deep breath, and do one small thing at a time with your full presence."
          },
          duty: {
            modernCounsel: "It's so easy to get anxious when we are constantly worrying about how things will turn out. This beautiful verse is a gentle reminder that we only own our efforts, not the final results. Focus all your energy on doing your best right now, and leave the rest to unfold naturally—you'll feel a huge weight lift off your shoulders.",
            wellbeingInsight: "Let go of the need to control the future. You only have to handle this exact moment, and you are fully capable of doing that.",
            actionStep: "Write down what you need to do next, do it sincerely, and promise yourself not to worry about the final grade or outcome."
          },
          general: {
            modernCounsel: "Whatever you are walking through right now, please know that you are not alone and this phase is only temporary. This verse reminds us to anchor ourselves in inner peace and trust the bigger journey of life. Stand strong in your values, and believe that things will align for your betterment.",
            wellbeingInsight: "Give yourself credit for how far you've come. You are much stronger and more resilient than any temporary challenge in front of you.",
            actionStep: "Think of one thing you are grateful for today, write it down, and let that warmth guide your next step."
          }
        },
        hindi: {
          mind: {
            modernCounsel: "मैं समझ सकता हूँ कि जब मन भटकता है और ध्यान लगाना मुश्किल होता है, तो कितना बुरा लगता है। इस श्लोक में कृष्ण हमें समझाते हैं कि हमारा मन ही हमारा सबसे अच्छा दोस्त या सबसे बड़ा दुश्मन बन सकता है। जब आपका ध्यान भटके, तो खुद पर गुस्सा करने के बजाय बड़े प्यार से अपने मन को वापस काम पर लाएं।",
            wellbeingInsight: "आपका मन बस थोड़ा थक गया है और ऐसा होना सामान्य है। एक लंबी सांस लें, खुद पर से दबाव हटाएँ और याद रखें कि आप बहुत अच्छा कर रहे हैं।",
            actionStep: "आज जब भी ध्यान भटके, बस एक गहरी सांस लें और बिना किसी हड़बड़ी के अपना ध्यान वर्तमान काम पर केंद्रित करें।"
          },
          duty: {
            modernCounsel: "हम अक्सर इस चिंता में डूबे रहते हैं कि आगे क्या होगा, जिससे तनाव बढ़ जाता है। यह प्यारा श्लोक हमें याद दिलाता है कि हमारा अधिकार केवल अपनी मेहनत पर है, उसके नतीजे पर नहीं। आज अपना पूरा ध्यान सिर्फ कर्म करने पर लगाएं और परिणाम की चिंता छोड़ दें, इससे आप बहुत हल्का महसूस करेंगे।",
            wellbeingInsight: "भविष्य को नियंत्रित करने की कोशिश में खुद को न थकाएँ। आपको बस इस पल को संभालना है, और आप इसमें पूरी तरह सक्षम हैं।",
            actionStep: "अपने आज के काम की सूची बनाएं, उसे पूरी ईमानदारी से पूरा करें और नतीजे की फिक्र करना बिल्कुल छोड़ दें।"
          },
          general: {
            modernCounsel: "आप आज जिस भी दौर से गुजर रहे हैं, याद रखें कि आप अकेले नहीं हैं और यह वक्त भी गुजर जाएगा। यह श्लोक हमें सिखाता है कि हमें अपनी अंतरात्मा को शांत रखना चाहिए और जीवन की यात्रा पर भरोसा करना चाहिए। अपने अच्छे इरादों पर डटे रहें, सब ठीक हो जाएगा।",
            wellbeingInsight: "अपनी ताकत को पहचानें। आप अपनी मुश्किलों से कहीं ज्यादा मजबूत हैं, खुद पर भरोसा रखें।",
            actionStep: "आज किसी एक अच्छी बात के बारे में सोचें जिसके लिए आप आभारी हैं, और उसी सकारात्मक ऊर्जा के साथ आगे बढ़ें।"
          }
        },
        telugu: {
          mind: {
            modernCounsel: "మనస్సు మనకు పరమ మిత్రుడు లేదా పరమ శత్రువు కావచ్చు కనుక, దానిని జయించాలని గీత మనకు మార్గదర్శనం చేస్తుంది. ఆత్మనిగ్రహం మరియు ఆలోచనలను సకారాత్మకంగా మలచుకోవడం ద్వారానే నిజమైన శక్తి లభిస్తుంది. తాత్కాలిక వైఫల్యాలు లేదా ప్రతికూల ఆలోచనలు మిమ్మల్ని కృంగదీయనివ్వకండి.",
            wellbeingInsight: "మీ ఆలోచనలను ఎటువంటి తీర్పులు లేకుండా గమనించండి. ప్రశాంతంగా శ్వాస తీసుకోండి మరియు మీ ప్రస్తుత మానసిక స్థితి మీ భవిష్యత్తును నిర్ణయించదని గుర్తుంచుకోండి.",
            actionStep: "ఈరోజు మీ ఆలోచనలను గమనించడానికి మరియు ప్రశాంతపరుచుకోవడానికి 5 నిమిషాల పాటు మౌనంగా లేదా ధ్యానంలో గడపండి."
          },
          duty: {
            modernCounsel: "మన ప్రయత్నాలపై మాత్రమే మనకు నియంత్రణ ఉంటుందని, ఫలితాలపై కాదని ఈ శ్లోకం మనకు గుర్తుచేస్తుంది. ఫలితాల గురించి ఆందోళన కలిగినప్పుడు, మీ ప్రస్తుత పనిని ఉత్తమంగా చేయడంపైనే దృష్టి పెట్టండి. మీ నిజాయితీతో కూడిన పనులు తగిన సమయంలో ఫలితాన్ని ఇస్తాయని నమ్మండి.",
            wellbeingInsight: "భవిష్యత్తును అంచనా వేసే భారాన్ని వదిలేయండి. వర్తమాన క్షణంపై మరియు ప్రస్తుతం మీ నియంత్రణలో ఉన్నదానిపై దృష్టి పెట్టండి.",
            actionStep: "ఈరోజు మీరు చేయవలసిన మూడు తక్షణ పనులను జాబితా చేయండి మరియు చివరి ఫలితం గురించి ఆందోళన చెందకుండా వాటిని శ్రద్ధగా పూర్తి చేయండి."
          },
          general: {
            modernCounsel: "మన చేతనను శాశ్వత సత్యంతో అనుసంధానించడం ద్వారా అంతర్గత ప్రశాంతతను ఎలా పొందాలో ఈ పవిత్ర శ్లోకం మనకు నేర్పుతుంది. భౌతిక ప్రపంచంలో మనం ఎదుర్కొనే ప్రతి సవాలు తాత్కాలికమే. మీ ధర్మంలో స్థిరంగా నిలబడండి మరియు దైవ నిర్ణయంపై నమ్మకం ఉంచండి.",
            wellbeingInsight: "పరిస్థితి నుండి కొంచెం వెనక్కి తగ్గి విస్తృత కోణంలో చూడండి. మీరు ఎదుర్కొంటున్న సవాళ్ల కంటే మీరు చాలా శక్తివంతులు.",
            actionStep: "ఈ సవాలు మీకు నేర్పుతున్న ఒక సానుకూల పాఠం గురించి ఆలోచించి, దానిని రాసుకోండి."
          }
        },
        kannada: {
          mind: {
            modernCounsel: "ಮನಸ್ಸು ನಮಗೆ ಪರಮ ಮಿತ್ರ ಅಥವಾ ಪರಮ ಶತ್ರು ಆಗಬಲ್ಲದು, ಆದ್ದರಿಂದ ಅದನ್ನು ಗೆಲ್ಲಬೇಕೆಂದು ಗೀತೆಯು ನಮಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತದೆ. ಆತ್ಮನಿಗ್ರಹ ಮತ್ತು ಧನಾತ್ಮಕ ಆಲೋಚನೆಗಳಿಂದಲೇ ನಿಜವಾದ ಶಕ್ತಿ ಸಿಗುತ್ತದೆ. ತಾತ್ಕಾಲಿಕ ವೈಫಲ್ಯಗಳು ಅಥವಾ ನಕಾರಾತ್ಮಕ ಆಲೋಚನೆಗಳು ನಿಮ್ಮನ್ನು ಕುಗ್ಗಿಸದಂತೆ ನೋಡಿಕೊಳ್ಳಿ.",
            wellbeingInsight: "ಯಾವುದೇ ಪೂರ್ವಗ್ರಹವಿಲ್ಲದೆ ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಗಮನಿಸಿ. ಆಳವಾಗಿ ಉಸಿರಾಡಿ ಮತ್ತು ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಮಾನಸಿಕ ಸ್ಥಿತಿಯು ನಿಮ್ಮ ಭವಿಷ್ಯವನ್ನು ನಿರ್ಧರಿಸುವುದಿಲ್ಲ ಎಂಬುದನ್ನು ನೆನಪಿಡಿ.",
            actionStep: "ಇಂದು ನಿಮ್ಮ ಆಲೋಚನೆಗಳನ್ನು ಗಮನಿಸಲು ಮತ್ತು ಶಾಂತಗೊಳಿಸಲು 5 ನಿಮಿಷಗಳ ಕಾಲ ಮೌನವಾಗಿ ಅಥವಾ ಧ್ಯಾನದಲ್ಲಿ ಕಳೆಯಿರಿ."
          },
          duty: {
            modernCounsel: "ನಮ್ಮ ಪ್ರಯತ್ನಗಳ ಮೇಲೆ ಮಾತ್ರ ನಮಗೆ ನಿಯಂತ್ರಣವಿದೆ, ಫಲಿತಾಂಶಗಳ ಮೇಲಲ್ಲ ಎಂಬುದನ್ನು ಈ ಶ್ಲೋಕವು ನಮಗೆ ನೆನಪಿಸುತ್ತದೆ. ಫಲಿತಾಂಶಗಳ ಬಗ್ಗೆ ಆತಂಕವಿದ್ದಾಗ, ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಕೆಲಸವನ್ನು ಉತ್ತಮವಾಗಿ ಮಾಡುವುದರ ಕಡೆಗೇ ಗಮನ ಹರಿಸಿ. ನಿಮ್ಮ ಪ್ರಾಮಾಣಿಕ ಪ್ರಯತ್ನಗಳು ಸೂಕ್ತ ಸಮಯದಲ್ಲಿ ಉತ್ತಮ ಫಲವನ್ನು ನೀಡುತ್ತವೆ ಎಂದು ನಂಬಿರಿ.",
            wellbeingInsight: "ಭವಿಷ್ಯತ್ತನ್ನು ಊಹಿಸುವ ಹೊರೆಯನ್ನು ಬಿಟ್ಟುಬಿಡಿ. ವರ್ತಮಾನದ ಕ್ಷಣ ಮತ್ತು ನಿಮ್ಮ ನಿಯಂತ್ರಣದಲ್ಲಿರುವ ವಿಷಯಗಳ ಮೇಲೆ ಗಮನ ಹರಿಸಿ.",
            actionStep: "ಇಂದು ನೀವು ಮಾಡಬೇಕಾದ ಮೂರು ಪ್ರಮುಖ ಕೆಲಸಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ ಮತ್ತು ಅಂತಿಮ ಫಲಿತಾಂಶದ ಬಗ್ಗೆ ಚಿಂತಿಸದೆ ಅವುಗಳನ್ನು ಏಕಾಗ್ರತೆಯಿಂದ ಪೂರ್ಣಗೊಳಿಸಿ."
          },
          general: {
            modernCounsel: "ನಮ್ಮ ಪ್ರಜ್ಞೆಯನ್ನು ಶಾಶ್ವತ ಸತ್ಯದೊಂದಿಗೆ ಜೋಡಿಸುವ ಮೂಲಕ ಆಂತರಿಕ ಶಾಂತಿಯನ್ನು ಪಡೆಯುವುದನ್ನು ಈ ಪವಿತ್ರ ಶ್ಲೋಕವು ನಮಗೆ ಕಲಿಸುತ್ತದೆ. ಭೌತಿಕ ಜಗತ್ತಿನಲ್ಲಿ ನಾವು ಎದುರಿಸುವ ಪ್ರತಿಯೊಂದು ಸವಾಲು ತಾತ್ಕಾಲಿಕವಾಗಿದೆ. ನಿಮ್ಮ ಧರ್ಮದಲ್ಲಿ ದೃಢವಾಗಿ ನಿಲ್ಲಿ ಮತ್ತು ದೈವಿಕ ನಿರ್ಧಾರದಲ್ಲಿ ನಂಬಿಕೆಯಿಡಿ.",
            wellbeingInsight: "ಪರಿಸ್ಥಿತಿಯಿಂದ ಸ್ವಲ್ಪ ದೂರ ಸರಿದು ವಿಶಾಲ ದೃಷ್ಟಿಕೋನದಿಂದ ನೋಡಿ. ನೀವು ಎದುರಿಸುತ್ತಿರುವ ಸವಾಲುಗಳಿಗಿಂತಲೂ ನೀವು ಬಲಿಷ್ಠರಾಗಿದ್ದೀರಿ.",
            actionStep: "ಈ ಸವಾಲು ನಿಮಗೆ ಕಲಿಸುತ್ತಿರುವ ಒಂದು ಧನಾತ್ಮಕ ಪಾಠದ ಬಗ್ಗೆ ಯೋಚಿಸಿ, ಅದನ್ನು ಬರೆದಿಟ್ಟುಕೊಳ್ಳಿ."
          }
        }
      };

      const langKey = fallbackContent[lang] ? lang : 'english';
      const counselData = fallbackContent[langKey][selectedTheme];

      // Retrieve translations / localizations for the shloka itself
      let trans = bestShloka.translation;
      let translit = bestShloka.transliteration;
      if (bestShloka.localizations && bestShloka.localizations[lang]) {
        trans = bestShloka.localizations[lang].translation;
        translit = bestShloka.localizations[lang].transliteration;
      }

      res.json({
        success: true,
        query,
        shloka: {
          chapter: bestShloka.chapter,
          verse: bestShloka.verse,
          sanskrit: bestShloka.sanskrit,
          transliteration: translit,
          translation: trans,
          theme: bestShloka.theme,
        },
        counsel: {
          modernCounsel: counselData.modernCounsel,
          wellbeingInsight: counselData.wellbeingInsight,
          actionStep: counselData.actionStep
        }
      });
    } catch (fallbackErr) {
      console.error('[Guidance] Critical failure in guidance offline fallback:', fallbackErr);
      res.status(500).json({ error: 'Failed to seek divine guidance. Please try again.' });
    }
  }
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
