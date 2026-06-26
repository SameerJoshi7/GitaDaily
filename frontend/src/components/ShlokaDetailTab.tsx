import { ShlokaCard } from './ShlokaCard';
import type { Shloka } from './ShlokaCard';
import { ArrowLeft } from 'lucide-react';

interface ShlokaDetailTabProps {
  shloka: Shloka | null;
  loading: boolean;
  bookmarks: Shloka[];
  onToggleBookmark: (shloka: Shloka) => void;
  lang: string;
}

export function ShlokaDetailTab({
  shloka,
  loading,
  bookmarks,
  onToggleBookmark,
  lang,
}: ShlokaDetailTabProps) {

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={handleBack}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--card-border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title="Go Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="dashboard-title">Verse Details</h2>
          <span className="dashboard-subtitle">Individual Shloka</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
          <span style={{ color: 'var(--gold-primary)', fontWeight: 500, letterSpacing: 1 }}>Loading...</span>
        </div>
      ) : shloka ? (
        <ShlokaCard
          shloka={shloka}
          isBookmarked={bookmarks.some(b => b.chapter === shloka.chapter && b.verse === shloka.verse)}
          onToggleBookmark={() => onToggleBookmark(shloka)}
          lang={lang}
        />
      ) : (
        <div className="empty-state">
          <p>Verse not found.</p>
        </div>
      )}
    </div>
  );
}
