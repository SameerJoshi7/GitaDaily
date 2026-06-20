# 🪔 Krishna Bodha — Daily Bhagavad Gita Wisdom & Seek Divine Guidance

> *"Perform your duty equipoised, O Arjuna, abandoning all attachment to success or failure. Such equanimity is called Yoga."* — **Bhagavad Gita (2.48)**

![Vishwaroopa Artwork](https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/vishwaroopa.jpg)

**Krishna Bodha** is a modern, high-polish spiritual companion application designed to cultivate daily discipline, mental clarity, and focus. In a fast-paced world filled with distractions, Krishna Bodha serves as your morning anchor, delivering a daily sacred verse from the Bhagavad Gita alongside advanced AI reflections directly to your inbox and web browser at exactly **6:00 AM local time**.

Our flagship **Seek Divine Guidance** module allows users to type any life challenge, doubt, or emotional state and receive direct, personalized AI counsel matching their query to the perfect shloka from the Gita—proving that the Bhagavad Gita has solutions to every problem, big or small.

---

## ✨ Flagship Feature: Seek Divine Guidance (Reflect by Mood)

The Gita has solutions to every human challenge. The **Seek Guidance** module brings this wisdom to life interactively:

* **Describe Your Situation**: Users type their current struggle, query, or feeling (e.g., *"I feel burnt out at work"* or *"I am struggling to control my anger"*).
* **AI Analysis & Verse Matching**: The server queries the local index of verses and directs **Gemini** to select the single most relevant shloka that answers their query.
* **Personalized Counsel**: Gemini generates a custom-tailored counseling response in the user's selected language (English, Hindi, Telugu, or Kannada), linking the shloka's wisdom to their exact problem.
* **Actionable Step**: Provides a single, clear action step for the user to practice immediately.

---

## 🌅 The Power of Daily Discipline (Sadhana)

Spiritual growth and mental fortitude do not happen by chance; they are forged through consistent, daily discipline (*Sadhana*). Krishna Bodha is designed with a strict disciplinary structure:
* **The 6:00 AM Commitment**: Every morning, before your workday begins, you are greeted with a sacred shloka. This forces a moment of silence, reflection, and setting high intentions before the chaos of the day takes over.
* **No Delays, No Dev Modes**: Authentication is secured through real email OTP delivery. Access is earned through presence, ensuring your spiritual dashboard is a focused sanctuary.
* **Modern Integration**: The teachings are not kept abstract. Our AI model contextualizes the shlokas specifically for modern-day work pressures, emotional health, and focused action, turning ancient wisdom into a daily system of rules for life.

---

## 🎵 Immersive Experience: Meditative Flute & Deep Routing

Krishna Bodha is designed to be an immersive, peaceful sanctuary:

* **Divine Bansuri Player**: Features a floating glassmorphic player capsule at the bottom-right corner of the screen playing whisper-soft classical bansuri (flute) melodies at a gentle 2% volume. Users can easily toggle playback, mute, and switch between multiple tracks:
  * *Playful Krishna* (Carnatic flute by Dr. N. Ramani) — celebrating Lord Krishna's playful Vrindavan pastimes.
  * *Vrindavan Meditations* (Hinstustani classical bansuri by Pt. Hariprasad Chaurasia) — a live recital captured at the Ramakrishna Mission.
* **Bypassing Autoplay Blockers**: Automatically starts playing upon the user's first click, keypress, or touch on the screen, adhering to modern browser security policies while feeling seamless. State preferences are persisted locally.
* **Deep-Link Shloka Routing**: URL hashes update dynamically as you browse (e.g. `#/browse/chapter/2/verse/8`). Deep-linking or reloading the page directly opens the selected verse in the Browse Chapters tab, allowing easy sharing of specific shlokas.

---

## 🛠️ System Architecture & Data Flow

Krishna Bodha operates on a secure, serverless-ready multi-channel architecture:

```mermaid
graph TD
    User[User Signup / Login] -->|HTTP POST| Server[Node.js Express Server]
    Server -->|Generate OTP| EmailJS[EmailJS HTTP API]
    EmailJS -->|Send HTML Email| Inbox[User Inbox]
    
    Cron[6:00 AM Cron Schedule] -->|Broadcast Event| Broadcast[Daily Shloka Dispatch]
    Broadcast -->|Read Verse| DB[(gita_data.json)]
    Broadcast -->|Contextual Prompt| Gemini[Gemini AI Engine]
    Gemini -->|Generate Reflections| Broadcast
    
    Broadcast -->|HTTP API| EmailJS_Broadcast[EmailJS HTTP API] -->|Daily Shloka Email| Inbox
    Broadcast -->|WebPush Protocol| Vercel_Push[Web Push Service Worker] -->|Browser Notification| Browser[Web Browser Toast]

    %% Seek Guidance Flow
    UserGuidance[User Seek Guidance Query] -->|HTTP POST /api/guidance| Server
    Server -->|Contextual Query + Shloka List| Gemini
    Gemini -->|Pick Shloka & Generate Counsel| Server
    Server -->|Render Customized Counsel Card| UserGuidance
```

1. **User Authentication**: Secure, passwordless entry using EmailJS HTTP API to dispatch OTPs over TLS, preventing any SMTP port blocks on hosting environments like Render's free tier.
2. **AI Guidance Engine**: Uses the high-performance `gemini-flash-latest` model to analyze user queries, match them to the most relevant verse in `gita_data.json`, and write contextual guidance.
3. **Multi-Channel Dispatcher**: Simultaneously broadcasts the daily verse, transliteration, and AI reflections to all active channels.

---

## 📸 Sacred Visuals

The application pairs every daily verse with high-quality, inspiring devotional artwork reflecting core moments from the Mahabharata:

| Chariot & Discourse | Vishwaroopa |
| :---: | :---: |
| ![Chariot](https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/chariot.jpg) | ![Vishwaroopa](https://raw.githubusercontent.com/SameerJoshi7/GitaDaily/main/frontend/public/images/vishwaroopa.jpg) |
| *Guidance on the battlefield of duty.* | *The grand revelation of the cosmic order.* |

---

## 💻 Tech Stack

* **Frontend**: React, TypeScript, Vite, Vanilla CSS (harmonious dark mode, glassmorphic cards, micro-animations, and background watermarks).
* **Backend**: Node.js, Express.js.
* **Email Delivery**: EmailJS API (HTTP port 443).
* **AI Reflections**: Google Gemini AI (`gemini-flash-latest`).
* **Web Push**: VAPID & Web Push Protocol Service Workers.
* **Telegram Service**: Node Telegram Polling (Dynamic status notice blocks when restricted).

---

## ⚙️ Local Configuration & Deployment

### 1. Environment Variables (`/backend/.env`)
Create a `.env` file in the backend directory containing:
```env
PORT=5005
GEMINI_API_KEY=your_gemini_api_key

# Web Push Keys
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key

# EmailJS Configuration (Bypasses Render SMTP port blocking)
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_PRIVATE_KEY=your_private_key_access_token
EMAILJS_OTP_TEMPLATE_ID=your_otp_template_id
EMAILJS_SHLOKA_TEMPLATE_ID=your_shloka_template_id
```

### 2. Run the Application Locally
Launch both servers simultaneously:

**Backend**:
```bash
cd backend
npm install
npm run dev
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

### 3. Production Deployment Notes
* **Frontend**: Deployed on **Vercel** with the `VITE_API_BASE_URL` env variable pointing to your backend `/api` endpoint.
* **Backend**: Deployed on **Render** (Free Tier).
* **Daily Cron Wakeup**: Set up a free daily cron rule on **[Cron-Job.org](https://cron-job.org)** targeting `https://your-backend.onrender.com/api/trigger-daily-broadcast` at **6:00 AM** to wake up the Render instance and execute the broadcast.

---

> *"Arise, O Arjuna! Conquer your mind, align your action with duty, and establish your daily discipline."* 🪔
