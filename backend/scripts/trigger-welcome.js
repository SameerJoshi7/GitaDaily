import mongoose from 'mongoose';
import dotenv from 'dotenv';
import webpush from 'web-push';
import nodemailer from 'nodemailer';
import { User } from '../models/User.js';

dotenv.config();

// Setup Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:team@krishnabodha.in',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Setup Nodemailer
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    }
  });
}

const WELCOME_SUBJECT = 'A Message from Lord Krishna for You ✨';
const WELCOME_BODY_HTML = `
  <div style="font-family: Arial, sans-serif; background-color: #0a0b10; color: #f3f4f6; padding: 40px 20px; text-align: center;">
    <img src="https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/flute-icon.png" alt="Flute Logo" style="width: 48px; height: 48px; margin-bottom: 20px;" />
    <h2 style="color: #d4af37; font-family: 'Georgia', serif; font-size: 24px;">Welcome Back to Krishna Bodha</h2>
    <p style="font-size: 16px; line-height: 1.6; color: #e5e7eb; max-width: 600px; margin: 0 auto 30px auto;">
      <em>"Whenever there is a decline in righteousness and an upsurge in unrighteousness, at that time, I manifest myself on earth."</em><br/><br/>
      — <strong>Bhagavad Gita 4.7</strong>
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; max-width: 600px; margin: 0 auto 30px auto;">
      My dear devotee,<br/>
      We have rebuilt the foundations of Krishna Bodha to bring you a faster, more beautiful, and profoundly deep experience. The Lord's words are eternal, and now our platform is truly worthy of carrying them.
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #9ca3af; max-width: 600px; margin: 0 auto;">
      Log in today to seek personalized divine guidance and immerse yourself in daily wisdom.<br/><br/>
      With blessings,<br/>
      <strong>The Krishna Bodha Team</strong>
    </p>
  </div>
`;

async function triggerWelcome() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing');
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[DB] Connected to MongoDB');

    const users = await User.find({});
    console.log(`[Script] Found ${users.length} users.`);

    let emailCount = 0;
    let pushCount = 0;

    for (const user of users) {
      // Send Email
      if (user.email && (user.pref === 'email' || user.pref === 'both' || user.pref === 'all')) {
        try {
          if (process.env.RESEND_API_KEY) {
            await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                from: 'Krishna Bodha <team@krishnabodha.in>',
                to: user.email,
                subject: WELCOME_SUBJECT,
                html: WELCOME_BODY_HTML,
              })
            });
            emailCount++;
          } else if (transporter) {
            await transporter.sendMail({
              from: `"Krishna Bodha" <${process.env.EMAIL_USER}>`,
              to: user.email,
              subject: WELCOME_SUBJECT,
              html: WELCOME_BODY_HTML
            });
            emailCount++;
          }
        } catch (err) {
          console.error(`[Email Error] Failed for ${user.email}:`, err.message);
        }
      }

      // Send Push Notification
      if (user.pushSubscription && (user.pref === 'push' || user.pref === 'all' || user.pref === 'both')) {
        try {
          const payload = JSON.stringify({
            title: 'Welcome Back to Krishna Bodha ✨',
            body: 'We have rebuilt our platform to bring you deeper daily wisdom. Tap to seek guidance.',
            url: 'https://krishnabodha.in',
            image: 'https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/chariot.jpg'
          });
          await webpush.sendNotification(user.pushSubscription, payload);
          pushCount++;
        } catch (err) {
          console.error(`[Push Error] Failed for ${user.email}:`, err.message);
        }
      }
    }

    console.log(`\n🎉 Welcome Broadcast Complete!`);
    console.log(`Emails sent: ${emailCount}`);
    console.log(`Push notifications sent: ${pushCount}`);
    process.exit(0);

  } catch (err) {
    console.error('[Script Error]', err);
    process.exit(1);
  }
}

triggerWelcome();
