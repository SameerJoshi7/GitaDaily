import mongoose from 'mongoose';

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // One history document per user
  },
  lastReadChapter: {
    type: Number,
    required: true,
  },
  lastReadVerse: {
    type: Number,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

export const History = mongoose.model('History', historySchema);
