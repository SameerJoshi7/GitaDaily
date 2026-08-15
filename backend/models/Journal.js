import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  chapter: {
    type: Number,
    required: true
  },
  verse: {
    type: Number,
    required: true
  },
  note: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure a user only has one journal entry per verse, 
// they can update it instead of creating duplicates.
journalSchema.index({ email: 1, chapter: 1, verse: 1 }, { unique: true });

export const Journal = mongoose.model('Journal', journalSchema);
