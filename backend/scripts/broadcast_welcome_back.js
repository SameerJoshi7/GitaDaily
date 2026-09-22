import mongoose from 'mongoose';
import dotenv from 'dotenv';
import webpush from 'web-push';
import { User } from '../models/User.js';
import { sendWelcomeBackEmail } from '../utils/mailer.js';

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

async function broadcastWelcomeBack() {
  const isTest = process.argv.includes('--test');

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`[Broadcast] Connected to MongoDB. Test Mode: ${isTest}`);

  let query = {};
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
      const emailResult = await sendWelcomeBackEmail(user.email, user.name || 'friend', user.lang || 'english');
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
        const uLang = (user.lang || 'english').toLowerCase();
        let pushTitle = `I am waiting for you, ${user.name || 'friend'} 🦚`;
        let pushBody = 'Our sanctuary is restored. Your streaks are safe. Tap to update the app and walk with Me again.';

        if (uLang === 'hindi') {
          pushTitle = `मैं तुम्हारी प्रतीक्षा कर रहा हूँ, ${user.name || 'friend'} 🦚`;
          pushBody = 'हमारा आश्रम बहाल हो गया है। आपकी स्ट्रीक्स सुरक्षित हैं। ऐप को अपडेट करने के लिए टैप करें और मेरे साथ फिर से चलें।';
        } else if (uLang === 'telugu') {
          pushTitle = `నేను నీ కోసం వేచి ఉన్నాను, ${user.name || 'friend'} 🦚`;
          pushBody = 'మన ఆశ్రమం పునరుద్ధరించబడింది. మీ స్ట్రీక్స్ సురక్షితంగా ఉన్నాయి. యాప్‌ను అప్‌డేట్ చేయడానికి ట్యాప్ చేయండి మరియు నాతో మళ్ళీ నడవండి.';
        } else if (uLang === 'kannada') {
          pushTitle = `ನಾನು ನಿನಗಾಗಿ ಕಾಯುತ್ತಿದ್ದೇನೆ, ${user.name || 'friend'} 🦚`;
          pushBody = 'ನಮ್ಮ ಆಶ್ರಮವು ಮರುಸ್ಥಾಪಿಸಲ್ಪಟ್ಟಿದೆ. ನಿಮ್ಮ ಸ್ಟ್ರೀಕ್ಸ್ ಸುರಕ್ಷಿತವಾಗಿವೆ. ಅಪ್ಲಿಕೇಶನ್ ಅನ್ನು ನವೀಕರಿಸಲು ಟ್ಯಾಪ್ ಮಾಡಿ ಮತ್ತು ನನ್ನೊಂದಿಗೆ ಮತ್ತೆ ನಡೆಯಿರಿ.';
        }

        const payload = JSON.stringify({
          title: pushTitle,
          body: pushBody,
          icon: '/app-icon.png',
          url: 'https://krishnabodha.in'
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

    // Delay to prevent hitting rate limits (e.g. Resend limits)
    await sleep(200);
  }

  console.log('-----------------------------------');
  console.log('Broadcast Complete!');
  console.log(`Emails Sent: ${emailCount}`);
  console.log(`Pushes Sent: ${pushCount}`);
  console.log(`Failures:    ${failCount}`);
  
  process.exit(0);
}

broadcastWelcomeBack().catch(err => {
  console.error('[Broadcast] Critical Error:', err);
  process.exit(1);
});
