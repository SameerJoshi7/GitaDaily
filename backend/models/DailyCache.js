import mongoose from 'mongoose';

const dailyCacheSchema = new mongoose.Schema({
  dateStr: { type: String, required: true, unique: true },
  imageUrls: { type: Object, default: {} },
  createdAt: { type: Date, expires: '7d', default: Date.now }
});

export const DailyCache = mongoose.model('DailyCache', dailyCacheSchema);
