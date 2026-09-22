import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import webpush from 'web-push';
import { broadcastDailyShloka } from './services/broadcast.service.js';

import authRoutes from './routes/auth.routes.js';
import pushRoutes from './routes/push.routes.js';
import userRoutes from './routes/user.routes.js';
import shlokaRoutes from './routes/shloka.routes.js';
import guidanceRoutes from './routes/guidance.routes.js';
import interactionRoutes from './routes/interaction.routes.js';

import { initCronJobs } from './cron/scheduler.js';
import { getGenAIInstance } from './services/ai.service.js';
import { getGitaData } from './services/data.service.js';
import { triggerWelcome } from './scripts/trigger-welcome.js';

dotenv.config();

// Ensure required environment variables exist
const requiredEnvs = ['MONGO_URI', 'JWT_SECRET', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'];
const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
if (missingEnvs.length > 0) {
  console.error(`[Fatal] Missing required environment variables: ${missingEnvs.join(', ')}`);
  process.exit(1);
}

// Ensure Mailer config exists
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('[Warning] EMAIL_USER or EMAIL_PASS not set. Email functionality will fail.');
}

// Ensure AI keys exist
if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) {
  console.warn('[Warning] No AI API keys (GEMINI_API_KEY or GROQ_API_KEY) found. AI Guidance will be disabled.');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Web Push setup
webpush.setVapidDetails(
  'mailto:support@krishnabodha.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist'))); // Serve Vite build if present

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('[DB] Connected to MongoDB Successfully');
  // Initialize cron jobs only after DB connects
  initCronJobs();
}).catch((err) => console.error('[DB] MongoDB connection error:', err));

// API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/push', pushRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/shloka', shlokaRoutes);
app.use('/api/v1/guidance', guidanceRoutes);
app.use('/api/v1', interactionRoutes);

// Health Check Endpoint (Keep at root /api/ for load balancers)
app.get('/api/health', (req, res) => {
  const gitaData = getGitaData();
  const genAI = getGenAIInstance();
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    ai: {
      gemini: !!genAI,
      groq: !!process.env.GROQ_API_KEY
    },
    totalVerses: gitaData.length
  };
  const statusCode = health.database === 'connected' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Trigger daily broadcast manually (for external cron schedules)
app.all('/api/v1/trigger-daily-broadcast', (req, res) => {
  console.log('[API] Triggering daily morning shloka broadcast manually in the background...');
  
  // Fire and forget so we don't hit Render's 30s-60s HTTP timeout limits
  broadcastDailyShloka().catch(error => {
    console.error('[API] Error during background broadcast:', error);
  });
  
  res.json({ success: true, message: 'Broadcast triggered in the background successfully.' });
});

// Trigger Welcome Broadcast manually (for free tier users without shell)
app.all('/api/v1/trigger-welcome-broadcast', (req, res) => {
  console.log('[API] Triggering welcome broadcast manually in the background...');
  
  // Fire and forget
  triggerWelcome().catch(error => {
    console.error('[API] Error during welcome broadcast:', error);
  });
  
  res.json({ success: true, message: 'Welcome broadcast triggered in the background. Check server logs for completion.' });
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`[Server] Backend running on port ${PORT}`);
});

// Graceful Shutdown
const shutdown = () => {
  console.log('[System] Graceful shutdown initiated...');
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    mongoose.connection.close(false, () => {
      console.log('[DB] MongoDB connection closed.');
      process.exit(0);
    });
  });

  // Force close after 10s
  setTimeout(() => {
    console.error('[System] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app; // For testing
