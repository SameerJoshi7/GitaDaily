import mongoose from 'mongoose';
import dotenv from 'dotenv';
import webpush from 'web-push';
import { User } from '../models/User.js';
import { sendReleaseNotesEmail } from '../utils/mailer.js';

dotenv.config();

// Web Push setup
const publicVapidKey = process.env.VAPID_PUBLIC_KEY;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY;
if (publicVapidKey && privateVapidKey) {
  webpush.setVapidDetails(
    'mailto:team@krishnabodha.in',
    publicVapidKey,
    privateVapidKey
  );
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function broadcastReleaseNotes() {
  const version = 'v1.1.0';
  const isTest = process.argv.includes('--test');

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`[Broadcast] Connected to MongoDB. Test Mode: ${isTest}`);

  let query = { verified: true };
  if (isTest) {
    // Only send to an explicitly specified test user or first verified user
    const testEmailIndex = process.argv.indexOf('--email');
    if (testEmailIndex > -1 && process.argv[testEmailIndex + 1]) {
      query.email = process.argv[testEmailIndex + 1];
    } else {
      console.warn('[Broadcast] In test mode, picking one random verified user.');
    }
  }

  const users = await User.find(query).limit(isTest ? 1 : 0);
  console.log(`[Broadcast] Found ${users.length} users to process.`);

  let emailCount = 0;
  let pushCount = 0;
  let failCount = 0;

  for (const user of users) {
    console.log(`Processing user: ${user.email} (pref: ${user.pref})`);

    // 1. Send Email
    if (['email', 'all'].includes(user.pref)) {
      const emailResult = await sendReleaseNotesEmail(user.email, version);
      if (emailResult.success) {
        emailCount++;
      } else {
        console.error(`  - Failed to email ${user.email}: ${emailResult.error}`);
        failCount++;
      }
    }

    // 2. Send Push Notification
    if (['push', 'all'].includes(user.pref) && user.pushSubscription) {
      if (!publicVapidKey || !privateVapidKey) {
        console.error(`  - Skipping push for ${user.email}: VAPID keys not configured`);
      } else {
        const payload = JSON.stringify({
          title: `Krishna Bodha ${version} is here!`,
          body: `Check out the new 🔥 Sadhana Streaks feature in the app.`,
          icon: '/flute-icon.png',
          url: '/'
        });

        try {
          await webpush.sendNotification(user.pushSubscription, payload);
          console.log(`  - Push sent to ${user.email}`);
          pushCount++;
        } catch (err) {
          console.error(`  - Push failed for ${user.email}:`, err.message);
          if (err.statusCode === 410 || err.statusCode === 404) {
            user.pushSubscription = null;
            user.pref = 'email'; // fallback
            await user.save();
            console.log(`  - Unsubscribed ${user.email} from push due to expired subscription.`);
          }
          failCount++;
        }
      }
    }

    // Delay to prevent hitting rate limits
    await sleep(200);
  }

  console.log('\n--- Broadcast Complete ---');
  console.log(`Total Emails Sent: ${emailCount}`);
  console.log(`Total Pushes Sent: ${pushCount}`);
  console.log(`Total Failures:    ${failCount}`);

  await mongoose.disconnect();
  process.exit(0);
}

broadcastReleaseNotes().catch(err => {
  console.error('[Broadcast] Fatal error:', err);
  process.exit(1);
});
