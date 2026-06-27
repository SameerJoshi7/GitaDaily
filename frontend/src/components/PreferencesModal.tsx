import React, { useState } from 'react';
import { Bell, Sparkles, LogOut } from 'lucide-react';
import { t } from '../i18n';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  pref: string;
  lang: string;
  onLangChange: (lang: string) => void;
  loading: boolean;
  editPref: string;
  setEditPref: (val: string) => void;
  editName: string;
  setEditName: (val: string) => void;
  isPushSubscribed: boolean;
  handleGuestSubscribe: (emailVal: string, prefVal: string) => Promise<{ success: boolean; error?: string; status?: number }>;
  handleSendOtp: (email: string) => Promise<{ success: boolean; error?: string; status?: number }>;
  handleVerifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  handleSavePrefs: (e: React.FormEvent) => Promise<void>;
  handleEnableNotifications: () => Promise<void>;
  handleSendTestDelivery: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
}

export function PreferencesModal({
  isOpen,
  onClose,
  email,
  pref,
  lang,
  onLangChange,
  loading,
  editPref,
  setEditPref,
  editName,
  setEditName,
  isPushSubscribed,
  handleGuestSubscribe,
  handleSendOtp,
  handleVerifyOtp,
  handleSavePrefs,
  handleEnableNotifications,
  handleSendTestDelivery,
  handleDeleteAccount,
}: PreferencesModalProps) {
  const [authMode, setAuthMode] = useState<'subscribe' | 'login'>('subscribe');
  const [loginStep, setLoginStep] = useState<'email' | 'otp'>('email');
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  if (!isOpen) return null;

  const T = t(lang);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        {!email ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
              <button 
                onClick={() => { setAuthMode('subscribe'); setOtpError(''); }}
                style={{ 
                  background: 'none', border: 'none', 
                  color: authMode === 'subscribe' ? 'var(--gold-primary)' : 'var(--text-muted)',
                  fontWeight: authMode === 'subscribe' ? 700 : 400,
                  fontSize: '1.1rem', cursor: 'pointer', padding: '0.5rem'
                }}
              >
                New User?
              </button>
              <button 
                onClick={() => { setAuthMode('login'); setLoginStep('email'); setOtpError(''); }}
                style={{ 
                  background: 'none', border: 'none', 
                  color: authMode === 'login' ? 'var(--gold-primary)' : 'var(--text-muted)',
                  fontWeight: authMode === 'login' ? 700 : 400,
                  fontSize: '1.1rem', cursor: 'pointer', padding: '0.5rem'
                }}
              >
                Already Subscribed?
              </button>
            </div>

            {authMode === 'subscribe' ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setOtpError('');
                const form = e.currentTarget;
                const emailVal = (form.elements.namedItem('guestEmail') as HTMLInputElement).value;
                const prefVal = (form.elements.namedItem('guestPref') as HTMLSelectElement).value;
                const res = await handleGuestSubscribe(emailVal, prefVal);
                if (res.success) {
                  onClose();
                } else {
                  if (res.status === 400 && res.error?.includes('already exists')) {
                    setAuthMode('login');
                    setLoginStep('email');
                    setAuthEmailInput(emailVal);
                    setOtpError('Account already exists. Please log in.');
                  } else {
                    setOtpError(res.error || 'Subscription failed');
                  }
                }
              }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                  Subscribe to Daily Wisdom
                </h4>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Join us to unlock personalized guidance! It's completely free - we never charge for sharing the knowledge, all we need is your email just to personalise your experience.
                </p>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    name="guestEmail"
                    type="email"
                    className="input-field"
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <select name="guestPref" className="input-field">
                    <option value="email">Email Only</option>
                    <option value="push">Web Push</option>
                    <option value="all">Email &amp; Push Notifications</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="primary-btn"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', padding: '0.6rem', justifyContent: 'center' }}
                  disabled={loading}
                >
                  Subscribe
                </button>
                {otpError && authMode === 'subscribe' && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                    ⚠️ {otpError}
                  </div>
                )}
                <div style={{ marginTop: '0.2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--gold-primary)' }}>🔒</span> We value your privacy. Your email will never be spammed or shared.
                </div>
              </form>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                setOtpError('');
                setOtpLoading(true);
                
                if (loginStep === 'email') {
                  const res = await handleSendOtp(authEmailInput);
                  if (res.success) {
                    setLoginStep('otp');
                  } else {
                    if (res.status === 404) {
                      setAuthMode('subscribe');
                      setOtpError('User not found. Please subscribe as a new user.');
                      // We can optionally pre-fill the subscribe email field if needed, but it's okay for now.
                    } else {
                      setOtpError(res.error || 'Failed to send OTP');
                    }
                  }
                } else {
                  const res = await handleVerifyOtp(authEmailInput, otpCode);
                  if (res.success) {
                    onClose();
                  } else {
                    setOtpError(res.error || 'Invalid OTP');
                  }
                }
                setOtpLoading(false);
              }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                  Log In securely with Email
                </h4>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                  Enter your email to receive a secure one-time password (OTP). No passwords required.
                </p>

                {loginStep === 'email' ? (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="Enter your email"
                      value={authEmailInput}
                      onChange={(e) => setAuthEmailInput(e.target.value)}
                      required
                    />
                  </div>
                ) : (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <p style={{ color: 'var(--gold-primary)', fontSize: '0.85rem', marginBottom: '0.5rem', marginTop: 0 }}>
                      OTP sent to {authEmailInput}
                    </p>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter 6-digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      maxLength={6}
                      style={{ letterSpacing: '4px', textAlign: 'center', fontSize: '1.1rem' }}
                    />
                  </div>
                )}

                {otpError && (
                  <div style={{ color: 'var(--error)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                    ⚠️ {otpError}
                  </div>
                )}

                <button
                  type="submit"
                  className="primary-btn"
                  style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', padding: '0.6rem', justifyContent: 'center' }}
                  disabled={otpLoading || (!authEmailInput && loginStep === 'email') || (!otpCode && loginStep === 'otp')}
                >
                  {otpLoading ? 'Loading...' : (loginStep === 'email' ? 'Send OTP' : 'Verify & Log In')}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚙️ Settings
            </h3>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {T.sidebar.subscribedAs} <strong style={{ color: 'var(--text-primary)' }}>{editName ? `${editName} (${email})` : email}</strong>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleSavePrefs(e);
              onClose();
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="How should Krishna address you?"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Language</label>
                <select
                  className="input-field"
                  value={lang}
                  onChange={(e) => onLangChange(e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="hindi">हिंदी (Hindi)</option>
                  <option value="telugu">తెలుగు (Telugu)</option>
                  <option value="kannada">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{T.sidebar.notifications}</label>
                <select
                  className="input-field"
                  value={editPref}
                  onChange={(e) => setEditPref(e.target.value)}
                >
                  <option value="email">{T.sidebar.emailOnly}</option>
                  <option value="push">{T.sidebar.webPushOnly}</option>
                  <option value="all">Email & Push Notifications</option>
                </select>
              </div>

              <button
                type="submit"
                className="primary-btn"
                style={{ padding: '0.6rem', justifyContent: 'center' }}
                disabled={loading}
              >
                {T.sidebar.save}
              </button>
            </form>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '0.25rem 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>


              {/* Web Push Subscription Action */}
              {(pref === 'push' || pref === 'all') && (
                isPushSubscribed ? (
                  <div style={{ fontSize: '0.75rem', color: '#10B981', textAlign: 'center', padding: '0.4rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {T.sidebar.browserPushEnabled}
                  </div>
                ) : (
                  <button
                    onClick={handleEnableNotifications}
                    className="primary-btn"
                    style={{ padding: '0.5rem', justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    disabled={loading}
                  >
                    <Bell size={12} />
                    <span>{T.sidebar.enableBrowserPush}</span>
                  </button>
                )
              )}

              <button
                onClick={handleSendTestDelivery}
                className="primary-btn"
                style={{ padding: '0.5rem', justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                disabled={loading}
              >
                <Sparkles size={12} />
                <span>{T.sidebar.testSendInsight}</span>
              </button>


              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to permanently delete your subscription and erase all saved history? This action cannot be undone.')) {
                    handleDeleteAccount();
                    onClose();
                  }
                }}
                className="secondary-btn"
                style={{ padding: '0.5rem', justifyContent: 'center', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--error)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}
              >
                <LogOut size={12} style={{ transform: 'rotate(180deg)' }} />
                <span style={{ fontWeight: 600 }}>Delete Subscription</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
