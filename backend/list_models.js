import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const aiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(aiKey);

async function list() {
  const models = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${aiKey}`).then(r => r.json());
  console.log(models.models.map(m => m.name));
}

list();
