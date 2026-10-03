import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await User.updateMany({email: { $in: ['joshisameer051@gmail.com', 'sameer9032@gmail.com'] }}, { $set: { name: 'Sameer' } });
  console.log('Updated names to Sameer');
  process.exit(0);
});
