import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  chapter: {
    type: Number,
    required: true,
  },
  verse: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Ensure a user can only bookmark a specific verse once
bookmarkSchema.index({ userId: 1, chapter: 1, verse: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
