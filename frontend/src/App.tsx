import { useState, useEffect } from 'react';
import { ShlokaCard } from './components/ShlokaCard';
import type { Shloka } from './components/ShlokaCard';
import { KeyRound } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { AboutTab } from './components/AboutTab';
import { GuidanceTab } from './components/GuidanceTab';
import { SearchTab } from './components/SearchTab';
import { BrowseTab } from './components/BrowseTab';
import type { Chapter } from './components/BrowseTab';
import { BookmarksTab } from './components/BookmarksTab';
import { t } from './i18n';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gita-daily-backend.onrender.com/api';

type Tab = 'daily' | 'browse' | 'search' | 'bookmarks' | 'guidance' | 'about';
type AuthStep = 'entry' | 'otp' | 'register';
type AuthMode = 'signin' | 'signup';

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
  // In-app toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };
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
        // Show translated success toast (uses the NEW lang the user just selected)
        showToast(t(data.lang || 'english').sidebar.prefsUpdated);
      } else {
        showToast(data.error || 'Failed to update preferences');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to connect to the server.');
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
    // On the landing page, use the reg language selection if in register step,
    // otherwise fall back to English (user hasn't logged in yet).
    const authLang = authStep === 'register' ? regLang : 'english';
    const TA = t(authLang);
    return (
      <div className="hero-section" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', margin: 0, borderRadius: 0, border: 'none' }}>
        <span className="hero-subtitle">{TA.auth.heroSubtitle}</span>
        <h1 className="hero-title" style={{ fontSize: '3rem', fontFamily: 'var(--font-display)' }}>GitaDaily</h1>
        <p className="hero-description" style={{ maxWidth: '650px', lineHeight: '1.6' }}>
          {TA.auth.heroDescription}
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
              >{TA.auth.signIn}</button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setOtpError(''); }}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                  background: authMode === 'signup' ? 'var(--gold-primary)' : 'transparent',
                  color: authMode === 'signup' ? '#0a0b10' : 'var(--text-secondary)',
                }}
              >{TA.auth.signUp}</button>
            </div>
          )}

          {/* STEP 1: Entry — Enter email */}
          {authStep === 'entry' && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label className="form-label">
                  {authMode === 'signin' ? TA.auth.signInEmailLabel : TA.auth.emailLabel}
                </label>
                <input
                  id="authIdentifier"
                  type="email"
                  className="input-field"
                  placeholder={TA.auth.emailPlaceholder}
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  required
                />
              </div>

              {otpError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{otpError}</p>}

              <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '0.25rem' }}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <><KeyRound size={16}/> {TA.auth.sendOtp}</>}
              </button>
            </form>
          )}

          {/* STEP 2: OTP Verification */}
          {authStep === 'otp' && (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <KeyRound size={32} style={{ color: 'var(--gold-primary)', marginBottom: '0.5rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {TA.auth.otpSentTo} <strong style={{ color: 'var(--gold-primary)' }}>{authIdentifier}</strong>
                </p>
              </div>
              <div className="form-group">
                <label className="form-label">{TA.auth.enterOtp}</label>
                <input
                  id="otpInput"
                  type="text"
                  className="input-field"
                  placeholder={TA.auth.otpPlaceholder}
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.4rem', fontWeight: 700 }}
                  required
                />
              </div>

              {otpError && <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{otpError}</p>}

              <button type="submit" className="primary-btn" disabled={loading} style={{ marginBottom: '0.75rem' }}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : TA.auth.verifyOtp}
              </button>
              <button type="button" className="secondary-btn" onClick={resetAuth} style={{ justifyContent: 'center' }}>
                {TA.auth.back}
              </button>
            </form>
          )}

          {/* STEP 3: New User Registration (only shown after OTP verified for first time) */}
          {authStep === 'register' && (
            <form onSubmit={handleRegister}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ color: 'var(--gold-primary)', margin: 0 }}>{TA.auth.completeProfile}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>{TA.auth.identityVerified}</p>
              </div>

              <div className="form-group">
                <label className="form-label">{TA.auth.emailAddress}</label>
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
                <label className="form-label">{TA.auth.preferredLanguage}</label>
                <select id="regLang" className="input-field" value={regLang} onChange={(e) => setRegLang(e.target.value)}>
                  <option value="english">English</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="telugu">Telugu (తెలుగు)</option>
                  <option value="kannada">Kannada (ಕನ್ನಡ)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{TA.auth.notificationPref}</label>
                <select id="regPref" className="input-field" value={regPref} onChange={(e) => setRegPref(e.target.value)}>
                  <option value="email">{TA.auth.emailOnly}</option>
                  <option value="telegram">{TA.auth.telegramOnly}</option>
                  <option value="push">{TA.auth.webPushOnly}</option>
                  <option value="both">{TA.auth.bothEmailTelegram}</option>
                  <option value="all">{TA.auth.allChannels}</option>
                </select>
              </div>

              {(regPref === 'telegram' || regPref === 'both' || regPref === 'all') && (
                <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '-0.25rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  {TA.auth.telegramWarning}
                </p>
              )}

              {(regPref === 'push' || regPref === 'all') && (
                <p style={{ fontSize: '0.75rem', color: 'var(--gold-primary)', marginTop: '-0.25rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  {TA.auth.pushNote}
                </p>
              )}

              <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '0.75rem' }}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : TA.auth.beginJourney}
              </button>
            </form>
          )}
        </div>

        {/* Made with Love Footer on Login page */}
        <div style={{ marginTop: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {TA.auth.madeWith} <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none', fontWeight: 500 }}>Sameer Joshi</a>
        </div>
      </div>
    );
  }


  const T = t(lang);
  return (
    <div className="app-container">
      {/* Global In-App Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '1.5rem',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(18,20,31,0.98), rgba(30,33,52,0.98))',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          borderRadius: '12px',
          padding: '0.75rem 1.5rem',
          color: 'var(--text-primary)',
          fontSize: '0.9rem',
          fontWeight: 500,
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.3s ease-out',
          backdropFilter: 'blur(12px)',
          maxWidth: '90vw',
          textAlign: 'center',
        }}>
          {toast}
        </div>
      )}
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        email={email}
        lang={lang}
        pref={pref}
        isEditingPrefs={isEditingPrefs}
        setIsEditingPrefs={setIsEditingPrefs}
        editLang={editLang}
        setEditLang={setEditLang}
        editPref={editPref}
        setEditPref={setEditPref}
        loading={loading}
        isPushSubscribed={isPushSubscribed}
        telegramBotUsername={telegramBotUsername}
        onSavePrefs={handleSavePrefs}
        onEnableNotifications={handleEnableNotifications}
        onSendTestDelivery={handleSendTestDelivery}
        onLogout={handleLogout}
        onRefreshDaily={fetchDailyShloka}
      />

      {/* Main Panel */}
      <main className="main-content">
        {activeTab === 'daily' && (
          <div>
            <div className="dashboard-header">
              <h2 className="dashboard-title">{T.daily.pageTitle}</h2>
              <span className="dashboard-subtitle">{T.daily.pageSubtitle}</span>
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
                  <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gold-secondary)', fontWeight: 600 }}>{T.daily.challengeBannerTitle}</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{T.daily.challengeBannerDesc}</p>
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
                {T.daily.seekSolutions}
              </button>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner" />
                <span style={{ color: 'var(--gold-primary)', fontWeight: 500, letterSpacing: 1 }}>{T.daily.loadingReflection}</span>
              </div>
            ) : dailyShloka ? (
              <ShlokaCard
                shloka={dailyShloka}
                isBookmarked={bookmarks.some(b => b.chapter === dailyShloka.chapter && b.verse === dailyShloka.verse)}
                onToggleBookmark={() => handleToggleBookmark(dailyShloka)}
                lang={lang}
              />
            ) : (
              <div className="empty-state">
                <p>{T.daily.noShloka}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'browse' && (
          <BrowseTab
            chapters={chapters}
            onVerseSelect={(chapterNumber, verse) => {
              window.location.hash = `#/chapter/${chapterNumber}/verse/${verse}`;
            }}
            lang={lang}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            activeTopic={activeTopic}
            topics={topics}
            onTopicClick={handleTopicClick}
            onSearchSubmit={handleSearch}
            onVerseSelect={(chapter, verse) => {
              window.location.hash = `#/chapter/${chapter}/verse/${verse}`;
            }}
            lang={lang}
          />
        )}

        {activeTab === 'bookmarks' && (
          <BookmarksTab
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            onBookmarkSelect={(chapter, verse) => {
              window.location.hash = `#/chapter/${chapter}/verse/${verse}`;
            }}
            lang={lang}
          />
        )}

        {activeTab === 'guidance' && (
          <GuidanceTab
            guidanceQuery={guidanceQuery}
            setGuidanceQuery={setGuidanceQuery}
            guidanceLoading={guidanceLoading}
            guidanceResult={guidanceResult}
            guidanceError={guidanceError}
            onSubmit={handleSeekGuidance}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            lang={lang}
          />
        )}
        
        {activeTab === 'about' && (
          <AboutTab
            onSeekGuidanceClick={() => {
              window.location.hash = '#/guidance';
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
