import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: '',
  },
  pref: {
    type: String,
    enum: ['email', 'telegram', 'push', 'both', 'all'],
    default: 'email',
  },
  lang: {
    type: String,
    default: 'english',
  },
  telegramChatId: {
    type: Number,
  },
  pushSubscription: {
    type: Object,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export const User = mongoose.model('User', userSchema);
