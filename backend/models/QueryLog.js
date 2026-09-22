import mongoose from 'mongoose';

const queryLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  query: {
    type: String,
    required: true,
  },
  location: {
    type: String,
  },
  language: {
    type: String,
    default: 'english',
  },
  suggestedChapter: {
    type: Number,
  },
  suggestedVerse: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Index for efficient per-user query lookup and cleanup of old entries
queryLogSchema.index({ userId: 1, createdAt: -1 });

export const QueryLog = mongoose.model('QueryLog', queryLogSchema);
