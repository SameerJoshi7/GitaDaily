import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { Shloka } from '../components/ShlokaCard';
import { t } from '../i18n';
import { useAuth } from './useAuth';
import { usePreferences } from './usePreferences';
import { useGuidance } from './useGuidance';
import { useDataSync } from './useDataSync';
import { usePush } from './usePush';
import { useUI } from '../contexts/UIContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gita-daily-backend.onrender.com/api/v1';

export type Tab = 'daily' | 'browse' | 'search' | 'bookmarks' | 'guidance' | 'about' | 'shloka-detail' | 'journal';

export function useApp() {
  const location = useLocation();
  const ui = useUI();
  const { activeTab, setActiveTab, toast, showToast } = ui;
  
  const auth = useAuth();
  const { email, userId, userName, currentStreak, longestStreak, setUserName, setCurrentStreak, setLongestStreak } = auth;
  
  const prefs = usePreferences(userName);
  const { pref, setPref, lang, setLang, editPref, setEditPref, editLang, setEditLang, editName, setEditName, isPrefsModalOpen, setIsPrefsModalOpen } = prefs;
  
  const guidance = useGuidance();
  const { guidanceQuery, setGuidanceQuery, guidanceLoading, setGuidanceLoading, guidanceResult, setGuidanceResult, guidanceError, setGuidanceError, guidanceRetryTimer, setGuidanceRetryTimer } = guidance;
  
  const dataSync = useDataSync();
  const { loading, setLoading, dailyShloka, setDailyShloka, specificShloka, setSpecificShloka, chapters, setChapters, bookmarks, setBookmarks, readingHistory, setReadingHistory, searchQuery, setSearchQuery, searchResults, setSearchResults, activeTopic, setActiveTopic, searchError, setSearchError, searchRetryTimer, setSearchRetryTimer, topics } = dataSync;
  
  const pushState = usePush();
  const { publicVapidKey, isPushSubscribed, setIsPushSubscribed } = pushState;

  const [browseChapterNumber, setBrowseChapterNumber] = useState<number | null>(null);
  const [browseVerseNumber, setBrowseVerseNumber] = useState<number | null>(null);

  // Helper: save user to localStorage and state
  const loginUser = (userData: { email: string; pref: string; lang: string; name?: string; _id?: string; currentStreak?: number; longestStreak?: number }) => {
    auth.loginUser(userData);
    prefs.loginPreferences(userData);
  };

  const handleLogout = () => {
    auth.clearAuth();
    prefs.clearPreferences();
    dataSync.clearDataSync();
    guidance.clearGuidance();
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

  const handleUpgradePreference = async (newPref: string) => {
    try {
      const res = await fetch(`${API_BASE}/user/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pref: newPref, lang, name: userName }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('gitadaily_pref', data.pref || 'email');
        setPref(data.pref || 'email');
        setEditPref(data.pref || 'email');
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
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
          email,
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

  const syncExistingPushSubscription = (uid: string) => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub) {
            fetch(`${API_BASE}/push/subscribe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: uid, subscription: sub })
            }).then(res => {
              if (res.ok) setIsPushSubscribed(true);
            }).catch(console.error);
          }
        }).catch(console.error);
      }).catch(console.error);
    }
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
        syncExistingPushSubscription(data.user._id);
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
        syncExistingPushSubscription(data._id);
        
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
    if (!userId) {
      const local = localStorage.getItem('gitadaily_local_history');
      if (local) {
        setReadingHistory(JSON.parse(local));
      }
      return;
    }
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

  // Run initial fetches on email state change or route change
  useEffect(() => {
    const handleLocationChange = () => {
      const path = location.pathname;
      const matchSpecific = path.match(/^\/chapter\/(\d+)\/verse\/(\d+)/);
      const matchBrowseSpecific = path.match(/^\/browse\/chapter\/(\d+)\/verse\/(\d+)/);
      
      if (matchSpecific) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        const chapter = parseInt(matchSpecific[1]);
        const verse = parseInt(matchSpecific[2]);
        fetchSpecificShloka(chapter, verse);
        setActiveTab('shloka-detail');
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
        } else {
          localStorage.setItem('gitadaily_local_history', JSON.stringify({ chapter, verse }));
        }
        setReadingHistory({ chapter, verse });
      } else if (path.startsWith('/browse')) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('browse');
        fetchChapters();
      } else if (path.startsWith('/searchinsights')) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('search');
      } else if (path.startsWith('/guidance')) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('guidance');
      } else if (path.startsWith('/bookmarks')) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('bookmarks');
        fetchBookmarks();
      } else if (path.startsWith('/dailyinsights')) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('daily');
        fetchDailyShloka();
      } else if (path.startsWith('/journal')) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('journal');
      } else if (path.startsWith('/about')) {
        setBrowseChapterNumber(null);
        setBrowseVerseNumber(null);
        setActiveTab('about');
      }
    };

    handleLocationChange(); // Run on mount/email/location changes

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
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.currentStreak !== undefined) {
          setCurrentStreak(data.currentStreak);
          setLongestStreak(data.longestStreak);
          localStorage.setItem('gitadaily_currentStreak', data.currentStreak.toString());
          localStorage.setItem('gitadaily_longestStreak', data.longestStreak.toString());
        }
      })
      .catch(() => {});
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, userId, lang, location.pathname]);

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
    currentStreak,
    longestStreak,
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
    handleUpgradePreference,
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
