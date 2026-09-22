import cron from 'node-cron';
import webpush from 'web-push';
import { User } from '../models/User.js';
import { sendDailySubscribersReport } from '../utils/mailer.js';
import { broadcastDailyShloka } from '../services/broadcast.service.js';

export function initCronJobs() {
  console.log('[Cron] Initializing scheduled tasks...');

  // 1. Daily Evening Inactivity Nudge at 8:00 PM (20:00) IST
  cron.schedule('0 20 * * *', async () => {
    console.log('[Cron] Checking for inactive users to send evening nudge...');
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Find users whose preference allows push, have a push subscription,
      // and who haven't opened the app today (or ever), but only if missedDaysCount < 3
      const inactiveUsers = await User.find({
        $and: [
          { $or: [{ pref: 'push' }, { pref: 'all' }] },
          { $or: [{ lastActiveAt: { $lt: todayStart } }, { lastActiveAt: { $exists: false } }] }
        ],
        pushSubscription: { $exists: true, $ne: null },
        missedDaysCount: { $lt: 3 }
      });

      for (const user of inactiveUsers) {
        try {
          const payload = JSON.stringify({
            title: 'Take a moment for yourself 🦚',
            body: 'Don\'t forget your daily moment of peace. Your Krishna Bodha Shloka is waiting for you.',
            url: '/'
          });
          await webpush.sendNotification(user.pushSubscription, payload);
          
          // Increment missed days count
          user.missedDaysCount = (user.missedDaysCount || 0) + 1;
          await user.save();
        } catch (err) {
          console.error(`[WebPush] Failed evening nudge for ${user.email}:`, err.message);
        }
      }
      console.log(`[Cron] Evening nudge sent to ${inactiveUsers.length} users.`);
    } catch (err) {
      console.error('[Cron] Error processing evening nudge:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // 2. Sunday Morning Reflection at 9:00 AM IST
  cron.schedule('0 9 * * 0', async () => {
    console.log('[Cron] Triggering Sunday Reflection...');
    try {
      const users = await User.find({
        $or: [{ pref: 'push' }, { pref: 'all' }],
        pushSubscription: { $exists: true, $ne: null }
      });
      for (const user of users) {
        try {
          const payload = JSON.stringify({
            title: 'Sunday Reflection 🌸',
            body: 'Take a deep breath and review the verses you saved this week to start your Sunday with clarity.',
            url: '/#/bookmarks'
          });
          await webpush.sendNotification(user.pushSubscription, payload);
        } catch (err) {}
      }
    } catch (err) {
      console.error('[Cron] Error processing Sunday Reflection:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // 3. Wednesday Evening "Seek Guidance" Reminder at 6:00 PM (18:00) IST
  cron.schedule('0 18 * * 3', async () => {
    console.log('[Cron] Triggering Wednesday Guidance reminder...');
    try {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const users = await User.find({
        $and: [
          { $or: [{ pref: 'push' }, { pref: 'all' }] },
          { $or: [{ lastGuidanceAt: { $lt: twoWeeksAgo } }, { lastGuidanceAt: { $exists: false } }] }
        ],
        pushSubscription: { $exists: true, $ne: null }
      });

      for (const user of users) {
        try {
          const payload = JSON.stringify({
            title: 'Feeling overwhelmed? 🕉️',
            body: 'Krishna is here to listen. Share what\'s on your mind and seek divine counsel.',
            url: '/#/guidance'
          });
          await webpush.sendNotification(user.pushSubscription, payload);
        } catch (err) {}
      }
    } catch (err) {
      console.error('[Cron] Error processing Wednesday reminder:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // 4. Daily Admin Report: New Subscribers at 11:59 PM IST
  cron.schedule('59 23 * * *', async () => {
    console.log('[Cron] Triggering Daily Subscribers Report...');
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const newUsersCount = await User.countDocuments({
        createdAt: { $gte: startOfDay }
      });

      const totalUsersCount = await User.countDocuments();

      await sendDailySubscribersReport(newUsersCount, totalUsersCount);
      console.log(`[Cron] Sent daily report: ${newUsersCount} new, ${totalUsersCount} total.`);
    } catch (err) {
      console.error('[Cron] Error sending daily subscribers report:', err);
    }
  }, { timezone: 'Asia/Kolkata' });

  // Schedule morning broadcast daily at 6:00 AM local time
  cron.schedule('0 6 * * *', async () => {
    console.log('[Cron] Triggering daily morning shloka broadcast...');
    await broadcastDailyShloka();
  }, {
    timezone: 'Asia/Kolkata'
  });
}
