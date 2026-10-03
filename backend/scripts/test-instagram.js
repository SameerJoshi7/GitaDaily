import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { generateDailyImagesTask, triggerInstagramBroadcast } from '../services/broadcast.service.js';

async function run() {
  try {
    console.log('[Test] Connecting to MongoDB...');
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(uri);

    console.log('\n--- RUNNING 5:30 AM IMAGE GENERATION TASK ---');
    await generateDailyImagesTask();
    
    console.log('\n--- RUNNING 6:00 AM INSTAGRAM WEBHOOK TASK ---');
    // Note: This only sends the payload to Make.com, it does not email all users.
    await triggerInstagramBroadcast();
    
    console.log('\n[Test] Finished successfully!');
  } catch (err) {
    console.error('[Test] Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
