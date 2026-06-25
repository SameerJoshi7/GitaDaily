import { Bell, Send, Sparkles, LogOut } from 'lucide-react';
import { t } from '../i18n';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  pref: string;
  lang: string;
  loading: boolean;
  editPref: string;
  setEditPref: (val: string) => void;
  editLang: string;
  setEditLang: (val: string) => void;
  isPushSubscribed: boolean;
  telegramBotUsername: string;
  handleGuestSubscribe: (emailVal: string, prefVal: string) => void;
  handleSavePrefs: (e: React.FormEvent) => Promise<void>;
  handleEnableNotifications: () => Promise<void>;
  handleSendTestDelivery: () => Promise<void>;
  handleLogout: () => void;
}

export function PreferencesModal({
  isOpen,
  onClose,
  email,
  pref,
  lang,
  loading,
  editPref,
  setEditPref,
  editLang,
  setEditLang,
  isPushSubscribed,
  telegramBotUsername,
  handleGuestSubscribe,
  handleSavePrefs,
  handleEnableNotifications,
  handleSendTestDelivery,
  handleLogout,
}: PreferencesModalProps) {
  if (!isOpen) return null;

  const T = t(lang);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        {!email ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {T.sidebar.guestWelcome}
            </h3>
            


            {/* Guest Subscribe Form */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const target = e.target as any;
              const emailVal = target.elements.guestEmail.value;
              const prefVal = target.elements.guestPref.value;
              handleGuestSubscribe(emailVal, prefVal);
              onClose();
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <h4 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.95rem' }}>
                {T.sidebar.guestSubscribeTitle}
              </h4>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.8rem', lineHeight: 1.4 }}>
                {T.sidebar.guestSubscribeDesc}
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
                  <option value="email">{T.sidebar.emailOnly}</option>
                  <option value="telegram">{T.sidebar.telegramOnly}</option>
                  <option value="push">{T.sidebar.webPushOnly}</option>
                  <option value="both">{T.sidebar.bothEmailTelegram}</option>
                  <option value="all">{T.sidebar.allChannels}</option>
                </select>
              </div>

              <button
                type="submit"
                className="primary-btn"
                style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', padding: '0.6rem', justifyContent: 'center' }}
                disabled={loading}
              >
                {T.sidebar.subscribeButton}
              </button>
              <div style={{ marginTop: '0.2rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--gold-primary)' }}>🔒</span> We value your privacy. Your email will never be spammed or shared.
              </div>
            </form>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
            <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {T.sidebar.editPreferences}
            </h3>
            
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {T.sidebar.subscribedAs} <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              await handleSavePrefs(e);
              onClose();
            }} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{T.sidebar.language}</label>
                <select
                  className="input-field"
                  value={editLang}
                  onChange={(e) => setEditLang(e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="telugu">Telugu (తెలుగు)</option>
                  <option value="kannada">Kannada (ಕನ್ನಡ)</option>
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
                  <option value="telegram">{T.sidebar.telegramOnly}</option>
                  <option value="push">{T.sidebar.webPushOnly}</option>
                  <option value="both">{T.sidebar.bothEmailTelegram}</option>
                  <option value="all">{T.sidebar.allChannels}</option>
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
              {/* Telegram Connection */}
              {(pref === 'telegram' || pref === 'both' || pref === 'all') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <button
                    disabled
                    className="primary-btn"
                    style={{
                      padding: '0.5rem',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #555, #777)',
                      color: '#bbb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'not-allowed',
                      opacity: 0.7,
                      border: 'none'
                    }}
                  >
                    <Send size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                    <span>{T.sidebar.connectTelegram}</span>
                  </button>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#ef4444',
                    textAlign: 'center',
                    padding: '0.4rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    lineHeight: '1.2'
                  }}>
                    {T.sidebar.telegramUnavailable(telegramBotUsername)}
                  </div>
                </div>
              )}

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
                  handleLogout();
                  onClose();
                }}
                className="secondary-btn"
                style={{ padding: '0.5rem', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <LogOut size={12} />
                <span>{T.sidebar.signOut}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
