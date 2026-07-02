import request from 'supertest';
import express from 'express';
import { History } from '../models/History.js';
import { jest } from '@jest/globals';

const app = express();
app.use(express.json());

// Mock endpoint implementation (mirroring server.js logic)
app.get('/api/history', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  try {
    const history = await History.findOne({ userId });
    res.json(history || { lastReadChapter: 1, lastReadVerse: 1 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', async (req, res) => {
  const { userId, chapter, verse } = req.body;
  if (!userId || !chapter || !verse) return res.status(400).json({ error: 'User ID, chapter, verse required' });
  try {
    const history = await History.findOneAndUpdate(
      { userId },
      { lastReadChapter: chapter, lastReadVerse: verse, updatedAt: Date.now() },
      { upsert: true, new: true }
    );
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save history' });
  }
});

describe('History API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/history', () => {
    test('returns 400 if userId is missing', async () => {
      const res = await request(app).get('/api/history');
      expect(res.status).toBe(400);
    });

    test('returns default history if no record found', async () => {
      jest.spyOn(History, 'findOne').mockResolvedValueOnce(null);
      const res = await request(app).get('/api/history?userId=user123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ lastReadChapter: 1, lastReadVerse: 1 });
    });

    test('returns user history if found', async () => {
      const mockHistory = { lastReadChapter: 5, lastReadVerse: 10 };
      jest.spyOn(History, 'findOne').mockResolvedValueOnce(mockHistory);
      
      const res = await request(app).get('/api/history?userId=user123');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockHistory);
    });
  });

  describe('POST /api/history', () => {
    test('returns 400 if required fields are missing', async () => {
      const res = await request(app).post('/api/history').send({ userId: '123' });
      expect(res.status).toBe(400);
    });

    test('updates and returns history', async () => {
      const mockUpdated = { lastReadChapter: 2, lastReadVerse: 47 };
      jest.spyOn(History, 'findOneAndUpdate').mockResolvedValueOnce(mockUpdated);

      const res = await request(app).post('/api/history').send({
        userId: 'user123',
        chapter: 2,
        verse: 47
      });
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdated);
      expect(History.findOneAndUpdate).toHaveBeenCalled();
    });
  });
});
