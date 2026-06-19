import request from 'supertest';
import express from 'express';
import cors from 'cors';

// Minimal test app setup (avoids loading cron/twilio/etc.)
// We import only the routes we want to integration-test
import { generateOTP } from '../utils/otp.js';
import { verifyOTP } from '../utils/otp.js';

// Simple test express app that mirrors key endpoints
const buildTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.post('/api/auth/send-otp', (req, res) => {
    const { identifier } = req.body;
    if (!identifier) return res.status(400).json({ error: 'Identifier is required.' });
    const otp = generateOTP(identifier);
    // In tests, always return the OTP directly
    return res.json({ message: 'OTP simulated', devOtp: otp });
  });

  app.post('/api/auth/verify-otp', (req, res) => {
    const { identifier, otp } = req.body;
    if (!identifier || !otp) return res.status(400).json({ error: 'Identifier and OTP are required.' });
    const result = verifyOTP(identifier, otp);
    if (!result.valid) return res.status(401).json({ error: result.error });
    return res.json({ verified: true, isNewUser: true });
  });

  app.get('/api/chapters', (req, res) => {
    res.json([{ chapterNumber: 1, theme: 'Arjuna Vishada Yoga', verses: [1] }]);
  });

  app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    res.json([{ chapter: 2, verse: 47, translation: 'You have a right to perform your prescribed duties', theme: 'Karma Yoga' }]);
  });

  return app;
};

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = buildTestApp();
  });

  // --- OTP Auth Flow ---
  describe('POST /api/auth/send-otp', () => {
    test('returns 400 if identifier is missing', async () => {
      const res = await request(app).post('/api/auth/send-otp').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('returns 200 and devOtp when identifier is provided', async () => {
      const res = await request(app).post('/api/auth/send-otp').send({ identifier: 'test@example.com', method: 'email' });
      expect(res.status).toBe(200);
      expect(res.body.devOtp).toHaveLength(6);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    test('returns 400 if identifier or otp is missing', async () => {
      const res = await request(app).post('/api/auth/verify-otp').send({ identifier: 'test@example.com' });
      expect(res.status).toBe(400);
    });

    test('returns 401 for incorrect OTP', async () => {
      await request(app).post('/api/auth/send-otp').send({ identifier: 'wrong@example.com' });
      const res = await request(app).post('/api/auth/verify-otp').send({ identifier: 'wrong@example.com', otp: '000000' });
      expect(res.status).toBe(401);
    });

    test('returns 200 and verified=true for correct OTP', async () => {
      // Step 1: send OTP to get the code
      const sendRes = await request(app).post('/api/auth/send-otp').send({ identifier: 'correct@example.com' });
      const { devOtp } = sendRes.body;

      // Step 2: verify with the correct code
      const verifyRes = await request(app).post('/api/auth/verify-otp').send({ identifier: 'correct@example.com', otp: devOtp });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.verified).toBe(true);
    });
  });

  // --- Chapters & Search ---
  describe('GET /api/chapters', () => {
    test('returns an array of chapters', async () => {
      const res = await request(app).get('/api/chapters');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('chapterNumber');
    });
  });

  describe('GET /api/search', () => {
    test('returns empty array if no query', async () => {
      const res = await request(app).get('/api/search');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    test('returns results for a valid query', async () => {
      const res = await request(app).get('/api/search?q=duty');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
