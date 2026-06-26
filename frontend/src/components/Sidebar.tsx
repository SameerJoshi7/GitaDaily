import React from 'react';
import {
  Compass,
  BookOpen,
  Search,
  Bookmark,
  Sparkles,
  Info,
  Settings
} from 'lucide-react';
import { t } from '../i18n';

interface SidebarProps {
  activeTab: string;
  email: string;
  lang: string;
  onRefreshDaily: () => void;
  onOpenPrefs: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  email,
  lang,
  onRefreshDaily,
  onOpenPrefs,
  onLogout
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

        {/* Mobile Preferences Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="mobile-pref-btn" onClick={onOpenPrefs} aria-label="Settings">
            {email ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--gold-primary)', fontWeight: 500 }}>
                <Settings size={14} /> Settings
              </span>
            ) : (
              <span className="glow-subscribe-text">
                ✨ Subscribe
              </span>
            )}
          </button>
          {email && onLogout && (
            <button 
              className="mobile-pref-btn" 
              onClick={() => {
                if(window.confirm('Are you sure you want to log out?')) onLogout();
              }}
              style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.75rem', color: 'var(--error)' }}
              aria-label="Logout"
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Logout</span>
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-artwork">
        <img
          src="/images/chariot.jpg"
          alt="Gita Sidebar Art"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div className="nav-wrapper">
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
      </div>

      {/* Desktop Settings widget */}
      <div className="desktop-profile-container">
        {email ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={onOpenPrefs}
              className="secondary-btn"
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
            >
              <Settings size={16} style={{ marginRight: '6px' }} /> Settings
            </button>
            {onLogout && (
              <button
                onClick={() => {
                  if(window.confirm('Are you sure you want to log out?')) onLogout();
                }}
                className="secondary-btn"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
              >
                Logout
              </button>
            )}
          </div>
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
