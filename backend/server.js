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
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Bookmark } from './models/Bookmark.js';
import { History } from './models/History.js';
import { QueryLog } from './models/QueryLog.js';

dotenv.config();

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('[MongoDB] Connected successfully'))
    .catch(err => console.error('[MongoDB] Connection error:', err));
} else {
  console.warn('[MongoDB] WARNING: MONGODB_URI not found in .env');
}

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

// initFile(USERS_PATH, []);
// initFile(BOOKMARKS_PATH, []);
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

  console.log('language----', language)
  const langSuffix = ((await language) || 'english').toLowerCase();
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
app.post('/api/auth/verify-otp', async (req, res) => {
  let { identifier, otp } = req.body;
  if (!identifier || !otp) {
    return res.status(400).json({ error: 'Identifier and OTP are required.' });
  }

  const result = verifyOTP(identifier, otp);
  if (!result.valid) {
    return res.status(401).json({ error: result.error || 'Invalid OTP.' });
  }

  // Check if the user already exists in MongoDB
  try {
    const existing = await User.findOne({ email: identifier.toLowerCase() });
    if (existing) {
      // Existing user - return their full profile (Login)
      return res.json({ verified: true, isNewUser: false, user: existing });
    } else {
      // New user - they need to complete registration
      return res.json({ verified: true, isNewUser: true });
    }
  } catch (err) {
    console.error("Error verifying user:", err);
    return res.status(500).json({ error: 'Database error' });
  }
});

// 1. User Registration
app.post('/api/register', async (req, res) => {
  const { email, phone, pref, lang } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email address is required.' });
  }

  try {
    const cleanEmail = email.toLowerCase();
    const newUser = await User.findOneAndUpdate(
      { email: cleanEmail },
      {
        email: cleanEmail,
        phone: phone ? normalizePhoneNumber(phone) : '',
        pref: pref || 'email',
        lang: lang || 'english'
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ message: 'Success', ...newUser.toObject() });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Helper to look up user language
async function getUserLanguage(email, req) {
  if (req && req.query && req.query.lang) {
    return req.query.lang.toLowerCase();
  }
  if (req && req.body && req.body.lang) {
    return req.body.lang.toLowerCase();
  }
  if (!email) return 'english';
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return user && user.lang ? user.lang : 'english';
  } catch (err) {
    return 'english';
  }
}

// 2. Get Daily Shloka
app.get('/api/shloka/daily', async (req, res) => {
  if (gitaData.length === 0) {
    return res.status(500).json({ error: 'Gita dataset is empty.' });
  }

  const { email } = req.query;
  const language = await getUserLanguage(email, req);

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
  const language = getUserLanguage(email, req);

  let shloka = gitaData.find(s => s.chapter === chapter && s.verse === verse);

  if (!shloka) {
    if (!genAI) {
      return res.status(500).json({ error: 'Gemini AI is not configured to fetch this verse.' });
    }

    try {
      console.log(`[Dynamic Shloka] Fetching details for Ch ${chapter}, Verse ${verse} from Gemini`);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const prompt = `
        You are a scholar of the Bhagavad Gita.
        Provide the precise details for Bhagavad Gita Chapter ${chapter}, Verse ${verse}.
        
        Respond STRICTLY in JSON format with the following schema:
        {
          "chapter": ${chapter},
          "verse": ${verse},
          "sanskrit": "The original Sanskrit text of this specific shloka in Devanagari script",
          "transliteration": "The standard English/Roman transliteration (IAST style) of the Sanskrit shloka",
          "translation": "The direct English translation of this shloka",
          "theme": "A brief theme or title for this verse (e.g. 'Karma Yoga', 'Dhyana Yoga')"
        }
      `;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const responseText = result.response.text();
      shloka = JSON.parse(responseText);
    } catch (err) {
      console.error(`[Dynamic Shloka] Error fetching verse Ch ${chapter} V ${verse}:`, err);
      shloka = {
        chapter,
        verse,
        sanskrit: "॥ श्रीभगवदुवाच ॥",
        transliteration: "Loading...",
        translation: "Unable to retrieve the shloka text offline. Please check your internet connection.",
        theme: "Bhagavad Gita Wisdom"
      };
    }
  }

  const reflection = await getGeminiReflection(shloka, language);
  res.json({
    ...shloka,
    reflection
  });
});

const GITA_CHAPTERS_INFO = [
  { chapterNumber: 1, versesCount: 47, theme: "The Dilemma of Life (Arjuna Vishada Yoga)", localThemes: { hindi: "अर्जुनविषादयोग (जीवन की दुविधा)", telugu: "అర్జునవిషాద యోగం (జీవిత సందిగ్ధత)", kannada: "ಅರ್ಜುನವಿಷಾದ ಯೋಗ (ಜೀವನದ ಸಂದಿಗ್ಧತೆ)" } },
  { chapterNumber: 2, versesCount: 72, theme: "Transcendental Knowledge (Sankhya Yoga)", localThemes: { hindi: "सांख्ययोग (परम ज्ञान)", telugu: "సాంఖ్య యోగం (ఆత్మ జ్ఞానం)", kannada: "ಸಾಂಖ್ಯ ಯೋಗ (ಆತ್ಮ ಜ್ಞಾನ)" } },
  { chapterNumber: 3, versesCount: 43, theme: "Path of Selfless Action (Karma Yoga)", localThemes: { hindi: "कर्मयोग (निःस्वार्थ कर्म)", telugu: "కర్మ యోగం (నిష్కామ కర్మ)", kannada: "ಕರ್ಮ ಯೋಗ (ನಿಷ್ಕಾಮ ಕರ್ಮ)" } },
  { chapterNumber: 4, versesCount: 42, theme: "Path of Knowledge & Action (Jnana Karma Sanyasa Yoga)", localThemes: { hindi: "ज्ञानकर्मसंन्यासयोग (ज्ञान और कर्म)", telugu: "జ్ఞానకర్మసన్యాస యోగం (జ్ఞానము మరియు కర్మ)", kannada: "ಜ್ಞಾನಕರ್ಮಸನ್ಯಾಸ ಯೋಗ (ಜ್ಞಾನ ಮತ್ತು ಕರ್ಮ)" } },
  { chapterNumber: 5, versesCount: 29, theme: "Path of Renunciation (Karma Sanyasa Yoga)", localThemes: { hindi: "कर्मसंन्यासयोग (कर्मों का संन्यास)", telugu: "కర్మసన్యాస యోగం (కర్మ సన్యాసము)", kannada: "ಕರ್ಮಸನ್ಯಾಸ ಯೋಗ (ಕರ್ಮ ಸನ್ಯಾಸ)" } },
  { chapterNumber: 6, versesCount: 47, theme: "Path of Meditation (Dhyana Yoga)", localThemes: { hindi: "आत्मसंयमयोग (ध्यान और संयम)", telugu: "ఆత్మసంయమ యోగం (ధ్యాన యోగము)", kannada: "ಆತ್ಮಸಂಯಮ ಯೋಗ (ಧ್ಯಾನ ಯೋಗ)" } },
  { chapterNumber: 7, versesCount: 30, theme: "Knowledge of the Ultimate (Jnana Vijnana Yoga)", localThemes: { hindi: "ज्ञानविज्ञानयोग (परम सत्य का ज्ञान)", telugu: "జ్ఞానవిజ్ఞాన యోగం (పరమాత్మ జ్ఞానము)", kannada: "ಜ್ಞಾನವಿజ్ఞಾನ ಯೋಗ (ಪರಮಾತ್ಮ ಜ್ಞಾನ)" } },
  { chapterNumber: 8, versesCount: 28, theme: "Path of the Eternal (Akshara Brahma Yoga)", localThemes: { hindi: "अक्षरब्रह्मयोग (अविनाशी ब्रह्म)", telugu: "అక్షరబ్రహ్మ యోగం (అక్షర పరబ్రహ్మ యోగము)", kannada: "ಅಕ್ಷರಬ್ರಹ್ಮ ಯೋಗ (ಅಕ್ಷರ ಪರಬ್ರಹ್ಮ ಯೋಗ)" } },
  { chapterNumber: 9, versesCount: 34, theme: "The King of Secrets (Raja Vidya Raja Guhya Yoga)", localThemes: { hindi: "राजविद्याराजगुह्ययोग (परम गुह्य ज्ञान)", telugu: "రాజవిద్యారాజగుహ్య యోగం (రాజవిద్య యోగము)", kannada: "ರಾಜವಿದ್ಯಾರಾಜಗುಹ್ಯ ಯೋಗ (ರಾಜವಿದ್ಯ ಯೋಗ)" } },
  { chapterNumber: 10, versesCount: 42, theme: "Infinite Splendors (Vibhuti Yoga)", localThemes: { hindi: "विभूतियोग (दिव्य विभूतियाँ)", telugu: "విభూతి యోగం (దివ్య విభూతులు)", kannada: "ವಿಭೂತಿ ಯೋಗ (ವಿವಿದ್ ವಿಭೂತಿಗಳು)" } },
  { chapterNumber: 11, versesCount: 55, theme: "The Vision of the Cosmic Form (Viswarupa Darshana Yoga)", localThemes: { hindi: "विश्वरूपदर्शनयोग (विश्वरूप दर्शन)", telugu: "విశ్వరూపదర్శన యోగం (విశ్వరూప దర్శనము)", kannada: "ವಿಶ್ವರೂಪದರ್ಶನ ಯೋಗ (ವಿಶ್ವರೂಪ ದರ್ಶನ)" } },
  { chapterNumber: 12, versesCount: 20, theme: "Path of Devotion (Bhakti Yoga)", localThemes: { hindi: "भक्तियोग (भक्ति मार्ग)", telugu: "భక్తి యోగం (భక్తి మార్గము)", kannada: "ಭಕ್ತಿ ಯೋಗ (ಭಕ್ತಿ ಮಾರ್ಗ)" } },
  { chapterNumber: 13, versesCount: 35, theme: "The Field & Knower of the Field (Kshetra Kshetrajna Vibhaga Yoga)", localThemes: { hindi: "क्षेत्रक्षेत्रज्ञविभागयोग (क्षेत्र और क्षेत्रज्ञ)", telugu: "క్షేత్రక్షేత్రజ్ఞవిభాగ యోగం (క్షేత్ర క్షేత్రజ్ఞ విభాగము)", kannada: "ಕ್ಷೇತ್ರಕ್ಷೇತ್ರಜ್ಞವಿಭಾಗ ಯೋಗ (ಕ್ಷೇತ್ರ ಕ್ಷೇತ್ರಜ್ಞ ವಿಭಾಗ)" } },
  { chapterNumber: 14, versesCount: 27, theme: "The Three Modes of Nature (Gunatraya Vibhaga Yoga)", localThemes: { hindi: "गुणत्रयविभागयोग (प्रकृति के तीन गुण)", telugu: "గుణత్రయవిభాగ యోగం (త్రిగుణ విభాగము)", kannada: "ಗುಣತ್ರಯವಿಭಾಗ ಯೋಗ (ತ್ರಿಗುಣ ವಿಭಾಗ)" } },
  { chapterNumber: 15, versesCount: 20, theme: "The Supreme Person (Purushottama Yoga)", localThemes: { hindi: "पुरुषोत्तमयोग (परम पुरुष)", telugu: "పురుషోత్తమ యోగం (పురుషోత్తಮ ಪ್ರಾಪ್ಟಿ)", kannada: "ಪುರುಷೋತ್ತಮ ಯೋಗ (ಪುರುಷೋತ್ತಮ ಪ್ರಾಪ್ತಿ)" } },
  { chapterNumber: 16, versesCount: 24, theme: "Divine & Demoniac Natures (Daivasura Sampad Vibhaga Yoga)", localThemes: { hindi: "दैवासुरसम्पद्विभागयोग (दैवी और आसुरी स्वभाव)", telugu: "దైవాసురసంపద్విభాగ యోగం (దైవాసుర సంపద్విభాగము)", kannada: "ದೈವಾಸುರಸಂಪದ್ವಿಭಾಗ ಯೋಗ (ದೈವಾಸುರ ಸಂಪದ್ವಿಭಾಗ)" } },
  { chapterNumber: 17, versesCount: 28, theme: "The Divisions of Faith (Shraddhatraya Vibhaga Yoga)", localThemes: { hindi: "श्रद्धात्रयविभागयोग (श्रद्धा के तीन प्रकार)", telugu: "శ్రద్ధాత్రయవిభాగ యోగం (శ్రద్ధాత్రయ విభాగము)", kannada: "ಶ್ರದ್ಧಾತ್ರಯವಿಭಾಗ ಯೋಗ (ಶ್ರದ್ಧಾತ್ರಯ ವಿಭಾಗ)" } },
  { chapterNumber: 18, versesCount: 78, theme: "Final Liberation & Renunciation (Moksha Sanyasa Yoga)", localThemes: { hindi: "मोक्षसंन्यासयोग (परम मोक्ष)", telugu: "మోక్షసన్యాస యోగం (మోక్ష సన్యాసము)", kannada: "ಮೋಕ್ಷಸನ್ಯಾಸ ಯೋಗ (ಮೋಕ್ಷ ಸನ್ಯಾಸ)" } }
];

// 4. Get Chapters List
app.get('/api/chapters', async (req, res) => {
  const { email } = req.query;
  const lang = await getUserLanguage(email, req);

  const chapters = GITA_CHAPTERS_INFO.map(ch => {
    let themeText = ch.theme;
    if (ch.localThemes && ch.localThemes[lang]) {
      themeText = ch.localThemes[lang];
    }

    const verses = Array.from({ length: ch.versesCount }, (_, i) => i + 1);

    return {
      chapterNumber: ch.chapterNumber,
      theme: themeText,
      verses
    };
  });

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
app.get('/api/bookmarks', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID parameter is required.' });
  }

  try {
    const userBookmarks = await Bookmark.find({ userId });

    // Hydrate with shloka data
    const hydrated = userBookmarks.map(b => {
      const shloka = gitaData.find(s => s.chapter === b.chapter && s.verse === b.verse);
      return shloka ? { ...shloka } : null;
    }).filter(Boolean);

    res.json(hydrated);
  } catch (err) {
    res.status(500).json({ error: 'Database error fetching bookmarks' });
  }
});

// 7. Add Bookmark
app.post('/api/bookmarks', async (req, res) => {
  const { userId, chapter, verse } = req.body;
  if (!userId || !chapter || !verse) {
    return res.status(400).json({ error: 'User ID, chapter, and verse are required.' });
  }

  try {
    await Bookmark.findOneAndUpdate(
      { userId, chapter, verse },
      { userId, chapter, verse },
      { upsert: true }
    );
    res.json({ message: 'Bookmarked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to bookmark' });
  }
});

// 8. Delete Bookmark
app.delete('/api/bookmarks', async (req, res) => {
  const { userId, chapter, verse } = req.body;
  if (!userId || !chapter || !verse) {
    return res.status(400).json({ error: 'User ID, chapter, and verse are required.' });
  }

  try {
    await Bookmark.deleteOne({ userId, chapter, verse });
    res.json({ message: 'Bookmark removed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
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
  let title = '🪔 *Krishna Bodha: Daily Wisdom & AI Reflection* 🪔';
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
    title = '🪔 *कृष्णबोधः: दैनिक ज्ञान और एआई चिंतन* 🪔';
    chLabel = 'अध्याय';
    vLabel = 'श्लोक';
    transLabel = 'अनुवाद';
    aiLabel = 'एआई चिंतन';
    mindLabel = 'आज का अभ्यास';
    footer = 'आपका दिन शुभ और मंगलमय हो! 🌸';
  } else if (lang === 'telugu') {
    title = '🪔 *కృష్ణబోధః: దినసరి జ్ఞానం మరియు ఎఐ విశ్లేషణ* 🪔';
    chLabel = 'అధ్యాయం';
    vLabel = 'శ్లోకం';
    transLabel = 'అనువాదం';
    aiLabel = 'ఎఐ విశ్లేషణ';
    mindLabel = 'నేటి సాధన';
    footer = 'ఈ రోజు మీకు ప్రశాంతంగా మరియు విజయవంతంగా సాగాలని కోరుకుంటున్నాము! 🌸';
  } else if (lang === 'kannada') {
    title = '🪔 *ಕೃಷ್ಣಬೋಧಃ: ದಿನನಿತ್ಯದ ಜ್ಞಾನ ಮತ್ತು ಎಐ ವಿಶ್ಲೇಷಣೆ* 🪔';
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
  const { userId, chapter, verse } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    const user = await User.findById(userId);
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
    const deliveryStatus = {};

    // 1. Email Delivery
    if (user.pref === 'email' || user.pref === 'both' || user.pref === 'all') {
      const emailResult = await sendDailyShlokaEmail(user.email, shloka, reflection, language);
      deliveryStatus.email = emailResult;
    }

    // 2. Web Push Delivery
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
      } catch (pushErr) {
        console.error('[WebPush] Error sending test notification:', pushErr);
        deliveryStatus.push = { success: false, error: pushErr.message };
      }
    }

    res.json({ message: 'Test delivery triggered', status: deliveryStatus });
  } catch (err) {
    console.error('[TestDelivery] Error:', err);
    res.status(500).json({ error: 'Failed to send test delivery.' });
  }
});

// 10. Web Push Subscription endpoint
app.post('/api/push/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;
  if (!userId || !subscription) {
    return res.status(400).json({ error: 'User ID and subscription are required.' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { pushSubscription: subscription },
      { new: true }
    );
    if (user) {
      res.json({ message: 'Settings saved', user: user });
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// 16. Get User Reading History
app.get('/api/history', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const history = await History.findOne({ userId });
    res.json(history || { lastReadChapter: 1, lastReadVerse: 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 17. Update User Reading History
app.post('/api/history', async (req, res) => {
  const { userId, chapter, verse } = req.body;
  if (!userId || !chapter || !verse) return res.status(400).json({ error: 'User ID, chapter, verse required' });

  try {
    const history = await History.findOneAndUpdate(
      { userId },
      { lastReadChapter: chapter, lastReadVerse: verse, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save history' });
  }
});

// 18. Hard Delete User Account and all associations
app.delete('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    // Cascading delete across all collections
    await Promise.all([
      User.deleteOne({ _id: userId }),
      Bookmark.deleteMany({ userId }),
      History.deleteOne({ userId }),
      QueryLog.deleteMany({ userId })
    ]);

    res.json({ success: true, message: 'Account and all associated data permanently deleted.' });
  } catch (err) {
    console.error('[DeleteAccount] Error:', err);
    res.status(500).json({ error: 'Failed to fully delete account.' });
  }
});

// 11. Web Push Public Key endpoint
app.get('/api/push/public-key', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// 12. App configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({});
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
  const { userId, query, language } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Please describe the challenge or feeling you are facing.' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (!userId) {
    try {
      const guestCount = await QueryLog.countDocuments({ ipAddress: clientIp, userId: { $exists: false } });
      if (guestCount >= 2) {
        return res.status(403).json({ error: 'Guest limit reached', requireSubscription: true });
      }
    } catch (err) {
      console.error('[Guidance] IP check error:', err);
    }
  }

  const lang = (language || 'english').toLowerCase();

  if (!genAI) {
    return res.status(500).json({ error: 'Gemini AI is not configured on this server.' });
  }

  try {
    // 1. Local candidate lookup (RAG search)
    const queryLower = query.toLowerCase();
    const scoredShlokas = gitaData.map(shloka => {
      let score = 0;

      // Topic matches (exact word matches)
      if (shloka.topics && Array.isArray(shloka.topics)) {
        for (const topic of shloka.topics) {
          const topicLower = topic.toLowerCase();
          if (queryLower.includes(topicLower)) {
            score += 15;
          }
        }
      }

      // Theme matches
      if (shloka.theme && queryLower.includes(shloka.theme.toLowerCase())) {
        score += 8;
      }

      // Word matches in translation
      if (shloka.translation) {
        const words = shloka.translation.toLowerCase().split(/\W+/);
        for (const word of words) {
          if (word.length > 3 && queryLower.includes(word)) {
            score += 2;
          }
        }
      }

      return { shloka, score };
    });

    // Sort and select top candidates
    let candidates = scoredShlokas
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.shloka)
      .slice(0, 10);

    // Fallback to diverse default set if no keywords matched
    if (candidates.length === 0) {
      const defaultVerses = [
        { chapter: 2, verse: 47 }, // Duty / Action
        { chapter: 6, verse: 5 },  // Mind control
        { chapter: 2, verse: 62 }, // Anger / Desire
        { chapter: 18, verse: 66 },// Devotion / Surrender
        { chapter: 4, verse: 7 },  // Dharma / Protection
        { chapter: 2, verse: 14 }, // Tolerance / Change
        { chapter: 9, verse: 22 }, // Faith / Peace
        { chapter: 12, verse: 13 } // Equanimity / Kindness
      ];
      candidates = defaultVerses.map(v =>
        gitaData.find(s => s.chapter === v.chapter && s.verse === v.verse)
      ).filter(Boolean);
    }

    // VARIETY: Pick a random shloka from the top candidates
    const selectedCandidate = candidates[Math.floor(Math.random() * candidates.length)];

    // Async log the query to MongoDB
    const logEntry = {
      query,
      language: lang,
      suggestedChapter: selectedCandidate.chapter,
      suggestedVerse: selectedCandidate.verse,
      ipAddress: clientIp
    };
    if (userId) logEntry.userId = userId;

    QueryLog.create(logEntry).catch(err => console.error('[Guidance] Failed to log query:', err));

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const prompt = `
      You are a warm, wise, and deeply compassionate spiritual mentor and close friend who knows the Bhagavad Gita by heart.
      The user is coming to you for personal, friendly advice on a specific challenge, feeling, or query they are facing:
      "${query}"
      
      Your tasks:
      1. Listen deeply to the user's challenge. Validate their feelings with genuine empathy.
      2. I have selected the perfect shloka for them: Chapter ${selectedCandidate.chapter}, Verse ${selectedCandidate.verse}.
      
      Sanskrit: "${selectedCandidate.sanskrit}"
      Translation: "${selectedCandidate.translation}"
      
      3. Write a comforting response in a highly personal, warm, and conversational tone. Speak directly to them like a close friend who is right beside them, offering wise guidance. Avoid dry, academic, or generic textbook explanations.
      
      Respond STRICTLY in JSON format with the following schema:
      {
        "selectedChapter": ${selectedCandidate.chapter},
        "selectedVerse": ${selectedCandidate.verse},
        "sanskrit": "Sanskrit text of the selected shloka",
        "transliteration": "Transliteration of the selected shloka",
        "translation": "English translation of the selected shloka",
        "translatedTranslation": "Translation of the selected shloka into the language: ${lang}",
        "translatedTransliteration": "Phonetic transliteration of the selected shloka written in the script of the chosen language: ${lang}",
        "theme": "A brief theme or title for this verse",
        "modernCounsel": "Write a deeply comforting, detailed, and warm counsel (8-10 sentences) in the language: ${lang}. Start by acknowledging their specific challenge (\"${query}\") with friendship and care. Then, explain in clear, friendly, and practical terms how the selected shloka directly addresses and solves this specific issue. Break down the shloka's wisdom, showing how it guides them out of their current dilemma. You MUST include a concrete, relatable real-life example to illustrate how they can apply this wisdom in their daily life. Keep the tone loving, conversational, and highly reassuring, as if speaking to a beloved sibling.",
        "wellbeingInsight": "A gentle, deeply comforting piece of advice (3-4 sentences) focusing on their emotional healing and mental peace, written as a caring friend in the language: ${lang}. Reassure them that they are doing well and that their peace is valuable.",
        "actionStep": "One clear, practical, and simple step they can take today inspired by the shloka to help them make progress, written in a warm, encouraging tone in the language: ${lang}."
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

      const logEntry = { query, language: lang, suggestedChapter: bestShloka.chapter, suggestedVerse: bestShloka.verse, ipAddress: clientIp };
      if (userId) logEntry.userId = userId;
      QueryLog.create(logEntry).catch(() => { });

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
  let sentCount = 0;

  try {
    const users = await User.find({});
    for (const user of users) {
      if (user.email) {
        const language = user.lang || 'english';
        const reflection = await getGeminiReflection(shloka, language);
        const messageText = formatShlokaMessage(shloka, reflection, language);

        let sentToThisUser = false;

        // 1. Email Channel
        if (user.pref === 'email' || user.pref === 'both' || user.pref === 'all') {
          await sendDailyShlokaEmail(user.email, shloka, reflection, language);
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
  } catch (err) {
    console.error('[Cron] Error fetching users from MongoDB:', err);
  }
}

// Schedule morning broadcast daily at 6:00 AM local time
cron.schedule('0 6 * * *', async () => {
  console.log('[Cron] Triggering daily morning shloka broadcast...');
  await broadcastDailyShloka();
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
