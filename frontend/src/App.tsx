import { useState, useEffect } from 'react';
import { ShlokaCard } from './components/ShlokaCard';
import type { Shloka } from './components/ShlokaCard';
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

function App() {
  const [email, setEmail] = useState<string>(() => localStorage.getItem('gitadaily_email') || '');
  const [pref, setPref] = useState<string>(() => localStorage.getItem('gitadaily_pref') || 'email');
  const [lang, setLang] = useState<string>(() => localStorage.getItem('gitadaily_lang') || 'english');
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

  // Helper: save user to localStorage and state
  const loginUser = (userData: { email: string; pref: string; lang: string }) => {
    localStorage.setItem('gitadaily_email', userData.email);
    localStorage.setItem('gitadaily_pref', userData.pref || 'email');
    localStorage.setItem('gitadaily_lang', userData.lang || 'english');
    setEmail(userData.email);
    setPref(userData.pref || 'email');
    setLang(userData.lang || 'english');
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
  const handleGuestSubscribe = async (subEmail: string, subPref: string) => {
    if (!subEmail || !subEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subEmail, phone: '', pref: subPref, lang }),
      });
      const data = await res.json();
      if (res.ok) {
        loginUser(data);
        
        // Sync local storage bookmarks to backend database
        const localBookmarksStr = localStorage.getItem('gitadaily_local_bookmarks') || '[]';
        const localBookmarks: Shloka[] = JSON.parse(localBookmarksStr);
        if (localBookmarks.length > 0) {
          for (const shloka of localBookmarks) {
            try {
              await fetch(`${API_BASE}/bookmarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: data.email, chapter: shloka.chapter, verse: shloka.verse }),
              });
            } catch (syncErr) {
              console.error('Failed to sync bookmark', shloka, syncErr);
            }
          }
          localStorage.removeItem('gitadaily_local_bookmarks');
        }
        
        fetchChapters();
        fetchBookmarks();
        fetchDailyShloka();
        
        showToast(t(data.lang || 'english').sidebar.prefsUpdated);
      } else {
        alert(data.error || 'Subscription failed');
      }
    } catch {
      alert('Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLangChange = (newLang: string) => {
    localStorage.setItem('gitadaily_lang', newLang);
    setLang(newLang);
  };

  // Fetch functions
  const fetchDailyShloka = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shloka/daily?email=${encodeURIComponent(email || '')}&lang=${lang}`);
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
      const res = await fetch(`${API_BASE}/chapters?email=${encodeURIComponent(email || '')}&lang=${lang}`);
      if (res.ok) {
        const data = await res.json();
        setChapters(data);
      }
    } catch (err) {
      console.error('Failed to fetch chapters', err);
    }
  };

  const fetchBookmarks = async () => {
    if (!email) {
      const local = localStorage.getItem('gitadaily_local_bookmarks');
      setBookmarks(local ? JSON.parse(local) : []);
      return;
    }
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
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shloka/${chapter}/${verse}?email=${encodeURIComponent(email || '')}&lang=${lang}`);
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
    if (!email) {
      const localBookmarksStr = localStorage.getItem('gitadaily_local_bookmarks') || '[]';
      let localBookmarks: Shloka[] = JSON.parse(localBookmarksStr);
      const isBookmarked = localBookmarks.some(b => b.chapter === shloka.chapter && b.verse === shloka.verse);
      if (isBookmarked) {
        localBookmarks = localBookmarks.filter(b => !(b.chapter === shloka.chapter && b.verse === shloka.verse));
      } else {
        localBookmarks.push(shloka);
      }
      localStorage.setItem('gitadaily_local_bookmarks', JSON.stringify(localBookmarks));
      setBookmarks(localBookmarks);
      return;
    }

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
  }, [email, lang]);

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
        onChangeLang={handleGuestLangChange}
        onGuestSubscribe={handleGuestSubscribe}
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
            lang={lang}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            email={email}
            apiBase={API_BASE}
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
