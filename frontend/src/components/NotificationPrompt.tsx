import { useState, useEffect } from 'react';
import { Bell, Mail } from 'lucide-react';

interface NotificationPromptProps {
  email: string;
  pref: string;
  handleEnableNotifications: () => Promise<void>;
  handleUpgradePreference: (newPref: string) => Promise<boolean>;
  showInitialOnboarding: boolean;
  onInitialOnboardingComplete: (skipped?: boolean) => void;
}

export function NotificationPrompt({
  email,
  pref,
  handleEnableNotifications,
  handleUpgradePreference,
  showInitialOnboarding,
  onInitialOnboardingComplete,
}: NotificationPromptProps) {
  const [showDailyBanner, setShowDailyBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  // Daily Banner Logic
  useEffect(() => {
    if (showInitialOnboarding || !email) return;

    // Check if they need an upgrade
    const needsUpgrade = pref === 'none' || pref === 'email' || pref === 'push';
    if (!needsUpgrade) return;

    const dismissed = localStorage.getItem('gitadaily_prompt_dismissed');
    if (dismissed === 'true') return;

    const lastDate = localStorage.getItem('gitadaily_prompt_last_date');
    const today = new Date().toISOString().split('T')[0];
    if (lastDate === today) return; // already asked today

    // Trigger daily banner
    setShowDailyBanner(true);
  }, [email, pref, showInitialOnboarding]);

  const handleDismissDaily = (permanently: boolean) => {
    setShowDailyBanner(false);
    const count = parseInt(localStorage.getItem('gitadaily_prompt_count') || '0', 10) + 1;
    localStorage.setItem('gitadaily_prompt_count', count.toString());
    localStorage.setItem('gitadaily_prompt_last_date', new Date().toISOString().split('T')[0]);

    if (permanently) {
      localStorage.setItem('gitadaily_prompt_dismissed', 'true');
    }
  };

  const promptCount = parseInt(localStorage.getItem('gitadaily_prompt_count') || '0', 10);
  const isDay2 = promptCount >= 1;

  const handleInitialChoice = async (choice: 'email' | 'push' | 'all') => {
    setLoading(true);
    if (choice === 'push' || choice === 'all') {
      await handleEnableNotifications(); // triggers browser prompt
    }
    await handleUpgradePreference(choice);
    setLoading(false);
    onInitialOnboardingComplete(false);
  };

  const handleBannerUpgrade = async () => {
    setLoading(true);
    if (pref === 'none') {
      await handleEnableNotifications();
      await handleUpgradePreference('all');
    } else if (pref === 'email') {
      await handleEnableNotifications();
      await handleUpgradePreference('all');
    } else if (pref === 'push') {
      await handleUpgradePreference('all');
    }
    setLoading(false);
    setShowDailyBanner(false);
    localStorage.setItem('gitadaily_prompt_dismissed', 'true'); // They upgraded, don't ask again
  };

  if (showInitialOnboarding) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ textAlign: 'center' }}>
          <h3 style={{ color: 'var(--gold-primary)', margin: '0 0 1rem 0' }}>Welcome to Krishna Bodha! 🪔</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            How would you like to receive your daily wisdom?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <button 
              className="primary-btn"
              onClick={() => handleInitialChoice('all')}
              disabled={loading}
              style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000' }}
            >
              <Bell size={16} /> <Mail size={16} /> Both (Recommended)
            </button>
            <button 
              className="secondary-btn"
              onClick={() => handleInitialChoice('email')}
              disabled={loading}
              style={{ justifyContent: 'center' }}
            >
              <Mail size={16} /> Email Only
            </button>
            <button 
              className="secondary-btn"
              onClick={() => handleInitialChoice('push')}
              disabled={loading}
              style={{ justifyContent: 'center' }}
            >
              <Bell size={16} /> Web Push Only
            </button>
            <button 
              className="secondary-btn"
              onClick={() => onInitialOnboardingComplete(true)}
              disabled={loading}
              style={{ justifyContent: 'center', border: 'none', background: 'transparent', marginTop: '0.5rem', color: 'var(--text-muted)' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showDailyBanner && !showInitialOnboarding) {
    let title = "Never miss a shloka!";
    let action = "Enable Notifications";
    if (pref === 'email') {
      action = "Enable Web Push Notifications";
    } else if (pref === 'push') {
      action = "Enable Email Notifications";
    } else if (pref === 'none') {
      action = "Enable Email & Push Notifications";
    }

    return (
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--gold-primary)',
        boxShadow: '0 4px 12px rgba(212, 175, 55, 0.2)',
        padding: '1rem',
        borderRadius: '12px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.8rem',
        width: '90%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
          <strong style={{ color: 'var(--gold-primary)' }}>{title}</strong><br />
          {action}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', flexWrap: 'wrap' }}>
          <button 
            className="primary-btn" 
            style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', minWidth: '120px' }}
            onClick={handleBannerUpgrade}
            disabled={loading}
          >
            {loading ? '...' : 'Enable'}
          </button>
          <button 
            className="secondary-btn" 
            style={{ flex: 1, padding: '0.5rem', justifyContent: 'center', background: 'transparent', minWidth: '120px' }}
            onClick={() => handleDismissDaily(false)}
            disabled={loading}
          >
            Not Now
          </button>
        </div>
        {isDay2 && (
          <button 
            onClick={() => handleDismissDaily(true)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Do Not Ask Again
          </button>
        )}
      </div>
    );
  }

  return null;
}
