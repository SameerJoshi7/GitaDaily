import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.updateOne({email: 'sameer9032@gmail.com'}, { $set: { lang: 'telugu' } });
  console.log('Updated language to telugu');
  process.exit(0);
});
