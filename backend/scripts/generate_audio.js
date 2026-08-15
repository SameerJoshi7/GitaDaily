import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('ERROR: OPENAI_API_KEY is not set in your .env file.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey });

// Configuration
const VOICE = 'onyx'; // Deep, clear male voice ('onyx' or 'echo' are best for this)
const OUTPUT_DIR = path.resolve('../frontend/public/audio/verse_recitation');

// Number of verses per chapter in the Bhagavad Gita
const chapterVerseCounts = [
  47, 72, 43, 42, 29, 47, 30, 28, 34, 42, 55, 20, 35, 27, 20, 24, 28, 78
];

async function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function fetchVerseText(chapter, verse) {
  const res = await fetch(`https://vedicscriptures.github.io/slok/${chapter}/${verse}`);
  if (!res.ok) throw new Error(`Failed to fetch text for ${chapter}:${verse}`);
  const data = await res.json();
  return data.slok;
}

async function generateAudioForVerse(chapter, verse) {
  const chapterDir = path.join(OUTPUT_DIR, String(chapter));
  await ensureDir(chapterDir);
  
  const filePath = path.join(chapterDir, `${verse}.mp3`);
  
  // Skip if already exists so we can resume if interrupted
  if (fs.existsSync(filePath)) {
    console.log(`Skipping Chapter ${chapter} Verse ${verse} (Already exists)`);
    return;
  }

  console.log(`Generating Chapter ${chapter} Verse ${verse}...`);
  try {
    const slok = await fetchVerseText(chapter, verse);
    
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: VOICE,
      input: slok,
      speed: 0.9, // Slightly slower for better Sanskrit pronunciation clarity
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    console.log(`  -> Saved ${filePath}`);
    
  } catch (err) {
    console.error(`  -> Failed for ${chapter}:${verse}`, err.message);
  }
}

async function main() {
  console.log('Starting Gita Audio Generation with OpenAI TTS...');
  console.log('Output Directory:', OUTPUT_DIR);
  
  for (let c = 1; c <= 18; c++) {
    const totalVerses = chapterVerseCounts[c - 1];
    for (let v = 1; v <= totalVerses; v++) {
      await generateAudioForVerse(c, v);
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log('Generation Complete!');
}

main().catch(console.error);
