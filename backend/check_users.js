import mongoose from 'mongoose';
import { User } from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const users = await User.find({email: { $in: ['joshisameer051@gmail.com', 'sameer9032@gmail.com'] }});
  console.log(users.map(u => ({ email: u.email, name: u.name, lang: u.lang })));
  process.exit(0);
});
