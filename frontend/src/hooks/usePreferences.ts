import { useState, useEffect } from 'react';

export function usePreferences(userName: string) {
  const [pref, setPref] = useState<string>(() => localStorage.getItem('gitadaily_pref') || 'email');
  const [lang, setLang] = useState<string>(() => localStorage.getItem('gitadaily_lang') || 'english');
  
  // Edit Prefs States
  const [editPref, setEditPref] = useState(pref);
  const [editLang, setEditLang] = useState(lang);
  const [editName, setEditName] = useState(userName);
  const [isPrefsModalOpen, setIsPrefsModalOpen] = useState(false);

  // Keep editName in sync if userName loads asynchronously
  useEffect(() => {
    setEditName(userName);
  }, [userName]);

  const loginPreferences = (userData: { pref?: string; lang?: string }) => {
    if (userData.pref) {
      localStorage.setItem('gitadaily_pref', userData.pref);
      setPref(userData.pref);
      setEditPref(userData.pref);
    }
    if (userData.lang) {
      localStorage.setItem('gitadaily_lang', userData.lang);
      setLang(userData.lang);
    }
  };

  const clearPreferences = () => {
    localStorage.removeItem('gitadaily_pref');
    // We intentionally DO NOT remove 'gitadaily_lang' so language persists post-logout
    setPref('email');
    // We intentionally DO NOT reset lang to 'english'
  };

  return {
    pref, setPref,
    lang, setLang,
    editPref, setEditPref,
    editLang, setEditLang,
    editName, setEditName,
    isPrefsModalOpen, setIsPrefsModalOpen,
    loginPreferences,
    clearPreferences
  };
}
