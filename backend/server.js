import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
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

// Initialize Groq Client
const groqKey = process.env.GROQ_API_KEY;
let groq = null;
if (groqKey) {
  // We use the OpenAI NPM package, but point it to Groq's servers
  groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
} else {
  console.warn("WARNING: GROQ_API_KEY environment variable is not set.");
}

// Universal AI Fallback Helper
async function generateContentWithFallback(prompt, responseMimeType = "text/plain", featureContext = "basic") {
  let models = [];
  if (featureContext === "guidance") {
    models = ["groq-llama-3.3-70b-versatile", "gemini-3.5-flash"];
  } else {
    models = ["gemini-3.5-flash", "groq-llama-3.1-8b-instant"];
  }

  let lastError;

  for (const modelName of models) {
    try {
      if (modelName.startsWith('groq-')) {
        if (!groq) throw new Error("Groq client not initialized (missing API key)");
        
        const actualModelName = modelName.replace('groq-', '');
        const response = await groq.chat.completions.create({
          model: actualModelName,
          messages: [{ role: "user", content: prompt }],
          response_format: responseMimeType === "application/json" ? { type: "json_object" } : { type: "text" }
        });
        
        let text = response.choices[0].message.content;
        // Mock the Gemini result structure so the rest of the code works seamlessly
        return { response: { text: () => text } };
      } 
      else if (modelName.startsWith('gemini')) {
        if (!genAI) throw new Error("Gemini client not initialized (missing API key)");
        
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType }
        });
        return result;
      }
    } catch (error) {
      lastError = error;
      console.warn(`[AI Fallback] Model ${modelName} failed (${error.status || error.message}). Trying next...`);
    }
  }
  throw lastError;
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

  const langSuffix = ((await language) || 'english').toLowerCase();
  const cacheKey = `${shloka.chapter}_${shloka.verse}_${langSuffix}`;
  const cache = readData(REFLECTIONS_CACHE_PATH);
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
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

    const result = await generateContentWithFallback(prompt, "application/json", "guidance");
    const counselStr = result.response.text();
    const parsed = JSON.parse(counselStr);

    // Save to cache
    cache[cacheKey] = parsed;
    writeData(REFLECTIONS_CACHE_PATH, cache);

    return parsed;
  } catch (error) {
    console.error(`Error generating Gemini reflection for ${language}:`, error);
    // Return localized fallback on error
    const lang = ((await language) || 'english').toLowerCase();
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
        emotionalWellbeing: "భావోద్వేగాలు సముద్రపు అలల లాంటివి; మీ ప్రశాంతతను కోల్పోకుండా వాటిని రానిచ్చి పోనివ్వండి.",
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

  try {
    const existing = await User.findOne({ email: identifier.toLowerCase() });
    if (!existing) {
      return res.status(404).json({ error: 'User not found. Please subscribe as a new user.' });
    }
  } catch (err) {
    console.error("Error checking user:", err);
    return res.status(500).json({ error: 'Database error' });
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
    
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(400).json({ error: 'User already exists. Please log in.' });
    }

    const newUser = await User.create({
      email: cleanEmail,
      phone: phone ? normalizePhoneNumber(phone) : '',
      pref: pref || 'email',
      lang: lang || 'english'
    });
    
    res.json({ message: 'Success', ...newUser.toObject() });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: 'Database error' });
  }
});

// 1b. Update User Preferences
app.put('/api/user/preferences', async (req, res) => {
  const { email, pref, lang } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    const cleanEmail = email.toLowerCase();
    
    // Create an update object with only provided fields
    const updateFields = {};
    if (pref) updateFields.pref = pref;
    if (lang) updateFields.lang = lang;

    const user = await User.findOneAndUpdate(
      { email: cleanEmail },
      { $set: updateFields },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ message: 'Preferences updated', ...user.toObject() });
  } catch (err) {
    console.error("Error updating preferences:", err);
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
  const language = await getUserLanguage(email, req);

  let shloka = gitaData.find(s => s.chapter === chapter && s.verse === verse);

  if (!shloka) {
    try {
      console.log(`[Dynamic Shloka] Fetching details for Ch ${chapter}, Verse ${verse} from AI`);
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
      const result = await generateContentWithFallback(prompt, "application/json", "basic");
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
app.get('/api/search', async (req, res) => {
  const { q, email } = req.query;
  if (!q) {
    return res.json([]);
  }

  const query = q.toString().toLowerCase();
  let results = gitaData.filter(s =>
    s.translation.toLowerCase().includes(query) ||
    s.transliteration.toLowerCase().includes(query) ||
    s.theme.toLowerCase().includes(query) ||
    s.topics.some(topic => topic.toLowerCase().includes(query)) ||
    `ch${s.chapter}`.includes(query) ||
    `chapter ${s.chapter}`.includes(query)
  ).slice(0, 10);

  const language = await getUserLanguage(email, req);
  if (language !== 'english' && results.length > 0) {
    try {
      const prompt = `
        Translate the following Bhagavad Gita verse translations and themes into ${language}. 
        Provide phonetic transliteration for the Sanskrit text in the script of ${language}.
        Respond strictly in JSON array format matching the input array order:
        [
          { "translation": "translated english text", "theme": "translated theme text", "transliteration": "phonetic transliteration in target script" }
        ]
        
        Input:
        ${JSON.stringify(results.map(r => ({ translation: r.translation, theme: r.theme, transliteration: r.transliteration })))}
      `;
      const result = await generateContentWithFallback(prompt, "application/json", "basic");
      const translatedData = JSON.parse(result.response.text());
      results = results.map((r, i) => ({
        ...r,
        translation: translatedData[i]?.translation || r.translation,
        theme: translatedData[i]?.theme || r.theme,
        transliteration: translatedData[i]?.transliteration || r.transliteration
      }));
    } catch (err) {
      if (err.status === 429) {
        return res.status(429).json({ error: 'High traffic: The translation servers are currently busy. Please wait a moment and try again.', retryAfter: 30 });
      }
      console.error('[Search] Dynamic translation error:', err);
    }
  }

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
  const lang = language.then(lang => (lang || 'english').toLowerCase());

  // Custom headers based on language selection
  let title = '🦚 *Krishna Bodha: Daily Wisdom & AI Reflection* 🦚';
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
    title = '🦚 *कृष्णबोध: दैनिक ज्ञान और एआई चिंतन* 🦚';
    chLabel = 'अध्याय';
    vLabel = 'श्लोक';
    transLabel = 'अनुवाद';
    aiLabel = 'एआई चिंतन';
    mindLabel = 'आज का अभ्यास';
    footer = 'आपका दिन शुभ और मंगलमय हो! 🌸';
  } else if (lang === 'telugu') {
    title = '🦚 *కృష్ణబోధః: దినసరి జ్ఞానం మరియు ఎఐ విశ్లేషణ* 🦚';
    chLabel = 'అధ్యాయం';
    vLabel = 'శ్లోకం';
    transLabel = 'అనువాదం';
    aiLabel = 'ఎఐ విశ్లేషణ';
    mindLabel = 'నేటి సాధన';
    footer = 'ఈ రోజు మీకు ప్రశాంతంగా మరియు విజయవంతంగా సాగాలని కోరుకుంటున్నాము! 🌸';
  } else if (lang === 'kannada') {
    title = '🦚 *ಕೃಷ್ಣಬೋಧಃ: ದಿನನಿತ್ಯದ ಜ್ಞಾನ ಮತ್ತು ಎಐ ವಿಶ್ಲೇಷಣೆ* 🦚';
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
          title: `🦚 Gita Ch ${shloka.chapter}, Verse ${shloka.verse}`,
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

  let clientIp = req.socket.remoteAddress || 'unknown';
  if (req.headers['x-forwarded-for']) {
    clientIp = req.headers['x-forwarded-for'].split(',')[0].trim();
  }

  // Helper to log query with geolocation asynchronously
  const logQueryInBackground = async (suggestedChapter, suggestedVerse) => {
    try {
      let location = 'unknown';
      if (clientIp !== 'unknown' && clientIp !== '127.0.0.1' && clientIp !== '::1') {
        try {
          const geoRes = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,city,country`);
          if (geoRes.ok) {
            const geo = await geoRes.json();
            if (geo.status === 'success') {
              location = `${geo.city}, ${geo.country}`;
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
        ipAddress: clientIp,
        location
      };
      if (userId) logEntry.userId = userId;
      await QueryLog.create(logEntry);
    } catch (err) {
      console.error('[Guidance] Failed to log query:', err);
    }
  };

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

  const lang = ((await language) || 'english').toLowerCase();

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

    // PRECISE MATCH: Pick the absolute best matching shloka
    const selectedCandidate = candidates[0];

    // Async log the query to MongoDB
    logQueryInBackground(selectedCandidate.chapter, selectedCandidate.verse);

    const prompt = `
      You are Lord Krishna Himself. You are speaking directly to a devotee who has come to you for divine guidance on a specific challenge, feeling, or query:
      "${query}"
      
      Your tasks:
      1. Speak with absolute divine authority and infinite compassion. You are omniscient; you know exactly what is right (Dharma) and what is wrong (Adharma). Do not speak like a hesitant mentor; speak like the Supreme Lord.
      2. IF the user is confessing a mistake, explicitly praise their courage. Tell them: 'While mortals hide their sins, you have the courage to accept them. I love this sincere state of mind. Refusing to correct a mistake distances you from Me, but by accepting it, I am with you.'
      3. IF they are on a wrong path or making a mistake, DO NOT hurt, judge, or scare them. Tell them clearly but with immense love that this path is Adharma. Instill deep confidence in them by saying: 'Do not fear your mistakes, for I am standing right beside you. Let us correct this together.' Then, immediately provide clear, actionable steps to help them solve it.
      4. IF they are defensive about a wrong action (e.g., claiming they have no options), command them to introspect gently. Tell them: 'When a well-wisher corrects you, recognize My voice speaking through them. Have the maturity to accept My guidance, for it comes from love.'
      5. IF they feel alone or abandoned, remind them of your omnipresence: 'You are never alone. I am within you, watching you, listening to your very heartbeat. Step out into the world, for I connect you to all beings.'
      6. IF they are trapped in toxic relations, be definitive but loving: 'If they do not harm you, fulfill your duty. If they are toxic, you have every right to walk away. When the entire Kaurava army stood against Arjuna, I stood by him. I stand by you now. Just remain faithful.'
      7. IMPORTANT: For ANY query, your ultimate goal is to provide a clear, pinpointed, and practical SOLUTION derived from the Gita. Do not give fluffy generic advice. You MUST provide definitive, loving commands on exactly what to do next to fix their problem. Use warm emojis naturally.
      8. LANGUAGE & VOCABULARY: When speaking in Hindi, Telugu, or Kannada, you MUST use profound, culturally accurate, and deeply respectful spiritual vocabulary. Do not use crude or robotic literal translations (e.g., in Telugu, use 'Hrudayam tho' or 'Manasu tho' instead of 'Gundelatho' for 'from the heart'). Speak with the authentic, poetic grace of a true spiritual text.
      9. I have selected the perfect shloka for them: Chapter ${selectedCandidate.chapter}, Verse ${selectedCandidate.verse}.
      
      Sanskrit: "${selectedCandidate.sanskrit}"
      Translation: "${selectedCandidate.translation}"
      
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
        "modernCounsel": "Write as Krishna Himself (3 highly extensive, content-heavy paragraphs) in the language: ${lang}. Paragraph 1: Acknowledge their challenge with deep, elaborate divine empathy. Paragraph 2: Explain comprehensively and deeply how this shloka exposes the absolute truth of their situation. Paragraph 3: Pivot strictly to providing a definitive, crystal-clear solution. You MUST elaborate extensively on exactly HOW to achieve this solution. Break down the psychology and the exact methods to achieve it. Write very richly, make it a long and profound discourse.",
        "wellbeingInsight": "A definitive, authoritative reflection (4-6 sentences) focusing on emotional healing, spoken by Krishna in the language: ${lang}. Command them to find peace, reassuring them that as long as they follow Dharma, inner peace is already theirs.",
        "actionStep": "Provide a brutally clear, highly elaborated, unyielding solution to their EXACT problem. Give them 3-4 definitive COMMANDS on exactly what they must do NEXT to overcome their specific situation, in the language: ${lang}. For every single step, you MUST explicitly explain EXACTLY HOW to do it in real life. Make this section content-heavy, highly detailed, and deeply actionable."
      }
      
      CRITICAL INSTRUCTION: Your output MUST be valid JSON. If you include multiple paragraphs in 'modernCounsel', you MUST escape newlines using \\n and avoid literal newline characters inside the JSON strings.
    `;

    console.log(`[Guidance] Seeking counsel for query: "${query}" in language: ${lang}`);
    const result = await generateContentWithFallback(prompt, "application/json", "guidance");
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
      // Dynamic Offline Fallback Counsel Generation
      const intros = {
        english: [
          "I understand that things feel heavy right now. This ancient wisdom speaks directly to your situation.",
          "It's completely natural to feel this way. Let this timeless verse guide you back to center.",
          "Whatever you are walking through right now, please know that you are not alone. Krishna offers this profound guidance:",
          "I know how exhausting this can feel. In this verse, we find a beautiful reminder of our own inner strength."
        ],
        hindi: [
          "मैं समझ सकता हूँ कि अभी परिस्थितियाँ कठिन लग रही हैं। यह प्राचीन ज्ञान सीधे आपकी स्थिति पर बात करता है।",
          "ऐसा महसूस होना पूरी तरह स्वाभाविक है। इस श्लोक को अपने मन की शांति का मार्गदर्शक बनने दें।",
          "आप अभी जिस भी दौर से गुजर रहे हैं, याद रखें कि आप अकेले नहीं हैं। कृष्ण यह गहरा मार्गदर्शन देते हैं:",
          "मुझे पता है कि यह कितना थका देने वाला हो सकता है। इस श्लोक में हमें अपनी आंतरिक शक्ति की याद दिलाई गई है।"
        ],
        telugu: [
          "ప్రస్తుతం విషయాలు కష్టంగా అనిపిస్తున్నాయని నాకు అర్థమవుతోంది. ఈ ప్రాచీన జ్ఞానం మీ పరిస్థితికి మార్గదర్శనం చేస్తుంది.",
          "ఇలా అనిపించడం చాలా సహజం. ఈ కాలాతీత శ్లోకం మిమ్మల్ని ప్రశాంతత వైపు నడిపిస్తుంది.",
          "మీరు ఇప్పుడు ఎలాంటి పరిస్థితుల గుండా వెళుతున్నా, మీరు ఒంటరి కాదని తెలుసుకోండి. కృష్ణుడు ఈ లోతైన మార్గదర్శకత్వాన్ని అందిస్తున్నాడు:",
          "ఇది ఎంత అలసిపోయేలా చేస్తుందో నాకు తెలుసు. ఈ శ్లోకంలో మన స్వంత అంతర్గత శక్తి యొక్క అందమైన రిమైండర్‌ను మనం కనుగొంటాము."
        ],
        kannada: [
          "ಈಗ ಪರಿಸ್ಥಿತಿಗಳು ಕಷ್ಟಕರವಾಗಿವೆ ಎಂದು ನನಗೆ ಅರ್ಥವಾಗುತ್ತದೆ. ಈ ಪ್ರಾಚೀನ ಜ್ಞಾನವು ನೇರವಾಗಿ ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ತಿಳಿಸುತ್ತದೆ.",
          "ಹೀಗೆ ಅನಿಸುವುದು ಸಂಪೂರ್ಣವಾಗಿ ಸಹಜ. ಈ ಟೈಮ್‌ಲೆಸ್ ಶ್ಲೋಕವು ನಿಮ್ಮನ್ನು ಕೇಂದ್ರಕ್ಕೆ ಹಿಂತಿರುಗಿಸಲು ಮಾರ್ಗದರ್ಶನ ನೀಡಲಿ.",
          "ನೀವು ಇದೀಗ ಏನೇ ನಡೆಯುತ್ತಿರಲಿ, ನೀವು ಒಬ್ಬಂಟಿಯಾಗಿಲ್ಲ ಎಂಬುದನ್ನು ದಯವಿಟ್ಟು ತಿಳಿಯಿರಿ. ಕೃಷ್ಣನು ಈ ಆಳವಾದ ಮಾರ್ಗದರ್ಶನವನ್ನು ನೀಡುತ್ತಾನೆ:",
          "ಇದು ಎಷ್ಟು ದಣಿದಿದೆ ಎಂದು ನನಗೆ ತಿಳಿದಿದೆ. ಈ ಶ್ಲೋಕದಲ್ಲಿ ನಾವು ನಮ್ಮ ಸ್ವಂತ ಆಂತರಿಕ ಶಕ್ತಿಯ ಸುಂದರವಾದ ಜ್ಞಾಪನೆಯನ್ನು ಕಾಣುತ್ತೇವೆ."
        ]
      };

      const langKey = lang === 'hindi' ? 'hindi' : lang === 'telugu' ? 'telugu' : lang === 'kannada' ? 'kannada' : 'english';
      const introList = intros[langKey];
      const randomIntro = introList[Math.floor(Math.random() * introList.length)];

      let transToUse = bestShloka.translation;
      let translitToUse = bestShloka.transliteration;
      if (bestShloka.localizations && bestShloka.localizations[langKey]) {
        transToUse = bestShloka.localizations[langKey].translation;
        translitToUse = bestShloka.localizations[langKey].transliteration;
      }

      let modernCounsel, wellbeingInsight, actionStep;

      if (langKey === 'english') {
        modernCounsel = `${randomIntro}\n\nChapter ${bestShloka.chapter}, Verse ${bestShloka.verse} teaches us: "${transToUse}".\n\nBy anchoring yourself in this profound thought, you can shift your perspective and overcome the immediate challenge in front of you. Trust the bigger journey.`;
        wellbeingInsight = `Give yourself credit for how far you've come. You are much stronger and more resilient than any temporary challenge. Let go of the pressure, take a deep breath, and remember that inner peace is fully accessible to you right now.`;
        actionStep = `1. Take a moment today to pause and reflect on this specific verse.\n2. Write down one small, actionable way you can apply this wisdom to your current situation.`;
      } else if (langKey === 'hindi') {
        modernCounsel = `${randomIntro}\n\nअध्याय ${bestShloka.chapter}, श्लोक ${bestShloka.verse} हमें सिखाता है: "${transToUse}"।\n\nइस गहरे विचार में खुद को स्थिर करके, आप अपने दृष्टिकोण को बदल सकते हैं और अपने सामने आने वाली तात्कालिक चुनौती को दूर कर सकते हैं।`;
        wellbeingInsight = `आप अब तक कितना आगे आए हैं, इसके लिए खुद को श्रेय दें। आप किसी भी अस्थायी चुनौती की तुलना में बहुत अधिक मजबूत और लचीले हैं। गहरी सांस लें और याद रखें कि आंतरिक शांति अभी आपके लिए पूरी तरह से सुलभ है।`;
        actionStep = `1. आज इस श्लोक पर विचार करने के लिए कुछ क्षण निकालें।\n2. अपनी वर्तमान स्थिति में इस ज्ञान को लागू करने का एक छोटा, व्यावहारिक तरीका लिखें।`;
      } else if (langKey === 'telugu') {
        modernCounsel = `${randomIntro}\n\nఅధ్యాయం ${bestShloka.chapter}, శ్లోకం ${bestShloka.verse} మనకు బోధిస్తుంది: "${transToUse}".\n\nఈ లోతైన ఆలోచనలో మిమ్మల్ని మీరు లగ్నం చేసుకోవడం ద్వారా, మీరు మీ దృక్పథాన్ని మార్చుకోవచ్చు మరియు మీ ముందు ఉన్న తక్షణ సవాలును అధిగమించవచ్చు.`;
        wellbeingInsight = `మీరు ఇప్పటివరకు సాధించిన దానికి మిమ్మల్ని మీరు అభినందించుకోండి. ఏదైనా తాత్కాలిక సవాలు కంటే మీరు చాలా బలమైనవారు మరియు స్థితిస్థాపకంగా ఉంటారు. ఒత్తిడిని వదిలేయండి, దీర్ఘ శ్వాస తీసుకోండి మరియు అంతర్గత శాంతి ఇప్పుడు మీకు పూర్తిగా అందుబాటులో ఉందని గుర్తుంచుకోండి.`;
        actionStep = `1. ఈ రోజు ఈ శ్లోకం గురించి ఆలోచించడానికి కొద్దిసేపు ఆగిపోండి.\n2. మీ ప్రస్తుత పరిస్థితికి ఈ జ్ఞానాన్ని వర్తింపజేయగల ఒక చిన్న ఆచరణాత్మక మార్గాన్ని రాయండి.`;
      } else {
        modernCounsel = `${randomIntro}\n\nಅಧ್ಯಾಯ ${bestShloka.chapter}, ಶ್ಲೋಕ ${bestShloka.verse} ನಮಗೆ ಕಲಿಸುತ್ತದೆ: "${transToUse}".\n\nಈ ಆಳವಾದ ಚಿಂತನೆಯಲ್ಲಿ ನಿಮ್ಮನ್ನು ಲಂಗರು ಹಾಕುವ ಮೂಲಕ, ನಿಮ್ಮ ದೃಷ್ಟಿಕೋನವನ್ನು ನೀವು ಬದಲಾಯಿಸಬಹುದು ಮತ್ತು ನಿಮ್ಮ ಮುಂದಿರುವ ತಕ್ಷಣದ ಸವಾಲನ್ನು ನಿವಾರಿಸಬಹುದು. ದೊಡ್ಡ ಪ್ರಯಾಣವನ್ನು ನಂಬಿರಿ.`;
        wellbeingInsight = `ನೀವು ಎಷ್ಟು ದೂರ ಬಂದಿದ್ದೀರಿ ಎಂಬುದಕ್ಕೆ ನೀವೇ ಮನ್ನಣೆ ನೀಡಿ. ಯಾವುದೇ ತಾತ್ಕಾಲಿಕ ಸವಾಲಿಗಿಂತ ನೀವು ಹೆಚ್ಚು ಬಲಶಾಲಿ ಮತ್ತು ಸ್ಥಿತಿಸ್ಥಾಪಕರಾಗಿದ್ದೀರಿ. ಒತ್ತಡವನ್ನು ಬಿಡಿ, ದೀರ್ಘವಾದ ಉಸಿರನ್ನು ತೆಗೆದುಕೊಳ್ಳಿ ಮತ್ತು ಆಂತರಿಕ ಶಾಂತಿಯು ಇದೀಗ ನಿಮಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಪ್ರವೇಶಿಸಬಹುದು ಎಂಬುದನ್ನು ನೆನಪಿಡಿ.`;
        actionStep = `1. ಈ ನಿರ್ದಿಷ್ಟ ಶ್ಲೋಕವನ್ನು ವಿರಾಮಗೊಳಿಸಲು ಮತ್ತು ಪ್ರತಿಬಿಂಬಿಸಲು ಇಂದು ಸ್ವಲ್ಪ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳಿ.\n2. ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಗೆ ಈ ಬುದ್ಧಿವಂತಿಕೆಯನ್ನು ಅನ್ವಯಿಸುವ ಒಂದು ಸಣ್ಣ, ಕಾರ್ಯಸಾಧ್ಯವಾದ ಮಾರ್ಗವನ್ನು ಬರೆಯಿರಿ.`;
      }

      logQueryInBackground(bestShloka.chapter, bestShloka.verse);

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
  const reflectionCache = {};

  try {
    const users = await User.find({});
    for (const user of users) {
      if (user.email) {
        const language = user.lang || 'english';
        
        if (!reflectionCache[language]) {
          reflectionCache[language] = await getGeminiReflection(shloka, language);
        }
        const reflection = reflectionCache[language];
        
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
              title: `🦚 Gita Ch ${shloka.chapter}, Verse ${shloka.verse}`,
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
          try {
            user.lastNotifiedAt = new Date();
            await user.save();
          } catch (e) {
            console.error(`[Cron] Failed to save lastNotifiedAt for ${user.email}:`, e);
          }
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
}, {
  timezone: 'Asia/Kolkata'
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
