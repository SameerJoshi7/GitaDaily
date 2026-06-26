import React from 'react';
import {
  Compass,
  BookOpen,
  Search,
  Bookmark,
  Sparkles,
  Info,
  Globe
} from 'lucide-react';
import { t } from '../i18n';

interface SidebarProps {
  activeTab: string;
  email: string;
  lang: string;
  onRefreshDaily: () => void;
  onOpenPrefs: () => void;
  onLangChange: (lang: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  email,
  lang,
  onRefreshDaily,
  onOpenPrefs,
  onLangChange
}) => {
  const T = t(lang);

  return (
    <aside className="sidebar">
      {/* Top Header Row for mobile / Standard brand alignment for desktop */}
      <div className="sidebar-header-row">
        <a href="#/dailyinsights" onClick={(e) => { e.preventDefault(); window.location.hash = '#/dailyinsights'; }} className="brand" style={{ gap: '0.6rem' }}>
          <img src="/flute-icon.png" alt="Krishna Bodha Logo" className="brand-icon" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
            <span className="brand-name-sanskrit">कृष्णबोध</span>
            <span className="brand-subtitle">Krishna Bodha</span>
          </div>
        </a>

        {/* Mobile Language and Preferences Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            value={lang}
            onChange={(e) => onLangChange(e.target.value)}
            className="mobile-lang-select"
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <option value="english" style={{ background: '#12141f' }}>EN</option>
            <option value="hindi" style={{ background: '#12141f' }}>HI</option>
            <option value="telugu" style={{ background: '#12141f' }}>TE</option>
            <option value="kannada" style={{ background: '#12141f' }}>KN</option>
          </select>
          <button className="mobile-pref-btn" onClick={onOpenPrefs} aria-label="Preferences">
            {email ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 500 }}>
                👤 Prefs
              </span>
            ) : (
              <span className="glow-subscribe-text">
                ✨ Subscribe
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="sidebar-artwork">
        <img
          src="/images/chariot.jpg"
          alt="Gita Sidebar Art"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <ul className="nav-links">
        <li className="nav-item" style={{ marginBottom: '0.4rem' }}>
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
        <li className="nav-item">
          <button
            onClick={() => { window.location.hash = '#/about'; }}
            className={`nav-button ${activeTab === 'about' ? 'active' : ''}`}
          >
            <Info size={18} />
            <span>{T.nav.aboutKrishnaBodha}</span>
          </button>
        </li>
      </ul>

      {/* Desktop Preferences & Language widget */}
      <div className="desktop-profile-container">
        {/* Language Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Globe size={16} color="var(--text-secondary)" />
          <select
            value={lang}
            onChange={(e) => onLangChange(e.target.value)}
            style={{
              background: 'transparent',
              color: 'var(--text-primary)',
              border: 'none',
              outline: 'none',
              width: '100%',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            <option value="english" style={{ background: '#12141f' }}>English</option>
            <option value="hindi" style={{ background: '#12141f' }}>हिंदी (Hindi)</option>
            <option value="telugu" style={{ background: '#12141f' }}>తెలుగు (Telugu)</option>
            <option value="kannada" style={{ background: '#12141f' }}>ಕನ್ನಡ (Kannada)</option>
          </select>
        </div>

        {email ? (
          <button
            onClick={onOpenPrefs}
            className="secondary-btn"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
          >
            👤 Preferences
          </button>
        ) : (
          <button
            onClick={onOpenPrefs}
            className="primary-btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              fontSize: '0.85rem',
              background: 'linear-gradient(135deg, #fbbf24, #d97706)',
              color: '#000',
              fontWeight: 600
            }}
          >
            ✨ Subscribe
          </button>
        )}
      </div>
    </aside>
  );
};
