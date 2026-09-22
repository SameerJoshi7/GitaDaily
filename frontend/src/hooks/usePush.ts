import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gita-daily-backend.onrender.com/api/v1';

export function usePush() {
  const [publicVapidKey, setPublicVapidKey] = useState('');
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);

  useEffect(() => {
    // Fetch VAPID Public Key
    fetch(`${API_BASE}/push/public-key`)
      .then(res => res.json())
      .then(data => {
        if (data.publicKey) {
          setPublicVapidKey(data.publicKey);
        }
      })
      .catch(err => console.error('Failed to fetch VAPID key', err));

    // Check push subscription status
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

  return {
    publicVapidKey, setPublicVapidKey,
    isPushSubscribed, setIsPushSubscribed
  };
}
