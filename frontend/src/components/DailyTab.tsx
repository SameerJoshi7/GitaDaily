import { ShlokaCard } from './ShlokaCard';
import type { Shloka } from './ShlokaCard';
import { t } from '../i18n';

interface DailyTabProps {
  loading: boolean;
  dailyShloka: Shloka | null;
  bookmarks: Shloka[];
  onToggleBookmark: (shloka: Shloka) => void;
  lang: string;
}

export function DailyTab({
  loading,
  dailyShloka,
  bookmarks,
  onToggleBookmark,
  lang,
}: DailyTabProps) {
  const T = t(lang);

  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">{T.daily.pageTitle}</h2>
        <span className="dashboard-subtitle">{T.daily.pageSubtitle}</span>
      </div>

      {/* Seek Guidance Promo Banner */}
      <div
        onClick={() => { window.location.hash = '#/guidance'; }}
        style={{
          cursor: 'pointer',
          background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.08) 0%, rgba(79, 70, 229, 0.03) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🪔</div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gold-secondary)', fontWeight: 600 }}>{T.daily.challengeBannerTitle}</h4>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{T.daily.challengeBannerDesc}</p>
          </div>
        </div>
        <button
          className="primary-btn"
          style={{
            padding: '0.3rem 0.75rem',
            fontSize: '0.75rem',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          {T.daily.seekSolutions}
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span style={{ color: 'var(--gold-primary)', fontWeight: 500, letterSpacing: 1 }}>{T.daily.loadingReflection}</span>
        </div>
      ) : dailyShloka ? (
        <ShlokaCard
          shloka={dailyShloka}
          isBookmarked={bookmarks.some(b => b.chapter === dailyShloka.chapter && b.verse === dailyShloka.verse)}
          onToggleBookmark={() => onToggleBookmark(dailyShloka)}
          lang={lang}
        />
      ) : (
        <div className="empty-state">
          <p>{T.daily.noShloka}</p>
        </div>
      )}
    </div>
  );
}
