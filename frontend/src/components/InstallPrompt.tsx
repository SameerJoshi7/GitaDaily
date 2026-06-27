import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Handle Android/Chrome Install Prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS Safari (not standalone)
    const isIos = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      return /iphone|ipad|ipod/.test(userAgent);
    };
    
    // In iOS Safari, we manually show our custom prompt after a small delay
    if (isIos() && !window.navigator.standalone) {
      const hasDismissed = localStorage.getItem('gitadaily_ios_install_dismissed');
      if (!hasDismissed) {
        setTimeout(() => setShowIosPrompt(true), 3000);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismissIos = () => {
    setShowIosPrompt(false);
    localStorage.setItem('gitadaily_ios_install_dismissed', 'true');
  };

  if (isDismissed) return null;

  // Render Android/Chrome Native Install Button
  if (deferredPrompt) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(13, 15, 22, 0.95)', border: '1px solid var(--gold-primary)',
        borderRadius: '12px', padding: '12px 20px', zIndex: 1000, display: 'flex',
        alignItems: 'center', gap: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        width: '90%', maxWidth: '400px'
      }}>
        <div style={{ flex: 1 }}>
          <strong style={{ color: 'var(--gold-primary)', display: 'block', fontSize: '1rem', marginBottom: '4px' }}>Install Krishna Bodha</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Get native app experience & daily notifications!</span>
        </div>
        <button 
          onClick={handleInstallClick}
          className="primary-btn"
          style={{ padding: '8px 16px', fontSize: '0.9rem' }}
        >
          <Download size={16} /> Install
        </button>
        <button onClick={() => setIsDismissed(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
          <X size={16} />
        </button>
      </div>
    );
  }

  // Render iOS Manual Install Guide
  if (showIosPrompt) {
    return (
      <div style={{
        position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        backgroundColor: 'rgba(13, 15, 22, 0.95)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', padding: '16px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        width: '90%', maxWidth: '400px'
      }}>
        <button onClick={handleDismissIos} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={18} />
        </button>
        <h4 style={{ color: 'var(--gold-primary)', margin: '0 0 10px 0', fontSize: '1rem' }}>Install on iPhone</h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 12px 0', lineHeight: 1.4 }}>
          Install this app on your home screen for native notifications and fullscreen mode!
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px' }}>
          <span>1. Tap</span> <Share size={18} color="#007AFF" /> <span>in Safari menu</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', marginTop: '6px' }}>
          <span>2. Tap</span> <PlusSquare size={18} /> <span>Add to Home Screen</span>
        </div>
      </div>
    );
  }

  return null;
}
