# GitaDaily Deployment Guide

This document explains how to deploy the full-stack **GitaDaily** application to production hosting platforms for free.

---

## 1. Deploying the Backend (Node.js + Express)
You can deploy the backend to platforms like **Render**, **Railway**, or **Zeabur**.

### Option A: Render (Free & Recommended)
1. Sign up on [Render.com](https://render.com/).
2. Click **New +** ➜ **Web Service**.
3. Connect your GitHub repository containing the backend code.
4. Set the following details:
   * **Root Directory**: `GitaDaily/backend`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
5. Click **Advanced** to add **Environment Variables**:
   * `PORT`: `5005` (or default Render port)
   * `GEMINI_API_KEY`: `your_gemini_api_key`
   * `TWILIO_ACCOUNT_SID`: `your_twilio_sid`
   * `TWILIO_AUTH_TOKEN`: `your_twilio_auth_token`
   * `TWILIO_WHATSAPP_NUMBER`: `whatsapp:+14155238886`
6. Click **Create Web Service**. Render will provision a free URL (e.g. `https://gitadaily-backend.onrender.com`).

---

## 2. Deploying the Frontend (React + Vite)
You can deploy the frontend to **Vercel** or **Netlify** for free.

### Option A: Vercel (Free & Fastest)
1. In your frontend directory `GitaDaily/frontend`, update [App.tsx](file:///C:/Users/samee/.gemini/antigravity-ide/scratch/GitaDaily/frontend/src/App.tsx):
   Change `const API_BASE = 'http://localhost:5005/api';` to point to your live Render backend URL:
   ```typescript
   const API_BASE = 'https://gitadaily-backend.onrender.com/api';
   ```
2. Install the Vercel CLI or link your repository directly on [Vercel.com](https://vercel.com).
3. Connect your repository and configure the project details:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `GitaDaily/frontend`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Click **Deploy**. Vercel will output a fast, SSL-secured production URL (e.g., `https://gitadaily.vercel.app`).

---

## 3. Database Persistence Note
Since this is a lightweight app, it uses local files (`backend/data/users.json`, `backend/data/bookmarks.json`) to store users.
* **On Render**: Render's free tier has an ephemeral disk (files are deleted when the service restarts). 
* **Solution**: To persist user data permanently in production, you can upgrade Render to use a **Persistent Disk** (under service settings) mounted at `GitaDaily/backend/data`, or swap the JSON helpers in `server.js` to connect to a free PostgreSQL database (Render provides free databases).
