import request from 'supertest';
import express from 'express';
import { Journal } from '../models/Journal.js';
import { jest } from '@jest/globals';

const app = express();
app.use(express.json());

// Mock endpoint implementation (mirroring server.js logic for /api/journal)
app.get('/api/journal', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const journals = await Journal.find({ email }).sort({ updatedAt: -1 });
    res.json(journals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journals' });
  }
});

app.post('/api/journal', async (req, res) => {
  const { email, chapter, verse, note } = req.body;
  if (!email || !chapter || !verse) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (!note || note.trim() === '') {
      // Delete if note is empty
      await Journal.deleteOne({ email, chapter, verse });
      return res.json({ success: true, deleted: true });
    }

    const entry = await Journal.findOneAndUpdate(
      { email, chapter, verse },
      { note },
      { upsert: true, new: true }
    );
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save journal' });
  }
});

describe('Journal API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/journal', () => {
    test('returns 400 if email is missing', async () => {
      const res = await request(app).get('/api/journal');
      expect(res.status).toBe(400);
    });

    test('returns empty array if no journals found', async () => {
      jest.spyOn(Journal, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValueOnce([])
      });
      const res = await request(app).get('/api/journal?email=test@example.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns user journals if found', async () => {
      const mockJournals = [{ chapter: 1, verse: 1, note: 'Test note' }];
      jest.spyOn(Journal, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValueOnce(mockJournals)
      });
      
      const res = await request(app).get('/api/journal?email=test@example.com');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockJournals);
    });
  });

  describe('POST /api/journal', () => {
    test('returns 400 if required fields are missing', async () => {
      const res = await request(app).post('/api/journal').send({ email: 'test@example.com' });
      expect(res.status).toBe(400);
    });

    test('deletes journal if note is empty', async () => {
      jest.spyOn(Journal, 'deleteOne').mockResolvedValueOnce({ deletedCount: 1 });

      const res = await request(app).post('/api/journal').send({
        email: 'test@example.com',
        chapter: 2,
        verse: 47,
        note: ''
      });
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, deleted: true });
      expect(Journal.deleteOne).toHaveBeenCalledWith({ email: 'test@example.com', chapter: 2, verse: 47 });
    });

    test('updates and returns journal entry', async () => {
      const mockUpdated = { chapter: 2, verse: 47, note: 'New note' };
      jest.spyOn(Journal, 'findOneAndUpdate').mockResolvedValueOnce(mockUpdated);

      const res = await request(app).post('/api/journal').send({
        email: 'test@example.com',
        chapter: 2,
        verse: 47,
        note: 'New note'
      });
      
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockUpdated);
      expect(Journal.findOneAndUpdate).toHaveBeenCalled();
    });
  });
});
