import React from 'react';
import { Sparkles, Bookmark, Lock } from 'lucide-react';
import type { Shloka } from './ShlokaCard';
import { ShlokaShare } from './ShlokaShare';
import { t } from '../i18n';

interface GuidanceTabProps {
  guidanceQuery: string;
  setGuidanceQuery: (query: string) => void;
  guidanceLoading: boolean;
  guidanceResult: {
    shloka: Shloka;
    counsel: {
      modernCounsel: string;
      wellbeingInsight: string;
      actionStep: string;
    };
  } | null;
  guidanceError: string | null;
  guidanceRetryTimer?: number;
  onSubmit: (e: React.FormEvent) => void;
  bookmarks: Shloka[];
  onToggleBookmark: (shloka: Shloka) => void;
  lang?: string;
  onSubscribeClick?: () => void;
}

export const GuidanceTab: React.FC<GuidanceTabProps> = ({
  guidanceQuery,
  setGuidanceQuery,
  guidanceLoading,
  guidanceResult,
  guidanceError,
  guidanceRetryTimer,
  onSubmit,
  bookmarks,
  onToggleBookmark,
  lang = 'english',
  onSubscribeClick,
}) => {
  const T = t(lang);
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">{T.guidance.pageTitle}</h2>
        <span className="dashboard-subtitle">{T.guidance.pageSubtitle}</span>
      </div>

      {guidanceError === 'Guest limit reached' ? (
        <div style={{ background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(18, 20, 31, 0.95) 100%)', padding: '4rem 2rem', borderRadius: '20px', border: '1px solid var(--card-border)', marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)', marginBottom: '1.5rem' }}>
            <Lock size={28} />
          </div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem', fontFamily: 'var(--font-display)' }}>Premium Feature</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Subscribe to Krishna Bodha to unlock personalized, AI-powered guidance for your life's challenges based on the timeless wisdom of the Bhagavad Gita.
          </p>
          <button
            onClick={onSubscribeClick}
            className="primary-btn"
            style={{ padding: '0.8rem 2.5rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Sparkles size={18} />
            <span>Subscribe to Unlock</span>
          </button>
        </div>
      ) : (
        <div style={{ background: 'linear-gradient(145deg, var(--bg-secondary) 0%, rgba(18, 20, 31, 0.95) 100%)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--card-border)', marginBottom: '2rem' }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.95rem', color: 'var(--gold-secondary)', marginBottom: '0.5rem' }}>
                {T.guidance.queryLabel}
              </label>
              <textarea
                className="input-field"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  borderRadius: '10px',
                  background: 'rgba(25, 28, 43, 0.3)',
                  borderColor: 'var(--card-border)',
                  resize: 'vertical',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: '1.5'
                }}
                placeholder={T.guidance.queryPlaceholder}
                value={guidanceQuery}
                onChange={(e) => setGuidanceQuery(e.target.value)}
                disabled={guidanceLoading}
              />
            </div>

            <button
              type="submit"
              className="primary-btn"
              disabled={guidanceLoading || !guidanceQuery.trim()}
              style={{ alignSelf: 'flex-start', padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#000', fontWeight: 600, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              {guidanceLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#000' }} />
                  <span>{T.guidance.consultingGita}</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                  <Sparkles size={16} />
                  <span>{T.guidance.seekButton}</span>
                </div>
              )}
            </button>
          </form>

          {guidanceError && guidanceError !== 'Guest limit reached' && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--error)', fontSize: '0.9rem', textAlign: 'center' }}>
              ⚠️ {guidanceError}
              {guidanceRetryTimer !== undefined && guidanceRetryTimer > 0 && (
                <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                  Please try again in {guidanceRetryTimer}s
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {guidanceResult && (
        <div className="shloka-card-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
          <div style={{ textAlign: 'center', margin: '1rem 0 2rem 0' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: 2, color: 'var(--gold-primary)', fontWeight: 600 }}>
              {T.guidance.solutionFound}
            </span>
            <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              {T.guidance.verseSelectedFor}
            </h3>
          </div>

          <div className="shloka-card" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 10px 40px rgba(212, 175, 55, 0.05)' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(/images/${(guidanceResult.shloka.chapter + guidanceResult.shloka.verse) % 3 === 0 ? 'chariot' : (guidanceResult.shloka.chapter + guidanceResult.shloka.verse) % 3 === 1 ? 'discourse' : 'vishwaroopa'}.jpg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.1,
                pointerEvents: 'none',
                zIndex: 0,
                borderRadius: '20px',
                filter: 'blur(1px)'
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="shloka-card-header">
                <span className="shloka-meta" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                  {T.card.chapterVerse(guidanceResult.shloka.chapter, guidanceResult.shloka.verse)}
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <ShlokaShare shloka={guidanceResult.shloka} customCounsel={guidanceResult.counsel} />
                  <button
                    onClick={() => onToggleBookmark(guidanceResult.shloka)}
                    className={`bookmark-icon-btn ${bookmarks.some(b => b.chapter === guidanceResult.shloka.chapter && b.verse === guidanceResult.shloka.verse) ? 'active' : ''}`}
                    title={T.card.addBookmark}
                  >
                    <Bookmark size={22} fill={bookmarks.some(b => b.chapter === guidanceResult.shloka.chapter && b.verse === guidanceResult.shloka.verse) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <div className="shloka-sanskrit" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{guidanceResult.shloka.sanskrit}</div>
              <div className="shloka-transliteration" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{guidanceResult.shloka.transliteration}</div>

              <div className="shloka-translation-box" style={{ background: 'rgba(25, 28, 43, 0.45)', backdropFilter: 'blur(4px)' }}>
                <div className="shloka-translation-label">{T.card.translationLabel}</div>
                <p className="shloka-translation" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{guidanceResult.shloka.translation}</p>
              </div>

              <div className="ai-section">
                <div className="ai-header">
                  <Sparkles size={20} style={{ color: 'var(--gold-primary)' }} />
                  <h3 className="ai-header-title" style={{ color: 'var(--gold-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                    {T.guidance.aiCounselTitle}
                  </h3>
                </div>

                <div className="reflection-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="reflection-card" style={{ background: 'rgba(212, 175, 55, 0.04)', border: '1px solid rgba(212, 175, 55, 0.15)' }}>
                    <div className="reflection-title" style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>
                      <span>{T.guidance.personalizedCounsel}</span>
                    </div>
                    <p className="reflection-text" style={{ color: '#ffffff', fontSize: '1rem', lineHeight: '1.6' }}>"{guidanceResult.counsel.modernCounsel}"</p>
                  </div>

                  <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                      <span>{T.guidance.mentalPeace}</span>
                    </div>
                    <p className="reflection-text" style={{ color: '#e5e7eb' }}>{guidanceResult.counsel.wellbeingInsight}</p>
                  </div>
                </div>

                <div className="mindfulness-banner" style={{ background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.15), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <span className="mindfulness-banner-icon">⚡</span>
                  <div className="mindfulness-content">
                    <span className="mindfulness-title" style={{ color: '#10B981', fontWeight: 600 }}>{T.guidance.actionableStep}</span>
                    <span className="mindfulness-desc" style={{ color: '#ffffff', fontWeight: 500 }}>"{guidanceResult.counsel.actionStep}"</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
