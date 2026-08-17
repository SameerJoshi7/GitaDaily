# 🦚 Krishna Bodha — Daily Bhagavad Gita Wisdom

> *"Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure. Such equanimity is called Yoga."* — **Bhagavad Gita (2.48)**

![Vishwaroopa Artwork](https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/vishwaroopa.jpg)

**Krishna Bodha** is a modern, full-stack spiritual companion application designed to cultivate daily discipline, mental clarity, and focus. It serves as your morning anchor, delivering a daily sacred verse from the Bhagavad Gita alongside advanced AI reflections directly to your inbox and browser.

🌐 **Live Production App:** [www.krishnabodha.in](https://www.krishnabodha.in)

---

## ✨ What We Have Built (Current Features)

We have successfully engineered and deployed a highly polished, production-ready application that brings ancient wisdom to modern life:

### 1. 🤖 Flagship AI Guidance (Gemini & Groq)
- **Describe Your Situation**: Users type their current struggle, query, or feeling (e.g., *"I feel burnt out at work"*).
- **Intelligent Verse Matching**: The server queries the local index of verses and directs our dual-AI engine (**Google Gemini** & **Groq**) to select the single most relevant shloka that answers the query.
- **Personalized Counsel**: The AI generates a custom-tailored counseling response, linking the shloka's wisdom to the user's exact problem, alongside an actionable step.

### 2. 🌅 The Power of Daily Discipline (Sadhana)
- **6:00 AM Broadcast**: Every morning at exactly 6:00 AM local time, users receive a curated sacred shloka.
- **Modern Integration**: Our AI contextualizes the shlokas specifically for modern-day work pressures, emotional health, and focused action.
- **Automated Delivery**: Powered by secure VAPID Web Push Protocol Service Workers and EmailJS API integrations triggered by automated cron jobs.

### 3. 🎨 Premium UI & Cross-Platform Sharing
- **Immersive Design**: Built with React, TypeScript, and Vite featuring glassmorphism, smooth animations, and a built-in classical bansuri (flute) audio player for a deeply immersive experience.
- **Bulletproof Sharing Engine**: Bypasses mobile Safari CORS limitations using a hybrid React DOM + `html2canvas` pipeline with Base64 asset pre-fetching to generate flawless, high-resolution shareable images of the daily shloka.

### 4. ⚡ Secure & Scalable Architecture
- **Hybrid Database**: Immutable Bhagavad Gita verses are stored locally (`gita_data.json`) for zero-latency retrieval, while dynamic user state (profiles, bookmarks) is securely managed in **MongoDB Atlas**.
- **Passwordless Auth**: OTP-based user authentication ensuring a frictionless onboarding experience.

---

## 🚀 Roadmap (What is Yet to be Done)

While the core platform is fully live and functional, Krishna Bodha is an evolving project. Here are the upcoming milestones we are actively working towards:

- [ ] **User Streaks & Progress Tracking:** Introduce gamification to encourage daily reading consistency, tracking how many consecutive days users log in at 6 AM.
- [ ] **Advanced PWA (Progressive Web App) Support:** Enhance offline capabilities so users can access their saved verses and previous AI counseling sessions without an internet connection.
- [ ] **Multilingual Audio Synthesizer:** Provide high-quality TTS (Text-to-Speech) to chant the Sanskrit shlokas and read the AI guidance out loud in regional languages.
- [ ] **Migration to Dedicated Email Service:** Transition from the EmailJS API to a more scalable enterprise email service (like AWS SES or SendGrid) to handle increased broadcast volumes.
- [ ] **Native Mobile Application:** Wrap the web experience into a native React Native application for iOS and Android for deeper OS integration and native push notifications.

---

## 💻 Tech Stack

* **Frontend**: React, TypeScript, Vite, Vanilla CSS (Glassmorphism).
* **Backend**: Node.js, Express.js.
* **Database**: MongoDB Atlas (Mongoose ODM) + Local JSON Caching.
* **AI Engine**: Google Gemini AI & Groq AI.
* **Canvas Export**: `html2canvas`.
* **Notifications**: VAPID Web Push & EmailJS.
* **Hosting**: Vercel (Frontend), Render (Backend).

---

## ⚙️ Local Configuration

To run Krishna Bodha locally, create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Web Push Keys
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# EmailJS Configuration
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key
```

Launch both servers:
```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

---

> *"Arise, O Arjuna! Conquer your mind, align your action with duty, and establish your daily discipline."* 🦚
