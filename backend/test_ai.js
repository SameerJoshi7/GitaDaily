import dotenv from 'dotenv';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const groqKey = process.env.GROQ_API_KEY;
let groq = null;
if (groqKey) {
  groq = new OpenAI({ apiKey: groqKey, baseURL: 'https://api.groq.com/openai/v1' });
} else {
  console.log("No GROQ_API_KEY found in .env");
}

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

async function generateContentWithFallback(prompt, responseMimeType = "text/plain", featureContext = "guidance") {
  let models = ["groq-llama3-70b-8192", "gemini-1.5-pro", "gemini-1.5-flash"];
  let lastError;

  for (const modelName of models) {
    try {
      console.log(`[Test] Trying model: ${modelName}`);
      if (modelName.startsWith('groq-')) {
        if (!groq) throw new Error("Groq client not initialized");
        const actualModelName = modelName.replace('groq-', '');
        const response = await groq.chat.completions.create({
          model: actualModelName,
          messages: [{ role: "user", content: prompt }],
          response_format: responseMimeType === "application/json" ? { type: "json_object" } : { type: "text" }
        });
        return { model: modelName, text: response.choices[0].message.content };
      } else if (modelName.startsWith('gemini')) {
        if (!genAI) throw new Error("Gemini client not initialized");
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType }
        });
        return { model: modelName, text: result.response.text() };
      }
    } catch (error) {
      lastError = error;
      console.log(`[Test] Model ${modelName} failed. Status: ${error.status}`);
      if (error.error) console.log(`Groq Error Details:`, error.error);
    }
  }
  throw lastError;
}

async function test() {
  try {
    console.log("Starting Groq test...");
    
    // Use the exact prompt structure from guidance to test JSON mode compatibility
    const prompt = `
      You are a warm, wise, and deeply compassionate spiritual mentor and close friend who knows the Bhagavad Gita by heart.
      The user is coming to you for personal, friendly advice on a specific challenge, feeling, or query they are facing:
      "I feel lonely"
      
      Your tasks:
      1. Listen deeply to the user's challenge.
      
      4. Format your output as a valid JSON object matching this schema exactly:
      {
        "modernCounsel": "Your highly empathetic, conversational, and direct counsel offering practical solutions to the specific problem... (Use warm emojis)",
        "wellbeingInsight": "A very short, powerful spiritual truth or shift in perspective based on the verse.",
        "actionStep": "One extremely specific, simple thing they can do RIGHT NOW."
      }
      
      CRITICAL INSTRUCTION: Your output MUST be valid JSON. If you include multiple paragraphs in 'modernCounsel', you MUST escape newlines using \\n and avoid literal newline characters inside the JSON strings.
    `;
    
    const result = await generateContentWithFallback(prompt, "application/json", "guidance");
    console.log("SUCCESS! Used model:", result.model);
    console.log("Raw output:", result.text);
    const parsed = JSON.parse(result.text);
    console.log("Parsed JSON successfully:", parsed);
  } catch (error) {
    console.error("TOTAL FAILURE:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);
    if (error.response && error.response.data) {
        console.error("Data:", error.response.data);
    }
  }
}

test();
