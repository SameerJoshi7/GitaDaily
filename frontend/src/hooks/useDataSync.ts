import { useState, useEffect } from 'react';
import type { Shloka } from '../components/ShlokaCard';
import type { Chapter } from '../components/BrowseTab';

export function useDataSync() {
  const [loading, setLoading] = useState(false);
  const [dailyShloka, setDailyShloka] = useState<Shloka | null>(null);
  const [specificShloka, setSpecificShloka] = useState<Shloka | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [bookmarks, setBookmarks] = useState<Shloka[]>([]);
  const [readingHistory, setReadingHistory] = useState<{ chapter: number, verse: number } | null>(null);

  // Search States
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('gitadaily_searchQuery') || '');
  const [searchResults, setSearchResults] = useState<Shloka[]>(() => {
    const saved = sessionStorage.getItem('gitadaily_searchResults');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchRetryTimer, setSearchRetryTimer] = useState(0);

  const topics = ['duty', 'karma', 'focus', 'anxiety', 'mindfulness', 'soul', 'career', 'wisdom', 'peace', 'devotion'];

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

  const clearDataSync = () => {
    setDailyShloka(null);
    setBookmarks([]);
    setReadingHistory(null);
    
    // Clear Search state
    setSearchQuery('');
    setSearchResults([]);
    sessionStorage.removeItem('gitadaily_searchQuery');
    sessionStorage.removeItem('gitadaily_searchResults');
  };

  return {
    loading, setLoading,
    dailyShloka, setDailyShloka,
    specificShloka, setSpecificShloka,
    chapters, setChapters,
    bookmarks, setBookmarks,
    readingHistory, setReadingHistory,
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    activeTopic, setActiveTopic,
    searchError, setSearchError,
    searchRetryTimer, setSearchRetryTimer,
    topics,
    clearDataSync
  };
}
