import { useState, useEffect } from 'react';
import type { Shloka } from '../components/ShlokaCard';
import type { Chapter } from '../components/BrowseTab';
import { t } from '../i18n';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gita-daily-backend.onrender.com/api';

export type Tab = 'daily' | 'browse' | 'search' | 'bookmarks' | 'guidance' | 'about' | 'shloka-detail';

export function useApp() {
  const [email, setEmail] = useState<string>(() => localStorage.getItem('gitadaily_email') || '');
  const [userId, setUserId] = useState<string>(() => localStorage.getItem('gitadaily_userId') || '');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('gitadaily_name') || '');
  const [pref, setPref] = useState<string>(() => localStorage.getItem('gitadaily_pref') || 'email');
  const [lang, setLang] = useState<string>(() => localStorage.getItem('gitadaily_lang') || 'english');
  const [activeTab, setActiveTab] = useState<Tab>('guidance');
  const [browseChapterNumber, setBrowseChapterNumber] = useState<number | null>(null);
  const [browseVerseNumber, setBrowseVerseNumber] = useState<number | null>(null);
  const [readingHistory, setReadingHistory] = useState<{ chapter: number, verse: number } | null>(null);
  
  // Seek Guidance States
  const [guidanceQuery, setGuidanceQuery] = useState(() => sessionStorage.getItem('gitadaily_guidanceQuery') || '');
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState<{
    shloka: Shloka;
    counsel: {
      modernCounsel: string;
      wellbeingInsight: string;
      actionStep: string;
    };
  } | null>(() => {
    const saved = sessionStorage.getItem('gitadaily_guidanceResult');
    return saved ? JSON.parse(saved) : null;
  });
  const [guidanceError, setGuidanceError] = useState<string | null>(null);
  const [guidanceRetryTimer, setGuidanceRetryTimer] = useState(0);

  useEffect(() => {
    sessionStorage.setItem('gitadaily_guidanceQuery', guidanceQuery);
  }, [guidanceQuery]);

  useEffect(() => {
    if (guidanceResult) {
      sessionStorage.setItem('gitadaily_guidanceResult', JSON.stringify(guidanceResult));
    } else {
      sessionStorage.removeItem('gitadaily_guidanceResult');
    }
  }, [guidanceResult]);

  useEffect(() => {
    let interval: number;
    if (guidanceRetryTimer > 0) {
      interval = setInterval(() => {
        setGuidanceRetryTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [guidanceRetryTimer]);
  
  // Edit Prefs States
  const [editPref, setEditPref] = useState(pref);
  const [editLang, setEditLang] = useState(lang);
  const [editName, setEditName] = useState(userName);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);

  // Keep editName in sync if userName loads asynchronously
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditName(userName);
  }, [userName]);
  // In-app toast notification
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };
  // Web Push configuration states
  const [publicVapidKey, setPublicVapidKey] = useState('');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  
  // editPref and editLang are initialised directly from pref/lang useState above.
  // They are kept in sync via the PreferencesModal's own reset logic on open.
  
  // Fetch app configs and check Service Worker push subscription status on startup
  useEffect(() => {
    // 1. Fetch backend configuration (unused now but kept for future structure)
    fetch(`${API_BASE}/config`)
      .then(res => res.json())
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
  const [specificShloka, setSpecificShloka] = useState<Shloka | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const [bookmarks, setBookmarks] = useState<Shloka[]>([]);
  
  // Search States
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('gitadaily_searchQuery') || '');
  const [searchResults, setSearchResults] = useState<Shloka[]>(() => {
    const saved = sessionStorage.getItem('gitadaily_searchResults');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRetryTimer, setSearchRetryTimer] = useState(0);

  useEffect(() => {
    sessionStorage.setItem('gitadaily_searchQuery', searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    sessionStorage.setItem('gitadaily_searchResults', JSON.stringify(searchResults));
  }, [searchResults]);

  useEffect(() => {
    let interval: number;
    if (searchRetryTimer > 0) {
      interval = setInterval(() => {
        setSearchRetryTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [searchRetryTimer]);
  
  const topics = ['duty', 'karma', 'focus', 'anxiety', 'mindfulness', 'soul', 'career', 'wisdom', 'peace', 'devotion'];

  // Helper: save user to localStorage and state
  const loginUser = (userData: { email: string; pref: string; lang: string; name?: string; _id?: string }) => {
    localStorage.setItem('gitadaily_email', userData.email);
    if (userData._id) localStorage.setItem('gitadaily_userId', userData._id);
    localStorage.setItem('gitadaily_pref', userData.pref || 'email');
    localStorage.setItem('gitadaily_lang', userData.lang || 'english');
    if (userData.name) {
      localStorage.setItem('gitadaily_name', userData.name);
      setUserName(userData.name);
    }
    setEmail(userData.email);
    if (userData._id) setUserId(userData._id);
    setPref(userData.pref || 'email');
    setLang(userData.lang || 'english');
  };

  const handleLogout = () => {
    localStorage.removeItem('gitadaily_email');
    localStorage.removeItem('gitadaily_userId');
    localStorage.removeItem('gitadaily_pref');
    localStorage.removeItem('gitadaily_name');
    // We intentionally DO NOT remove 'gitadaily_lang' so language persists post-logout
    setEmail('');
    setUserId('');
    setUserName('');
    setPref('email');
    // We intentionally DO NOT reset lang to 'english'
    setDailyShloka(null);
    setBookmarks([]);
    setReadingHistory(null);
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/user/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        handleLogout();
        showToast('Account completely deleted.');
      } else {
        showToast('Failed to delete account.');
      }
    } catch (err) {
      console.error(err);
      showToast('Connection error.');
    }
  };

  const handleSavePrefs = async (e?: React.FormEvent, overrideName?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const payloadName = overrideName !== undefined ? overrideName : editName;
      const res = await fetch(`${API_BASE}/user/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pref: editPref, lang: editLang, name: payloadName }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gitadaily_pref', data.pref || 'email');
        localStorage.setItem('gitadaily_lang', data.lang || 'english');
        if (data.name !== undefined) {
          localStorage.setItem('gitadaily_name', data.name);
          setUserName(data.name);
        }
        setPref(data.pref || 'email');
        setLang(data.lang || 'english');
        // Refresh daily shloka in new language
        fetchDailyShloka();
        // Show translated success toast (uses the NEW lang the user just selected)
        showToast(t(data.lang || 'english').sidebar.prefsUpdated);
        // Automatically reload window to re-initialize localized translations and endpoints
        setTimeout(() => {
          window.location.reload();
        }, 1200);
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
          userId, 
          chapter: dailyShloka?.chapter || 2, 
          verse: dailyShloka?.verse || 47 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Test delivery triggered! Check your subscribed channels (Email or Web Push).');
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
          userId,
          query: guidanceQuery,
          language: lang,
          userName: userName
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGuidanceResult({
          shloka: data.shloka,
          counsel: data.counsel
        });
        
        // Silently update guidance tracking
        fetch(`${API_BASE}/user/guidance-ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        }).catch(() => {});
        
      } else if (res.status === 429) {
        setGuidanceRetryTimer(data.retryAfter || 30);
        setGuidanceError(data.error);
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

    // CRITICAL FIX FOR iOS: Request permission IMMEDIATELY before any state updates
    // If we call setLoading(true) first, the async delay breaks the "user gesture" requirement on Safari.
    let permission;
    try {
      permission = await Notification.requestPermission();
    } catch (e) {
      console.error(e);
      permission = Notification.permission;
    }
    
    if (permission !== 'granted') {
      alert('Permission for notifications was denied.');
      return;
    }

    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      };

      const subscription = await registration.pushManager.subscribe(subscribeOptions);
      
      const res = await fetch(`${API_BASE}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscription })
      });

      if (res.ok) {
        setIsPushSubscribed(true);
        alert('Browser notifications enabled successfully! 🔔');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save push subscription on server.');
      }
    } catch (err: unknown) {
      console.error('Error subscribing to push notifications:', err);
      alert('Failed to subscribe: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Fetch functions
  const handleSendOtp = async (emailToAuth: string): Promise<{ success: boolean; error?: string; status?: number }> => {
    try {
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailToAuth })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send OTP', status: res.status };
      }
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send OTP' };
    }
  };

  const handleVerifyOtp = async (emailToAuth: string, otp: string) => {
    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: emailToAuth, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP');
      
      if (!data.isNewUser && data.user) {
        // Log them in!
        loginUser(data.user);
        fetchChapters();
        fetchBookmarks();
        fetchDailyShloka();
        showToast(t(data.user.lang || 'english').sidebar.prefsUpdated || 'Logged in successfully');
        return { success: true };
      } else {
        // Technically this shouldn't happen if we're only letting returning users login, but just in case
        return { success: false, error: 'User not found. Please subscribe as a new user.' };
      }
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Invalid OTP' };
    }
  };

  const handleGuestSubscribe = async (subEmail: string, subPref: string): Promise<{ success: boolean; error?: string; status?: number }> => {
    if (!subEmail || !subEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return { success: false, error: 'Invalid email' };
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
                body: JSON.stringify({ userId: data._id, chapter: shloka.chapter, verse: shloka.verse }),
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
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Subscription failed', status: res.status };
      }
    } catch {
      return { success: false, error: 'Could not connect to the server.' };
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLangChange = async (newLang: string) => {
    localStorage.setItem('gitadaily_lang', newLang);
    setLang(newLang);
    
    // If user is logged in, sync language choice to the backend immediately
    if (email) {
      try {
        await fetch(`${API_BASE}/user/preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, lang: newLang }),
        });
      } catch (err) {
        console.error('Failed to sync language', err);
      }
    }
    
    window.location.reload();
  };

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
    if (!userId) {
      const local = localStorage.getItem('gitadaily_local_bookmarks');
      setBookmarks(local ? JSON.parse(local) : []);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/bookmarks?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setBookmarks(data);
      }
    } catch (err) {
      console.error('Failed to fetch bookmarks', err);
    }
  };

  const fetchReadingHistory = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/history?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.lastReadChapter) {
          setReadingHistory({ chapter: data.lastReadChapter, verse: data.lastReadVerse });
        }
      }
    } catch (err) {
      console.error('Failed to fetch reading history', err);
    }
  };

  const fetchSpecificShloka = async (chapter: number, verse: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/shloka/${chapter}/${verse}?email=${encodeURIComponent(email || '')}&lang=${lang}`);
      if (res.ok) {
        const data = await res.json();

        // If we fetch a specific shloka, switch to shloka-detail tab to show it
        setActiveTab('shloka-detail');
        setSpecificShloka(data); // Display as the individual active shloka
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
    setSearchError(null);
    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(queryStr)}&email=${email}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data);
      } else if (res.status === 429) {
        setSearchRetryTimer(data.retryAfter || 30);
        setSearchError(data.error);
      }
    } catch (err) {
      console.error('Failed search query', err);
    }
  };

  // Toggle bookmark API
  const handleToggleBookmark = async (shloka: Shloka) => {
    if (!userId) {
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
        body: JSON.stringify({ userId, chapter: shloka.chapter, verse: shloka.verse }),
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
      const matchBrowseSpecific = hash.match(/#\/browse\/chapter\/(\d+)\/verse\/(\d+)/);
      
      if (matchSpecific) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        const chapter = parseInt(matchSpecific[1]);
        const verse = parseInt(matchSpecific[2]);
        fetchSpecificShloka(chapter, verse);
      } else if (matchBrowseSpecific) {
        const chapter = parseInt(matchBrowseSpecific[1]);
        const verse = parseInt(matchBrowseSpecific[2]);
        setBrowseChapterNumber(chapter);
        setBrowseVerseNumber(verse);
        setActiveTab('browse');
        fetchChapters();

        // Save History
        if (userId) {
          fetch(`${API_BASE}/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, chapter, verse })
          }).catch(() => {});
          setReadingHistory({ chapter, verse });
        }
      } else if (hash === '#/browsechapters') {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('browse');
        fetchChapters();
      } else if (hash === '#/searchinsights') {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('search');
      } else if (hash === '#/guidance') {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('guidance');
      } else if (hash === '#/bookmarks') {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('bookmarks');
        fetchBookmarks();
      } else if (hash === '#/dailyinsights') {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('daily');
        fetchDailyShloka();
      } else if (hash === '#/about') {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('about');
      } else {
        // Default route
        window.location.hash = '#/guidance';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run on mount/email changes

    fetchChapters();
    fetchBookmarks();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReadingHistory();

    // Ping activity for analytics & daily nudge logic
    if (userId) {
      fetch(`${API_BASE}/user/active`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }).catch(() => {});
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, userId, lang]);

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

  return {
    email,
    userId,
    userName,
    setUserName,
    pref,
    lang,
    activeTab,
    setActiveTab,
    browseChapterNumber,
    browseVerseNumber,
    readingHistory,
    guidanceQuery,
    setGuidanceQuery,
    guidanceLoading,
    guidanceResult,
    guidanceError,
    guidanceRetryTimer,
    editPref,
    setEditPref,
    editLang,
    setEditLang,
    editName,
    setEditName,
    isPrefsModalOpen,
    setIsPrefsModalOpen,
    toast,
    showToast,
    publicVapidKey,
    isPushSubscribed,
    loading,
    dailyShloka,
    specificShloka,
    chapters,
    bookmarks,
    searchQuery,
    setSearchQuery,
    searchResults,
    searchError,
    searchRetryTimer,
    activeTopic,
    topics,
    handleLogout,
    handleDeleteAccount,
    handleSavePrefs,
    handleSendTestDelivery,
    handleSeekGuidance,
    handleEnableNotifications,
    handleSendOtp,
    handleVerifyOtp,
    handleGuestSubscribe,
    handleGuestLangChange,
    fetchDailyShloka,
    handleToggleBookmark,
    handleTopicClick,
    handleSearch,
    API_BASE
  };
}
