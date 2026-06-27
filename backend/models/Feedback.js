import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: 'Guest'
  },
  guidanceRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  appRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  suggestions: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Feedback = mongoose.model('Feedback', feedbackSchema);
