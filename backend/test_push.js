import mongoose from 'mongoose';
import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();

webpush.setVapidDetails(
  'mailto:admin@krishnabodha.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  const userSchema = new mongoose.Schema({ email: String, pref: String, pushSubscription: Object }, { strict: false });
  const User = mongoose.model('UserTemp', userSchema, 'users');
  
  const users = await User.find({ pushSubscription: { $exists: true, $ne: null } }).sort({ _id: -1 }).limit(3);
  console.log('Users with push:', users.map(u => u.email));
  
  if (users.length > 0) {
    const user = users[0];
    console.log('Testing push to', user.email);
    try {
      await webpush.sendNotification(user.pushSubscription, JSON.stringify({ title: 'Debug', body: 'Test from script' }));
      console.log('Push success!');
    } catch (err) {
      console.error('Push failed:', err.statusCode, err.body);
    }
  }
  process.exit(0);
}
test();
