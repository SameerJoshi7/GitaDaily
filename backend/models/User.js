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
    enum: ['email', 'push', 'all'],
    default: 'email',
  },
  lang: {
    type: String,
    default: 'english',
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
