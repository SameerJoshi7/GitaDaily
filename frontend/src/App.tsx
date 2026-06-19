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
  Bell
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gita-daily-backend.onrender.com/api';

type Tab = 'daily' | 'browse' | 'search' | 'bookmarks';
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
      } else if (hash === '#/bookmarks') {
        setActiveTab('bookmarks');
        fetchBookmarks();
      } else if (hash === '#/dailyinsights') {
        setActiveTab('daily');
        fetchDailyShloka();
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
        <p className="hero-description">
          Receive a hand-picked shloka daily with transliteration, translation, and a personalized Gemini AI analysis relating it to emotional resilience, career focus, and modern mindfulness.
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
                      ⚠️ Telegram Bot connection is temporarily unavailable as Telegram services and bot creation are currently restricted/banned in India.
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
      </main>
    </div>
  );
}

export default App;
