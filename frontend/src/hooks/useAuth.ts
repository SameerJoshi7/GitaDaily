import { useState } from 'react';

export function useAuth() {
  const [email, setEmail] = useState<string>(() => localStorage.getItem('gitadaily_email') || '');
  const [userId, setUserId] = useState<string>(() => localStorage.getItem('gitadaily_userId') || '');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('gitadaily_name') || '');
  const [currentStreak, setCurrentStreak] = useState<number>(() => parseInt(localStorage.getItem('gitadaily_currentStreak') || '0', 10));
  const [longestStreak, setLongestStreak] = useState<number>(() => parseInt(localStorage.getItem('gitadaily_longestStreak') || '0', 10));

  const loginUser = (userData: { email: string; name?: string; _id?: string; currentStreak?: number; longestStreak?: number }) => {
    localStorage.setItem('gitadaily_email', userData.email);
    if (userData._id) localStorage.setItem('gitadaily_userId', userData._id);
    if (userData.name) {
      localStorage.setItem('gitadaily_name', userData.name);
      setUserName(userData.name);
    }
    setEmail(userData.email);
    if (userData._id) setUserId(userData._id);
    
    if (userData.currentStreak !== undefined) {
      localStorage.setItem('gitadaily_currentStreak', userData.currentStreak.toString());
      setCurrentStreak(userData.currentStreak);
    }
    if (userData.longestStreak !== undefined) {
      localStorage.setItem('gitadaily_longestStreak', userData.longestStreak.toString());
      setLongestStreak(userData.longestStreak);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('gitadaily_email');
    localStorage.removeItem('gitadaily_userId');
    localStorage.removeItem('gitadaily_name');
    localStorage.removeItem('gitadaily_currentStreak');
    localStorage.removeItem('gitadaily_longestStreak');
    setEmail('');
    setUserId('');
    setCurrentStreak(0);
    setLongestStreak(0);
    setUserName('');
  };

  return {
    email, setEmail,
    userId, setUserId,
    userName, setUserName,
    currentStreak, setCurrentStreak,
    longestStreak, setLongestStreak,
    loginUser,
    clearAuth
  };
}
