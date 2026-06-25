import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Bookmark } from './models/Bookmark.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const BOOKMARKS_PATH = path.join(DATA_DIR, 'bookmarks.json');

const readData = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (e) {
    console.error(`Error reading ${filePath}`, e);
  }
  return [];
};

async function migrateData() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not found in .env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!");

    // Migrate Users
    const users = readData(USERS_PATH);
    console.log(`Found ${users.length} users in JSON.`);
    for (const u of users) {
      if (typeof u === 'object' && u.email) {
        try {
          await User.findOneAndUpdate(
            { email: u.email },
            { 
              phone: u.phone || '',
              pref: u.pref || 'email',
              lang: u.lang || 'english',
              telegramChatId: u.telegramChatId,
              pushSubscription: u.pushSubscription
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error(`Failed to migrate user ${u.email}:`, err.message);
        }
      }
    }
    console.log("Users migrated.");

    // Migrate Bookmarks
    const bookmarks = readData(BOOKMARKS_PATH);
    console.log(`Found ${bookmarks.length} bookmarks in JSON.`);
    for (const b of bookmarks) {
      if (b.email && b.chapter && b.verse) {
        try {
          await Bookmark.findOneAndUpdate(
            { email: b.email, chapter: b.chapter, verse: b.verse },
            { email: b.email, chapter: b.chapter, verse: b.verse },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error(`Failed to migrate bookmark for ${b.email}:`, err.message);
        }
      }
    }
    console.log("Bookmarks migrated.");

    console.log("Migration Complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateData();
