import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    default: '',
    trim: true,
  },
  phone: {
    type: String,
    default: '',
  },
  pref: {
    type: String,
    enum: ['none', 'email', 'push', 'all'],
    default: 'none',
  },
  lang: {
    type: String,
    default: 'english',
  },

  pushSubscription: {
    type: Object,
  },
  lastNotifiedAt: {
    type: Date,
  },
  lastActiveAt: {
    type: Date,
  },
  missedDaysCount: {
    type: Number,
    default: 0,
  },
  lastGuidanceAt: {
    type: Date,
  },
  guidanceHistory: [{
    query: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

export const User = mongoose.model('User', userSchema);
