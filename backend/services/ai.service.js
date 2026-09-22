import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { readData, writeData, REFLECTIONS_CACHE_PATH } from '../utils/file.js';
import { DAILY_SHLOKA_PROMPT } from '../config/ai-prompts.js';

dotenv.config();

// Initialize AI Providers
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('[AI Setup] Gemini initialized successfully');
} else {
  console.error('[AI Setup] GEMINI_API_KEY not found in .env');
}

let groq = null;
if (process.env.GROQ_API_KEY) {
  groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
  });
  console.log('[AI Setup] Groq (Llama-3) fallback initialized successfully');
} else {
  console.error('[AI Setup] GROQ_API_KEY not found in .env. Fallback disabled.');
}

const inFlightReflections = new Map();

/**
 * Generates content using Gemini, with a fallback to Groq if Gemini fails.
 */
export const generateContentWithFallback = async (prompt, responseMimeType = "text/plain", context = "") => {
  let geminiError = null;
  
  if (genAI) {
    try {
      console.log(`[AI] Attempting generation with Gemini (Context: ${context})...`);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: responseMimeType,
        }
      });
      console.log(`[AI] Gemini generation successful for ${context}.`);
      return result;
    } catch (err) {
      console.warn(`[AI] Gemini generation failed for ${context}:`, err.message);
      geminiError = err;
    }
  }

  // Fallback to Groq
  if (groq) {
    try {
      console.log(`[AI] Attempting fallback generation with Groq (Context: ${context})...`);
      const responseFormat = responseMimeType === "application/json" ? { type: "json_object" } : null;
      
      const completion = await groq.chat.completions.create({
        model: "llama-3.1-70b-versatile", // Updated Groq model
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: responseFormat
      });

      console.log(`[AI] Groq generation successful for ${context}.`);
      return {
        response: {
          text: () => completion.choices[0]?.message?.content || ""
        }
      };
    } catch (groqErr) {
      console.error(`[AI] Groq fallback also failed for ${context}:`, groqErr.message);
      throw new Error(`Both Gemini and Groq failed. Gemini: ${geminiError?.message}, Groq: ${groqErr.message}`);
    }
  }

  throw new Error(`Gemini failed and no Groq fallback available. Error: ${geminiError?.message}`);
};

/**
 * Gets reflection for a specific shloka, using cache and preventing stampedes.
 */
export const getGeminiReflection = async (shloka, language) => {
  if (!genAI && !groq) {
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
  const cache = await readData(REFLECTIONS_CACHE_PATH);
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  // Prevent cache stampede (thundering herd) on concurrent identical requests
  if (inFlightReflections.has(cacheKey)) {
    return await inFlightReflections.get(cacheKey);
  }

  const generatePromise = (async () => {
    try {
      const prompt = DAILY_SHLOKA_PROMPT(shloka, language);

      const result = await generateContentWithFallback(prompt, "application/json", "guidance");
      const counselStr = result.response.text();
      const parsed = JSON.parse(counselStr);

      // Save to cache
      cache[cacheKey] = parsed;
      await writeData(REFLECTIONS_CACHE_PATH, cache);

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
          modernReflection: "कर्म में शक्ति खोजें।",
          emotionalWellbeing: "सुख और दुख में समभाव रखें।",
          careerApplication: "फल की चिंता किए बिना अपना कर्तव्य निभाएं।",
          mindfulnessTip: "गहरी सांस लें और वर्तमान पर ध्यान केंद्रित करें।",
          translatedTranslation: trans,
          translatedTransliteration: translit
        };
      }
      return {
        modernReflection: "Find strength in your prescribed duty.",
        emotionalWellbeing: "Maintain equanimity in all circumstances.",
        careerApplication: "Perform your work without attachment to the results.",
        mindfulnessTip: "Affirm: 'I am centered, focused, and detached from results.'"
      };
    }
  })();

  inFlightReflections.set(cacheKey, generatePromise);
  try {
    const result = await generatePromise;
    return result;
  } finally {
    inFlightReflections.delete(cacheKey);
  }
};

export const getGenAIInstance = () => genAI;
