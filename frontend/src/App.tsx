import { useState, useEffect } from 'react';
import { ShlokaCard } from './components/ShlokaCard';
import type { Shloka } from './components/ShlokaCard';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  Compass, 
  LogOut, 
  User, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  KeyRound,
  Send,
  Bell,
  Info
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gita-daily-backend.onrender.com/api';

type Tab = 'daily' | 'browse' | 'search' | 'bookmarks' | 'guidance' | 'about';
type AuthStep = 'entry' | 'otp' | 'register';
type AuthMode = 'signin' | 'signup';

interface Chapter {
  chapterNumber: number;
  theme: string;
  verses: number[];
}

function App() {
  const [email, setEmail] = useState<string>(() => localStorage.getItem('gitadaily_email') || '');
  const [pref, setPref] = useState<string>(() => localStorage.getItem('gitadaily_pref') || 'email');
  const [lang, setLang] = useState<string>(() => localStorage.getItem('gitadaily_lang') || 'english');
  
  // --- OTP Auth States ---
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [authStep, setAuthStep] = useState<AuthStep>('entry');
  const [authIdentifier, setAuthIdentifier] = useState(''); // email or phone
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // Registration form states (shown after OTP verified for new user)
  const [regEmail, setRegEmail] = useState('');
  const [regPref, setRegPref] = useState('email');
  const [regLang, setRegLang] = useState('english');
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  
  // Seek Guidance States
  const [guidanceQuery, setGuidanceQuery] = useState('');
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState<{
    shloka: Shloka;
    counsel: {
      modernCounsel: string;
      wellbeingInsight: string;
      actionStep: string;
    };
  } | null>(null);
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  
  // Edit Prefs States
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [editPref, setEditPref] = useState(pref);
  const [editLang, setEditLang] = useState(lang);
  // Web Push & Telegram configuration states
  const [telegramBotUsername, setTelegramBotUsername] = useState('GitaDailyBot');
  const [publicVapidKey, setPublicVapidKey] = useState('');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  
  // Update edit states when profile loads
  useEffect(() => {
    setEditPref(pref);
    setEditLang(lang);
  }, [pref, lang]);
  
  // Fetch app configs and check Service Worker push subscription status on startup
  useEffect(() => {
    // 1. Fetch backend configuration
    fetch(`${API_BASE}/config`)
      .then(res => res.json())
      .then(data => {
        if (data.telegramBotUsername) {
          setTelegramBotUsername(data.telegramBotUsername);
        }
      })
      .catch(err => console.error('Failed to fetch config', err));

    // 2. Fetch VAPID Public Key
    fetch(`${API_BASE}/push/public-key`)
      .then(res => res.json())
      .then(data => {
        if (data.publicKey) {
          setPublicVapidKey(data.publicKey);
        }
      })
      .catch(err => console.error('Failed to fetch VAPID key', err));

    // 3. Check push subscription status
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('Service Worker registered successfully');
          return reg.pushManager.getSubscription();
        })
        .then(sub => {
          setIsPushSubscribed(!!sub);
        })
        .catch(err => console.error('Service Worker / Push subscription error', err));
    }
  }, []);
  
  // Loading & Data States
  const [loading, setLoading] = useState(false);
  const [dailyShloka, setDailyShloka] = useState<Shloka | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [bookmarks, setBookmarks] = useState<Shloka[]>([]);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Shloka[]>([]);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  
  const topics = ['duty', 'karma', 'focus', 'anxiety', 'mindfulness', 'soul', 'career', 'wisdom', 'peace', 'devotion'];

  // --- Auth Handlers ---

  // Step 1: Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authIdentifier.trim()) {
      setOtpError('Please enter your email or phone number.');
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: authIdentifier }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthStep('otp');
      } else {
        setOtpError(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setOtpError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length !== 6) {
      setOtpError('Please enter the 6-digit OTP.');
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: authIdentifier, otp: otpInput }),
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        if (!data.isNewUser && data.user) {
          // Existing user - log them in directly
          loginUser(data.user);
        } else {
          // New user - proceed to registration form
          // Pre-fill email from identifier
          if (authIdentifier.includes('@')) setRegEmail(authIdentifier);
          setAuthStep('register');
        }
      } else {
        setOtpError(data.error || 'Invalid or expired OTP.');
      }
    } catch {
      setOtpError('Cannot connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: save user to localStorage and state
  const loginUser = (userData: { email: string; pref: string; lang: string }) => {
    localStorage.setItem('gitadaily_email', userData.email);
    localStorage.setItem('gitadaily_pref', userData.pref || 'email');
    localStorage.setItem('gitadaily_lang', userData.lang || 'english');
    setEmail(userData.email);
    setPref(userData.pref || 'email');
    setLang(userData.lang || 'english');
  };

  // Step 3 (new users only): Complete Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, phone: '', pref: regPref, lang: regLang }),
      });
      const data = await res.json();
      if (res.ok) {
        loginUser(data);
        fetchDailyShloka();
      } else {
        alert(data.error || 'Registration failed');
      }
    } catch {
      alert('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const resetAuth = () => {
    setAuthStep('entry');
    setOtpInput('');
    setOtpError('');
    setAuthIdentifier('');
  };

  const handleLogout = () => {
    localStorage.removeItem('gitadaily_email');
    localStorage.removeItem('gitadaily_pref');
    localStorage.removeItem('gitadaily_lang');
    setEmail('');
    setPref('email');
    setLang('english');
    setDailyShloka(null);
    setBookmarks([]);
    setIsEditingPrefs(false);
    resetAuth();
    setAuthMode('signin');
  };

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: '', pref: editPref, lang: editLang }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gitadaily_pref', data.pref || 'email');
        localStorage.setItem('gitadaily_lang', data.lang || 'english');
        setPref(data.pref || 'email');
        setLang(data.lang || 'english');
        setIsEditingPrefs(false);
        // Refresh daily shloka in new language
        fetchDailyShloka();
        alert('Preferences updated successfully!');
      } else {
        alert(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestDelivery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/test-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          chapter: dailyShloka?.chapter || 2, 
          verse: dailyShloka?.verse || 47 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Test delivery triggered! Check your subscribed channels (Email, Telegram, or Web Push).');
      } else {
        alert(data.error || 'Failed to trigger test delivery.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeekGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guidanceQuery.trim()) return;

    setGuidanceLoading(true);
    setGuidanceError(null);
    setGuidanceResult(null);

    try {
      const res = await fetch(`${API_BASE}/guidance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: guidanceQuery,
          language: lang
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGuidanceResult({
          shloka: data.shloka,
          counsel: data.counsel
        });
      } else {
        setGuidanceError(data.error || 'Failed to receive divine counsel.');
      }
    } catch (err) {
      console.error(err);
      setGuidanceError('Unable to connect to the server.');
    } finally {
      setGuidanceLoading(false);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const handleEnableNotifications = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Your browser does not support web push notifications.');
      return;
    }

    if (!publicVapidKey) {
      alert('VAPID public key not loaded from backend yet. Please wait a second.');
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Permission for notifications was denied.');
        setLoading(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      
      const res = await fetch(`${API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subscription })
      });

      if (res.ok) {
        setIsPushSubscribed(true);
        alert('Browser notifications enabled successfully! 🔔');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save push subscription on server.');
      }
    } catch (err: any) {
      console.error('Error subscribing to push notifications:', err);
      alert('Failed to subscribe: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions
  const fetchDailyShloka = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shloka/daily?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setDailyShloka(data);
      }
    } catch (err) {
      console.error('Failed to fetch daily shloka', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChapters = async () => {
    try {
      const res = await fetch(`${API_BASE}/chapters`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
      }
    } catch (err) {
      console.error('Failed to fetch chapters', err);
    }
  };

  const fetchBookmarks = async () => {
    if (!email) return;
    try {
      const res = await fetch(`${API_BASE}/bookmarks?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks', err);
    }
  };

  const fetchSpecificShloka = async (chapter: number, verse: number) => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shloka/${chapter}/${verse}?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();

        // If we fetch a specific shloka, switch to dashboard tab to show it
        setActiveTab('daily');
        setDailyShloka(data); // Display as the main active shloka
      }
    } catch (err) {
      console.error('Failed to fetch specific shloka', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Search
  const handleSearch = async (queryStr: string) => {
    if (!queryStr.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(queryStr)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Failed search query', err);
    }
  };

  // Toggle bookmark API
  const handleToggleBookmark = async (shloka: Shloka) => {
    const isBookmarked = bookmarks.some(b => b.chapter === shloka.chapter && b.verse === shloka.verse);
    const method = isBookmarked ? 'DELETE' : 'POST';
    
    try {
      const res = await fetch(`${API_BASE}/bookmarks`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, chapter: shloka.chapter, verse: shloka.verse }),
      });
      if (res.ok) {
        fetchBookmarks();
      }
    } catch (err) {
      console.error('Failed to update bookmark', err);
    }
  };

  // Run initial fetches on email state change
  useEffect(() => {
    if (!email) return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      const matchSpecific = hash.match(/#\/chapter\/(\d+)\/verse\/(\d+)/);
      
      if (matchSpecific) {
        const chapter = parseInt(matchSpecific[1]);
        const verse = parseInt(matchSpecific[2]);
        fetchSpecificShloka(chapter, verse);
      } else if (hash === '#/browsechapters') {
        setActiveTab('browse');
        fetchChapters();
      } else if (hash === '#/searchinsights') {
        setActiveTab('search');
      } else if (hash === '#/guidance') {
        setActiveTab('guidance');
      } else if (hash === '#/bookmarks') {
        setActiveTab('bookmarks');
        fetchBookmarks();
      } else if (hash === '#/dailyinsights') {
        setActiveTab('daily');
        fetchDailyShloka();
      } else if (hash === '#/about') {
        setActiveTab('about');
      } else {
        // Default route
        window.location.hash = '#/dailyinsights';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount/email changes

    fetchChapters();
    fetchBookmarks();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [email]);

  // Handle topic click
  const handleTopicClick = (topic: string) => {
    const nextTopic = activeTopic === topic ? null : topic;
    setActiveTopic(nextTopic);
    if (nextTopic) {
      setSearchQuery(nextTopic);
      handleSearch(nextTopic);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  if (!email) {
    return (
      <div className="hero-section" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', margin: 0, borderRadius: 0, border: 'none' }}>
        <span className="hero-subtitle">Sacred Wisdom & AI Reflections</span>
        <h1 className="hero-title" style={{ fontSize: '3rem', fontFamily: 'var(--font-display)' }}>GitaDaily</h1>
        <p className="hero-description" style={{ maxWidth: '650px', lineHeight: '1.6' }}>
          Start your morning with ancient wisdom, or <strong>seek direct counsel for any life problem</strong>. Describe your challenge, and get instant, personalized AI reflections rooted in the eternal truths of the Bhagavad Gita.
        </p>

        <div className="auth-card">
          {/* Sign In / Sign Up Toggle */}
          {authStep === 'entry' && (
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '4px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setOtpError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                  background: authMode === 'signin' ? 'var(--gold-primary)' : 'transparent',
                  color: authMode === 'signin' ? '#0a0b10' : 'var(--text-secondary)',
                }}
              >Sign In</button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setOtpError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                  background: authMode === 'signup' ? 'var(--gold-primary)' : 'transparent',
                  color: authMode === 'signup' ? '#0a0b10' : 'var(--text-secondary)',
                }}
              >Sign Up</button>
            </div>
          )}

          {/* STEP 1: Entry — Enter email */}
          {authStep === 'entry' && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label className="form-label">
                  {authMode === 'signin' ? 'Sign in with your Email' : 'Your Email Address'}
                </label>
                <input
                  id="authIdentifier"
                  type="email"
                  className="input-field"
                  placeholder="email@example.com"
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  required
                />
              </div>

              {otpError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{otpError}</p>}

              <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '0.25rem' }}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <><KeyRound size={16}/> Send OTP</>}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {authStep === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <KeyRound size={32} style={{ color: 'var(--gold-primary)', marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  OTP sent to <strong style={{ color: 'var(--gold-primary)' }}>{authIdentifier}</strong> via Email.
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">Enter 6-digit OTP</label>
                <input
                  id="otpInput"
                  type="text"
                  className="input-field"
                  placeholder="_ _ _ _ _ _"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.4rem', fontWeight: 700 }}
                  required
                />
              </div>

              {otpError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{otpError}</p>}

              <button type="submit" className="primary-btn" disabled={loading} style={{ marginBottom: '0.75rem' }}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : 'Verify OTP'}
              </button>
              <button type="button" className="secondary-btn" onClick={resetAuth} style={{ justifyContent: 'center' }}>
                ← Back
              </button>
            </form>
          )}

          {/* STEP 3: New User Registration (only shown after OTP verified for first time) */}
          {authStep === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>Complete Your Profile</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Identity verified! Set up your preferences.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  id="regEmail"
                  type="email"
                  className="input-field"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Language</label>
                <select id="regLang" className="input-field" value={regLang} onChange={(e) => setRegLang(e.target.value)}>
                  <option value="english">English</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="telugu">Telugu (తెలుగు)</option>
                  <option value="kannada">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Notification Preference</label>
                <select id="regPref" className="input-field" value={regPref} onChange={(e) => setRegPref(e.target.value)}>
                  <option value="email">Email Only</option>
                  <option value="telegram">Telegram Only</option>
                  <option value="push">Web Push Only</option>
                  <option value="both">Both Email & Telegram</option>
                  <option value="all">All Channels (Email, Telegram & Push)</option>
                </select>
              </div>

              {(regPref === 'telegram' || regPref === 'both' || regPref === 'all') && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '-0.25rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  ⚠️ Note: Telegram Bot connection is temporarily unavailable due to service restrictions in India. Please use Email or Web Push instead.
                </p>
              )}

              {(regPref === 'push' || regPref === 'all') && (
                <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', marginTop: '-0.25rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  🔔 Note: To receive push notifications, you'll click "Enable Browser Notifications" on the settings sidebar once logged in.
                </p>
              )}

              <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '0.75rem' }}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : 'Begin Spiritual Journey'}
              </button>
            </form>
          )}
        </div>

        {/* Made with Love Footer on Login page */}
        <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Made with ❤️ by <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none', fontWeight: 500 }}>Sameer Joshi</a>
        </div>
      </div>
    );
  }


  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <a href="#/dailyinsights" onClick={(e) => { e.preventDefault(); window.location.hash = '#/dailyinsights'; }} className="brand">
            <span className="brand-icon">🪔</span>
            <span className="brand-name">GitaDaily</span>
          </a>

          <div className="sidebar-artwork" style={{ borderRadius: '8px', overflow: 'hidden', width: '100%', height: '110px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '-0.75rem', marginBottom: '-0.5rem' }}>
            <img 
              src="/images/chariot.jpg" 
              alt="Gita Sidebar Art" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          
          <ul className="nav-links">
            <li className="nav-item">
              <button 
                onClick={() => { 
                  if (window.location.hash === '#/dailyinsights') {
                    fetchDailyShloka();
                  } else {
                    window.location.hash = '#/dailyinsights'; 
                  }
                }} 
                className={`nav-button ${activeTab === 'daily' ? 'active' : ''}`}
              >
                <Compass size={18} />
                <span>Daily Insight</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { window.location.hash = '#/browsechapters'; }} 
                className={`nav-button ${activeTab === 'browse' ? 'active' : ''}`}
              >
                <BookOpen size={18} />
                <span>Browse Chapters</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { window.location.hash = '#/searchinsights'; }} 
                className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
              >
                <Search size={18} />
                <span>Search Topics</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { window.location.hash = '#/bookmarks'; }} 
                className={`nav-button ${activeTab === 'bookmarks' ? 'active' : ''}`}
              >
                <Bookmark size={18} />
                <span>My Bookmarks</span>
              </button>
            </li>
            <li className="nav-item" style={{ marginTop: '0.4rem' }}>
              <button 
                onClick={() => { window.location.hash = '#/guidance'; }} 
                className={`nav-button ${activeTab === 'guidance' ? 'active' : ''}`}
                style={activeTab === 'guidance' ? {} : {
                  border: '1px dashed rgba(212, 175, 55, 0.4)',
                  background: 'rgba(212, 175, 55, 0.03)',
                  boxShadow: '0 0 10px rgba(212, 175, 55, 0.05)'
                }}
              >
                <Sparkles size={18} style={{ color: 'var(--gold-primary)', filter: 'drop-shadow(0 0 4px var(--gold-glow))' }} />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Seek Guidance</span>
                <span style={{ 
                  fontSize: '0.6rem', 
                  background: 'linear-gradient(135deg, #fbbf24, #d97706)', 
                  color: '#000', 
                  padding: '1px 6px', 
                  borderRadius: '10px', 
                  marginLeft: 'auto', 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>New</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { window.location.hash = '#/about'; }} 
                className={`nav-button ${activeTab === 'about' ? 'active' : ''}`}
              >
                <Info size={18} />
                <span>About Gita Daily</span>
              </button>
            </li>
          </ul>
        </div>

        <div className="user-profile-widget" style={{ gap: isEditingPrefs ? '0.75rem' : '0.5rem' }}>
          {isEditingPrefs ? (
            <form onSubmit={handleSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Edit Preferences
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Language</label>
                <select
                  className="input-field"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  value={editLang}
                  onChange={(e) => setEditLang(e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="telugu">Telugu (తెలుగు)</option>
                  <option value="kannada">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>Notifications</label>
                <select
                  className="input-field"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  value={editPref}
                  onChange={(e) => setEditPref(e.target.value)}
                >
                  <option value="email">Email Only</option>
                  <option value="telegram">Telegram Only</option>
                  <option value="push">Web Push Only</option>
                  <option value="both">Both Email & Telegram</option>
                  <option value="all">All Channels</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
                <button type="submit" className="primary-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', flexGrow: 1 }} disabled={loading}>
                  Save
                </button>
                <button type="button" onClick={() => setIsEditingPrefs(false)} className="secondary-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', flexGrow: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                <User size={14} />
                <span>Subscribed as:</span>
              </div>
              <span className="user-email-text" style={{ fontSize: '0.8rem' }}>{email}</span>
              
              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Language & Preferences:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', textTransform: 'capitalize', fontWeight: '500' }}>
                  {lang} — {pref === 'both' ? 'Email & Telegram' : pref === 'all' ? 'All Channels' : pref === 'push' ? 'Web Push' : pref}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', marginTop: '0.5rem' }}>
                <button 
                  onClick={() => setIsEditingPrefs(true)} 
                  className="secondary-btn" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center' }}
                >
                  Edit Preferences
                </button>

                {/* Telegram Bot Connector */}
                {(pref === 'telegram' || pref === 'both' || pref === 'all') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button 
                      disabled
                      className="primary-btn"
                      style={{ 
                        padding: '0.4rem 0.8rem', 
                        fontSize: '0.8rem', 
                        justifyContent: 'center', 
                        background: 'linear-gradient(135deg, #555, #777)', 
                        color: '#bbb', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.4rem',
                        cursor: 'not-allowed',
                        opacity: 0.7,
                        border: 'none'
                      }}
                    >
                      <Send size={12} />
                      <span>Connect Telegram Bot</span>
                    </button>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: '#ef4444', 
                      textAlign: 'center', 
                      padding: '0.4rem', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      borderRadius: '6px', 
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      lineHeight: '1.2'
                    }}>
                      ⚠️ Telegram Bot (@{telegramBotUsername}) connection is temporarily unavailable as Telegram services and bot creation are currently restricted/banned in India.
                    </div>
                  </div>
                )}

                {/* Web Push Subscription Action */}
                {(pref === 'push' || pref === 'all') && (
                  isPushSubscribed ? (
                    <div style={{ fontSize: '0.75rem', color: '#10B981', textAlign: 'center', padding: '0.3rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      🔔 Browser Push Enabled
                    </div>
                  ) : (
                    <button 
                      onClick={handleEnableNotifications} 
                      className="primary-btn" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000' }}
                      disabled={loading}
                    >
                      <Bell size={12} />
                      <span>Enable Browser Push</span>
                    </button>
                  )
                )}

                <button 
                  onClick={handleSendTestDelivery} 
                  className="primary-btn" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000' }}
                  disabled={loading}
                >
                  <Sparkles size={12} />
                  <span>Test Send Insight</span>
                </button>

                <button onClick={handleLogout} className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}>
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>

              {/* Collapsible Developer Details */}
              <details style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--gold-primary)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  ℹ️ Developer Details
                </summary>
                <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', lineHeight: '1.4', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <strong>Developer:</strong> Sameer Joshi<br />
                  <strong>Stack:</strong> React, Node.js, Express, Gemini 2.5, Telegram Bot, Web Push, Nodemailer<br />
                  <strong>Links:</strong> <a href="https://github.com/SameerJoshi7" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>GitHub</a> | <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>LinkedIn</a>
                </div>
              </details>

              {/* Made with Love Footer */}
              <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Made with ❤️ by <a href="https://github.com/SameerJoshi7" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none', fontWeight: 500 }}>Sameer Joshi</a>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        {activeTab === 'daily' && (
          <div>
            <div className="dashboard-header">
              <h2 className="dashboard-title">Today's Wisdom</h2>
              <span className="dashboard-subtitle">A daily dose of wisdom to ground your mind and actions.</span>
            </div>

            {/* Seek Guidance Promo Banner */}
            <div 
              onClick={() => { window.location.hash = '#/guidance'; }}
              style={{
                cursor: 'pointer',
                background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.08) 0%, rgba(79, 70, 229, 0.03) 100%)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.5rem' }}>🪔</div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gold-secondary)', fontWeight: 600 }}>Facing a specific challenge today?</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Type your problem or mood and let the Gita guide you with customized solutions.</p>
                </div>
              </div>
              <button 
                className="primary-btn" 
                style={{ 
                  padding: '0.3rem 0.75rem', 
                  fontSize: '0.75rem', 
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                  color: '#000', 
                  border: 'none', 
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Seek Solutions
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span style={{ color: 'var(--gold-primary)', fontWeight: 500, letterSpacing: 1 }}>Seeking AI Reflection...</span>
              </div>
            ) : dailyShloka ? (
              <ShlokaCard 
                shloka={dailyShloka} 
                isBookmarked={bookmarks.some(b => b.chapter === dailyShloka.chapter && b.verse === dailyShloka.verse)}
                onToggleBookmark={() => handleToggleBookmark(dailyShloka)}
              />
            ) : (
              <div className="empty-state">
                <p>No Shloka active. Click Daily Insight above to fetch.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'browse' && (
          <div>
            <div className="dashboard-header">
              <h2 className="dashboard-title">Browse Gita Chapters</h2>
              <span className="dashboard-subtitle">Explore the wisdom of the Bhagavad Gita by chapter and verse.</span>
            </div>

            <div className="chapters-grid">
              {chapters.map((ch) => (
                <div key={ch.chapterNumber} className="chapter-card">
                  <span className="chapter-number">Chapter {ch.chapterNumber}</span>
                  <h3 className="chapter-theme">{ch.theme}</h3>
                  <div className="verses-list">
                    {ch.verses.map((verse) => (
                      <button 
                        key={verse} 
                        onClick={() => { window.location.hash = `#/chapter/${ch.chapterNumber}/verse/${verse}`; }}
                        className="verse-tag"
                      >
                        Verse {verse}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <div className="dashboard-header">
              <h2 className="dashboard-title">Search & Explore</h2>
              <span className="dashboard-subtitle">Search by keyword or select a topic below to discover relevant guidance.</span>
            </div>

            <div className="search-container">
              <div className="search-bar-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  className="input-field search-input"
                  placeholder="Search keywords, chapter theme, translation content..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                />
              </div>

              <div className="topic-filters">
                {topics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    className={`topic-pill ${activeTopic === topic ? 'active' : ''}`}
                  >
                    #{topic}
                  </button>
                ))}
              </div>

              <div className="search-results-list">
                {searchResults.map((s, idx) => (
                  <div 
                    key={idx} 
                    className="search-result-row"
                    onClick={() => { window.location.hash = `#/chapter/${s.chapter}/verse/${s.verse}`; }}
                  >
                    <div className="result-info">
                      <span className="result-meta">Chapter {s.chapter}, Verse {s.verse}</span>
                      <p className="result-text">{s.translation}</p>
                    </div>
                    <ArrowRight size={16} className="arrow-right-icon" />
                  </div>
                ))}

                {searchQuery && searchResults.length === 0 && (
                  <div className="empty-state">
                    <span className="empty-icon">🔍</span>
                    <p>No verses match your query. Try searching for "duty", "focus", "mind", or chapter names.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div>
            <div className="dashboard-header">
              <h2 className="dashboard-title">My Bookmarks</h2>
              <span className="dashboard-subtitle">Your saved verses for quick reflection and meditation.</span>
            </div>

            {bookmarks.length > 0 ? (
              <div className="bookmarks-grid">
                {bookmarks.map((s, idx) => (
                  <div 
                    key={idx} 
                    className="bookmark-card"
                    onClick={() => { window.location.hash = `#/chapter/${s.chapter}/verse/${s.verse}`; }}
                  >
                    <div>
                      <div className="bookmark-header">
                        <span className="bookmark-title">Chapter {s.chapter}, Verse {s.verse}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleBookmark(s);
                          }}
                          className="remove-bookmark-btn"
                          title="Remove bookmark"
                        >
                          <Bookmark size={16} fill="currentColor" />
                        </button>
                      </div>
                      <p className="bookmark-body">"{s.translation}"</p>
                    </div>
                    <div className="bookmark-footer">
                      <TrendingUp size={14} />
                      <span>{s.theme}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">🔖</span>
                <p>No bookmarked verses yet. Go to Daily Insight or Browse to bookmark verses that speak to you.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'guidance' && (
          <div>
            <div className="dashboard-header">
              <h2 className="dashboard-title">Seek Divine Guidance</h2>
              <span className="dashboard-subtitle">Describe your challenge, mood, or question, and receive counsel inspired by the Bhagavad Gita.</span>
            </div>

            <div style={{ background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(18, 20, 31, 0.95) 100%)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--card-border)', marginBottom: '2rem' }}>
              <form onSubmit={handleSeekGuidance} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.95rem', color: 'var(--gold-secondary)', marginBottom: '0.5rem' }}>What challenge, doubt, or emotion are you facing today?</label>
                  <textarea
                    className="input-field"
                    style={{ 
                      width: '100%', 
                      minHeight: '120px', 
                      padding: '0.75rem', 
                      fontSize: '0.95rem', 
                      borderRadius: '10px', 
                      background: 'rgba(25, 28, 43, 0.3)', 
                      borderColor: 'var(--card-border)',
                      resize: 'vertical',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-sans)',
                      lineHeight: '1.5'
                    }}
                    placeholder="E.g., I am feeling anxious about my career path, or I am struggling to control my anger..."
                    value={guidanceQuery}
                    onChange={(e) => setGuidanceQuery(e.target.value)}
                    disabled={guidanceLoading}
                  />
                </div>

                <button 
                  type="submit" 
                  className="primary-btn" 
                  disabled={guidanceLoading || !guidanceQuery.trim()} 
                  style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  {guidanceLoading ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                      <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#000' }} />
                      <span>Consulting the Gita...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                      <Sparkles size={16} />
                      <span>Seek Guidance</span>
                    </div>
                  )}
                </button>
              </form>

              {guidanceError && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--error)', fontSize: '0.9rem' }}>
                  ⚠️ {guidanceError}
                </div>
              )}
            </div>

            {guidanceResult && (
              <div className="shloka-card-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
                <div style={{ textAlign: 'center', margin: '1rem 0 2rem 0' }}>
                  <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--gold-primary)', fontWeight: 600 }}>Gita's Solution Found</span>
                  <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>Verse selected for your guidance:</h3>
                </div>

                <div className="shloka-card" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 10px 40px rgba(212, 175, 55, 0.05)' }}>
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: `url(/images/${(guidanceResult.shloka.chapter + guidanceResult.shloka.verse) % 3 === 0 ? 'chariot' : (guidanceResult.shloka.chapter + guidanceResult.shloka.verse) % 3 === 1 ? 'discourse' : 'vishwaroopa'}.jpg)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: 0.1,
                      pointerEvents: 'none',
                      zIndex: 0,
                      borderRadius: '20px',
                      filter: 'blur(1px)'
                    }} 
                  />

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div className="shloka-card-header">
                      <span className="shloka-meta" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Chapter {guidanceResult.shloka.chapter}, Verse {guidanceResult.shloka.verse}</span>
                      <button 
                        onClick={() => handleToggleBookmark(guidanceResult.shloka)} 
                        className={`bookmark-icon-btn ${bookmarks.some(b => b.chapter === guidanceResult.shloka.chapter && b.verse === guidanceResult.shloka.verse) ? 'active' : ''}`}
                        title="Bookmark Shloka"
                      >
                        <Bookmark size={22} fill={bookmarks.some(b => b.chapter === guidanceResult.shloka.chapter && b.verse === guidanceResult.shloka.verse) ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="shloka-sanskrit" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{guidanceResult.shloka.sanskrit}</div>
                    <div className="shloka-transliteration" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{guidanceResult.shloka.transliteration}</div>

                    <div className="shloka-translation-box" style={{ background: 'rgba(25, 28, 43, 0.45)', backdropFilter: 'blur(4px)' }}>
                      <div className="shloka-translation-label">English Translation</div>
                      <p className="shloka-translation" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{guidanceResult.shloka.translation}</p>
                    </div>

                    <div className="ai-section">
                      <div className="ai-header">
                        <Sparkles size={20} style={{ color: 'var(--gold-primary)' }} />
                        <h3 className="ai-header-title" style={{ color: 'var(--gold-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>Divine AI Counsel for your query</h3>
                      </div>

                      <div className="reflection-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="reflection-card" style={{ background: 'rgba(212, 175, 55, 0.04)', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                          <div className="reflection-title" style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>
                            <span>🎯 Personalized Counsel</span>
                          </div>
                          <p className="reflection-text" style={{ color: '#ffffff', fontSize: '1rem', lineHeight: '1.6' }}>"{guidanceResult.counsel.modernCounsel}"</p>
                        </div>

                        <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                            <span>🧘 Mental Peace & Emotional Well-being</span>
                          </div>
                          <p className="reflection-text" style={{ color: '#e5e7eb' }}>{guidanceResult.counsel.wellbeingInsight}</p>
                        </div>
                      </div>

                      <div className="mindfulness-banner" style={{ background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <span className="mindfulness-banner-icon">⚡</span>
                        <div className="mindfulness-content">
                          <span className="mindfulness-title" style={{ color: '#10B981', fontWeight: 600 }}>Your Actionable Step Today</span>
                          <span className="mindfulness-desc" style={{ color: '#ffffff', fontWeight: 500 }}>"{guidanceResult.counsel.actionStep}"</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'about' && (
          <div>
            <div className="dashboard-header">
              <h2 className="dashboard-title">About Gita Daily</h2>
              <span className="dashboard-subtitle">Ancient wisdom contextualized for the modern world.</span>
            </div>

            {/* Philosophy / Intro Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06) 0%, rgba(79, 70, 229, 0.03) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '2rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                width: '40%',
                backgroundImage: 'url(/images/discourse.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.08,
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
                pointerEvents: 'none'
              }} />

              <div style={{ position: 'relative', zIndex: 1, maxWidth: '80%' }}>
                <span style={{ 
                  color: 'var(--gold-primary)', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '2px',
                  display: 'block',
                  marginBottom: '0.5rem'
                }}>The Philosophy of Sadhana</span>
                
                <h3 style={{ 
                  fontFamily: 'var(--font-display)', 
                  fontSize: '1.75rem', 
                  color: 'var(--text-primary)', 
                  margin: '0 0 1rem 0',
                  lineHeight: '1.2'
                }}>Cultivating Daily Discipline & Mental Equanimity</h3>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                  In a fast-paced world filled with continuous digital notifications and workplace pressures, 
                  maintaining mental clarity and emotional focus is harder than ever. <strong>Gita Daily</strong> was built to be 
                  your spiritual anchor, helping you establish a strict, daily habit of morning reflection (<em>Sadhana</em>) 
                  grounded in the eternal guidelines of the Bhagavad Gita.
                </p>
              </div>
            </div>

            {/* Core Pillars Section */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Core Capabilities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              
              {/* Pillar 1 */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', padding: '0.5rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '10px', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🌅
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Daily 6:00 AM Broadcast</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Begin your day with intention. The app broadcasts a daily verse (shloka) along with custom-generated AI reflections targeting modern relevance, career focus, and emotional peace directly to your preferred channels at exactly 6:00 AM.
                </p>
              </div>

              {/* Pillar 2 */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(212, 175, 55, 0.2)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.03)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', padding: '0.5rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '10px', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ✨
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold-primary)', fontWeight: 600 }}>Seek Divine Guidance</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Our flagship feature. Type any struggle, confusion, career query, or emotional challenge. The AI engine parses our sacred database of shlokas to match the perfect verse to your query and delivers customized counseling in your chosen language.
                </p>
              </div>

              {/* Pillar 3 */}
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.5rem', padding: '0.5rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '10px', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🔔
                  </div>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Multi-Channel Dispatch</h4>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Receive guidance where it fits your lifestyle. Subscribe and set preferences to get daily shlokas delivered via email, interactive browser push notifications, or connect to our dedicated channels. Authenticate securely using passwordless email OTPs.
                </p>
              </div>
            </div>

            {/* Architecture / Tech Stack Section */}
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--card-border)',
              borderRadius: '20px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.5rem' }}>Tech Stack & Systems</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                Gita Daily leverages modern web technologies to ensure zero-friction, robust delivery and instant AI computation.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>React 18 & Vite</span>
                <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>TypeScript</span>
                <span style={{ background: 'rgba(212, 175, 55, 0.06)', color: 'var(--gold-primary)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600 }}>Google Gemini AI (gemini-flash-latest)</span>
                <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>Node.js & Express</span>
                <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>EmailJS secure HTTP API</span>
                <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>VAPID Web Push Protocol</span>
              </div>
            </div>

            {/* Quick Action Link Banner */}
            <div style={{
              background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.5rem'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Need help navigating life's challenges right now?</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Ask the Gita for answers regarding stress, career path, relationships, or mindfulness.</p>
              </div>
              <button
                onClick={() => { window.location.hash = '#/guidance'; }}
                className="primary-btn"
                style={{
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#000',
                  fontWeight: 600,
                  border: 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                Seek Guidance Now
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
