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
  Mail,
  MessageCircle
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
  const [phone, setPhone] = useState<string>(() => localStorage.getItem('gitadaily_phone') || '');
  const [pref, setPref] = useState<string>(() => localStorage.getItem('gitadaily_pref') || 'email');
  const [lang, setLang] = useState<string>(() => localStorage.getItem('gitadaily_lang') || 'english');
  
  // --- OTP Auth States ---
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [authStep, setAuthStep] = useState<AuthStep>('entry');
  const [authIdentifier, setAuthIdentifier] = useState(''); // email or phone
  const [authMethod, setAuthMethod] = useState<'email' | 'whatsapp'>('email');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [devOtp, setDevOtp] = useState(''); // shown if no email configured

  // Registration form states (shown after OTP verified for new user)
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPref, setRegPref] = useState('email');
  const [regLang, setRegLang] = useState('english');
  const [activeTab, setActiveTab] = useState<Tab>('daily');
  
  // Edit Prefs States
  const [isEditingPrefs, setIsEditingPrefs] = useState(false);
  const [editPhone, setEditPhone] = useState(phone);
  const [editPref, setEditPref] = useState(pref);
  const [editLang, setEditLang] = useState(lang);
  
  // Update edit states when profile loads
  useEffect(() => {
    setEditPhone(phone);
    setEditPref(pref);
    setEditLang(lang);
  }, [phone, pref, lang]);
  
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
        body: JSON.stringify({ identifier: authIdentifier, method: authMethod }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuthStep('otp');
        if (data.devOtp) {
          setDevOtp(data.devOtp); // Show OTP directly in dev mode
        }
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
          // Pre-fill email/phone from identifier
          if (authIdentifier.includes('@')) setRegEmail(authIdentifier);
          else setRegPhone(authIdentifier);
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
  const loginUser = (userData: { email: string; phone: string; pref: string; lang: string }) => {
    localStorage.setItem('gitadaily_email', userData.email);
    localStorage.setItem('gitadaily_phone', userData.phone || '');
    localStorage.setItem('gitadaily_pref', userData.pref || 'email');
    localStorage.setItem('gitadaily_lang', userData.lang || 'english');
    setEmail(userData.email);
    setPhone(userData.phone || '');
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
    if ((regPref === 'whatsapp' || regPref === 'both') && !regPhone) {
      alert('Please enter your WhatsApp mobile number to select WhatsApp notifications.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail, phone: regPhone, pref: regPref, lang: regLang }),
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
    setDevOtp('');
    setAuthIdentifier('');
  };

  const handleLogout = () => {
    localStorage.removeItem('gitadaily_email');
    localStorage.removeItem('gitadaily_phone');
    localStorage.removeItem('gitadaily_pref');
    localStorage.removeItem('gitadaily_lang');
    setEmail('');
    setPhone('');
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
    if ((editPref === 'whatsapp' || editPref === 'both') && !editPhone) {
      alert('Please enter your WhatsApp mobile number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone: editPhone, pref: editPref, lang: editLang }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gitadaily_phone', data.phone || '');
        localStorage.setItem('gitadaily_pref', data.pref || 'email');
        localStorage.setItem('gitadaily_lang', data.lang || 'english');
        setPhone(data.phone || '');
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

  const handleSendTestWhatsApp = async () => {
    if (!phone) {
      alert('Please subscribe with a WhatsApp phone number first!');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/test-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          chapter: dailyShloka?.chapter || 2, 
          verse: dailyShloka?.verse || 47 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Test WhatsApp message triggered! Open the backend terminal window/logs to view the simulated output.');
      } else {
        alert(data.error || 'Failed to trigger WhatsApp message.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to the server.');
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
    if (email) {
      fetchDailyShloka();
      fetchChapters();
      fetchBookmarks();
    }
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

          {/* STEP 1: Entry — Enter email/phone + choose OTP method */}
          {authStep === 'entry' && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label className="form-label">
                  {authMode === 'signin' ? 'Sign in with your Email or WhatsApp Number' : 'Your Email or WhatsApp Number'}
                </label>
                <input
                  id="authIdentifier"
                  type="text"
                  className="input-field"
                  placeholder="email@example.com or +91XXXXXXXXXX"
                  value={authIdentifier}
                  onChange={(e) => setAuthIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Send OTP via</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('email')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.6rem', borderRadius: '8px', border: `1.5px solid ${authMethod === 'email' ? 'var(--gold-primary)' : 'rgba(255,255,255,0.1)'}`,
                      background: authMethod === 'email' ? 'rgba(250,204,21,0.1)' : 'transparent',
                      color: authMethod === 'email' ? 'var(--gold-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                    }}
                  >
                    <Mail size={14} /> Email
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMethod('whatsapp')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                      padding: '0.6rem', borderRadius: '8px', border: `1.5px solid ${authMethod === 'whatsapp' ? '#25D366' : 'rgba(255,255,255,0.1)'}`,
                      background: authMethod === 'whatsapp' ? 'rgba(37,211,102,0.1)' : 'transparent',
                      color: authMethod === 'whatsapp' ? '#25D366' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem'
                    }}
                  >
                    <MessageCircle size={14} /> WhatsApp
                  </button>
                </div>
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
                  OTP sent to <strong style={{ color: 'var(--gold-primary)' }}>{authIdentifier}</strong> via {authMethod}.
                </p>
                {devOtp && (
                  <p style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(250,204,21,0.1)', borderRadius: '8px', color: 'var(--gold-primary)', fontSize: '0.85rem' }}>
                    📧 Dev Mode OTP: <strong>{devOtp}</strong>
                  </p>
                )}
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
                  <option value="whatsapp">WhatsApp Only</option>
                  <option value="both">Both Email & WhatsApp</option>
                </select>
              </div>

              {(regPref === 'whatsapp' || regPref === 'both') && (
                <div className="form-group">
                  <label className="form-label">WhatsApp Mobile Number</label>
                  <input
                    id="regPhone"
                    type="tel"
                    className="input-field"
                    placeholder="+1234567890 (With country code)"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    required
                  />
                </div>
              )}

              <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '0.75rem' }}>
                {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : 'Begin Spiritual Journey'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }


  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('daily'); }} className="brand">
            <span className="brand-icon">🪔</span>
            <span className="brand-name">GitaDaily</span>
          </a>
          
          <ul className="nav-links">
            <li className="nav-item">
              <button 
                onClick={() => { setActiveTab('daily'); fetchDailyShloka(); }} 
                className={`nav-button ${activeTab === 'daily' ? 'active' : ''}`}
              >
                <Compass size={18} />
                <span>Daily Insight</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { setActiveTab('browse'); fetchChapters(); }} 
                className={`nav-button ${activeTab === 'browse' ? 'active' : ''}`}
              >
                <BookOpen size={18} />
                <span>Browse Chapters</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { setActiveTab('search'); }} 
                className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
              >
                <Search size={18} />
                <span>Search Topics</span>
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => { setActiveTab('bookmarks'); fetchBookmarks(); }} 
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
                  <option value="whatsapp">WhatsApp Only</option>
                  <option value="both">Both</option>
                </select>
              </div>

              {(editPref === 'whatsapp' || editPref === 'both') && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.7rem' }}>WhatsApp Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                  />
                </div>
              )}

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
              
              {phone && (
                <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WhatsApp Phone:</span>
                  <span className="user-email-text" style={{ fontSize: '0.8rem' }}>{phone}</span>
                </div>
              )}

              <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Language & Preferences:</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', textTransform: 'capitalize', fontWeight: '500' }}>
                  {lang} — {pref === 'both' ? 'Email & WhatsApp' : pref}
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

                {phone && (pref === 'whatsapp' || pref === 'both') && (
                  <button 
                    onClick={handleSendTestWhatsApp} 
                    className="primary-btn" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff' }}
                    disabled={loading}
                  >
                    <Sparkles size={12} />
                    <span>Test Send WhatsApp</span>
                  </button>
                )}

                <button onClick={handleLogout} className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}>
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
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
                        onClick={() => fetchSpecificShloka(ch.chapterNumber, verse)}
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
                    onClick={() => fetchSpecificShloka(s.chapter, s.verse)}
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
                    onClick={() => fetchSpecificShloka(s.chapter, s.verse)}
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
