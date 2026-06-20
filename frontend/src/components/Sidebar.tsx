import React from 'react';
import {
  Compass,
  BookOpen,
  Search,
  Bookmark,
  Sparkles,
  Info,
  User,
  LogOut,
  Send,
  Bell
} from 'lucide-react';
import { t } from '../i18n';

interface SidebarProps {
  activeTab: string;
  email: string;
  lang: string;
  pref: string;
  isEditingPrefs: boolean;
  setIsEditingPrefs: (val: boolean) => void;
  editLang: string;
  setEditLang: (val: string) => void;
  editPref: string;
  setEditPref: (val: string) => void;
  loading: boolean;
  isPushSubscribed: boolean;
  telegramBotUsername: string;
  onSavePrefs: (e: React.FormEvent) => void;
  onEnableNotifications: () => void;
  onSendTestDelivery: () => void;
  onLogout: () => void;
  onRefreshDaily: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  email,
  lang,
  pref,
  isEditingPrefs,
  setIsEditingPrefs,
  editLang,
  setEditLang,
  editPref,
  setEditPref,
  loading,
  isPushSubscribed,
  telegramBotUsername,
  onSavePrefs,
  onEnableNotifications,
  onSendTestDelivery,
  onLogout,
  onRefreshDaily
}) => {
  const T = t(lang);

  // Human-readable pref label in the current language
  const prefLabel = (p: string) => {
    switch (p) {
      case 'email': return T.sidebar.emailOnly;
      case 'telegram': return T.sidebar.telegramOnly;
      case 'push': return T.sidebar.webPushOnly;
      case 'both': return T.sidebar.bothEmailTelegram;
      case 'all': return T.sidebar.allChannels;
      default: return p;
    }
  };

  return (
    <aside className="sidebar">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <a href="#/dailyinsights" onClick={(e) => { e.preventDefault(); window.location.hash = '#/dailyinsights'; }} className="brand">
          <span className="brand-icon">🪔</span>
          <span className="brand-name">GitaDaily</span>
        </a>

        <div className="sidebar-artwork" style={{ borderRadius: '8px', overflow: 'hidden', width: '100%', height: '110px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '-0.75rem', marginBottom: '-0.5rem' }}>
          <img
            src="/images/chariot.jpg"
            alt="Gita Sidebar Art"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        <ul className="nav-links">
          <li className="nav-item">
            <button
              onClick={() => {
                if (window.location.hash === '#/dailyinsights') {
                  onRefreshDaily();
                } else {
                  window.location.hash = '#/dailyinsights';
                }
              }}
              className={`nav-button ${activeTab === 'daily' ? 'active' : ''}`}
            >
              <Compass size={18} />
              <span>{T.nav.dailyInsight}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              onClick={() => { window.location.hash = '#/browsechapters'; }}
              className={`nav-button ${activeTab === 'browse' ? 'active' : ''}`}
            >
              <BookOpen size={18} />
              <span>{T.nav.browseChapters}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              onClick={() => { window.location.hash = '#/searchinsights'; }}
              className={`nav-button ${activeTab === 'search' ? 'active' : ''}`}
            >
              <Search size={18} />
              <span>{T.nav.searchTopics}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              onClick={() => { window.location.hash = '#/bookmarks'; }}
              className={`nav-button ${activeTab === 'bookmarks' ? 'active' : ''}`}
            >
              <Bookmark size={18} />
              <span>{T.nav.myBookmarks}</span>
            </button>
          </li>
          <li className="nav-item" style={{ marginTop: '0.4rem' }}>
            <button
              onClick={() => { window.location.hash = '#/guidance'; }}
              className={`nav-button ${activeTab === 'guidance' ? 'active' : ''}`}
              style={activeTab === 'guidance' ? {} : {
                border: '1px dashed rgba(212, 175, 55, 0.4)',
                background: 'rgba(212, 175, 55, 0.03)',
                boxShadow: '0 0 10px rgba(212, 175, 55, 0.05)'
              }}
            >
              <Sparkles size={18} style={{ color: 'var(--gold-primary)', filter: 'drop-shadow(0 0 4px var(--gold-glow))' }} />
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{T.nav.seekGuidance}</span>
              <span style={{
                fontSize: '0.6rem',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                color: '#000',
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: 'auto',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>{T.nav.newBadge}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              onClick={() => { window.location.hash = '#/about'; }}
              className={`nav-button ${activeTab === 'about' ? 'active' : ''}`}
            >
              <Info size={18} />
              <span>{T.nav.aboutGitaDaily}</span>
            </button>
          </li>
        </ul>
      </div>

      <div className="user-profile-widget" style={{ gap: isEditingPrefs ? '0.75rem' : '0.5rem' }}>
        {isEditingPrefs ? (
          <form onSubmit={onSavePrefs} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold-primary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {T.sidebar.editPreferences}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>{T.sidebar.language}</label>
              <select
                className="input-field"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
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
              <label className="form-label" style={{ fontSize: '0.7rem' }}>{T.sidebar.notifications}</label>
              <select
                className="input-field"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
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

            <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.25rem' }}>
              <button type="submit" className="primary-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', flexGrow: 1 }} disabled={loading}>
                {T.sidebar.save}
              </button>
              <button type="button" onClick={() => setIsEditingPrefs(false)} className="secondary-btn" style={{ padding: '0.4rem', fontSize: '0.75rem', flexGrow: 1 }}>
                {T.sidebar.cancel}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <User size={14} />
              <span>{T.sidebar.subscribedAs}</span>
            </div>
            <span className="user-email-text" style={{ fontSize: '0.8rem' }}>{email}</span>

            <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{T.sidebar.languagePrefs}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--gold-primary)', textTransform: 'capitalize', fontWeight: '500' }}>
                {lang} — {prefLabel(pref)}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                onClick={() => setIsEditingPrefs(true)}
                className="secondary-btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center' }}
              >
                {T.sidebar.editPreferences}
              </button>

              {/* Telegram Bot Connector */}
              {(pref === 'telegram' || pref === 'both' || pref === 'all') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <button
                    disabled
                    className="primary-btn"
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.8rem',
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
                    <Send size={12} />
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
                  <div style={{ fontSize: '0.75rem', color: '#10B981', textAlign: 'center', padding: '0.3rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    {T.sidebar.browserPushEnabled}
                  </div>
                ) : (
                  <button
                    onClick={onEnableNotifications}
                    className="primary-btn"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000' }}
                    disabled={loading}
                  >
                    <Bell size={12} />
                    <span>{T.sidebar.enableBrowserPush}</span>
                  </button>
                )
              )}

              <button
                onClick={onSendTestDelivery}
                className="primary-btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000' }}
                disabled={loading}
              >
                <Sparkles size={12} />
                <span>{T.sidebar.testSendInsight}</span>
              </button>

              <button onClick={onLogout} className="secondary-btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', justifyContent: 'center', borderColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)' }}>
                <LogOut size={12} />
                <span>{T.sidebar.signOut}</span>
              </button>
            </div>

            {/* Collapsible Developer Details */}
            <details style={{ marginTop: '0.75rem', width: '100%', fontSize: '0.75rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--gold-primary)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                ℹ️ {T.sidebar.developerDetails}
              </summary>
              <div style={{ marginTop: '0.4rem', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', lineHeight: '1.4', border: '1px solid rgba(255,255,255,0.03)' }}>
                <strong>{T.sidebar.developer}:</strong> Sameer Joshi<br />
                <strong>{T.sidebar.stack}:</strong> React, Node.js, Express, Gemini Flash (gemini-flash-latest), Web Push, EmailJS API<br />
                <strong>{T.sidebar.links}:</strong> <a href="https://github.com/SameerJoshi7" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>GitHub</a> | <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>LinkedIn</a>
              </div>
            </details>

            {/* Made with Love Footer */}
            <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {T.sidebar.madeWith} <a href="https://github.com/SameerJoshi7" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none', fontWeight: 500 }}>Sameer Joshi</a>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
