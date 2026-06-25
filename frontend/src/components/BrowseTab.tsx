import React, { useState, useEffect } from 'react';
import { Bookmark, ArrowLeft, ChevronLeft, ChevronRight, Loader2, Sparkles, Heart, Compass } from 'lucide-react';
import { t } from '../i18n';
import type { Shloka } from './ShlokaCard';
import { ShlokaShare } from './ShlokaShare';

export interface Chapter {
  chapterNumber: number;
  theme: string;
  verses: number[];
}

interface BrowseTabProps {
  chapters: Chapter[];
  lang?: string;
  bookmarks: Shloka[];
  onToggleBookmark: (shloka: Shloka) => void;
  email: string;
  apiBase: string;
  browseChapterNumber?: number | null;
  browseVerseNumber?: number | null;
  readingHistory?: { chapter: number, verse: number } | null;
}

export const BrowseTab: React.FC<BrowseTabProps> = ({
  chapters,
  lang = 'english',
  bookmarks = [],
  onToggleBookmark,
  email,
  apiBase,
  browseChapterNumber,
  browseVerseNumber,
  readingHistory
}) => {
  const T = t(lang);

  const getNavLabels = (l: string) => {
    switch (l.toLowerCase()) {
      case 'hindi': return { prev: 'पिछला श्लोक', next: 'अगला श्लोक' };
      case 'telugu': return { prev: 'మునుపటి శ్లోకం', next: 'తదుపరి శ్లోకం' };
      case 'kannada': return { prev: 'ಹಿಂದಿನ ಶ್ಲೋಕ', next: 'ಮುಂದಿನ ಶ್ಲೋಕ' };
      default: return { prev: 'Previous Verse', next: 'Next Verse' };
    }
  };
  const navLabels = getNavLabels(lang);

  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentVerse, setCurrentVerse] = useState<number>(1);
  const [shloka, setShloka] = useState<Shloka | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with url-based routing props
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (browseChapterNumber !== null && browseChapterNumber !== undefined) {
      if (chapters.length > 0) {
        const found = chapters.find((ch) => ch.chapterNumber === browseChapterNumber);
        if (found) {
          setSelectedChapter(found);
          if (browseVerseNumber !== null && browseVerseNumber !== undefined) {
            setCurrentVerse(browseVerseNumber);
          } else {
            setCurrentVerse(1);
          }
        }
      }
    } else {
      setSelectedChapter(null);
      setCurrentVerse(1);
      setShloka(null);
      setError(null);
    }
  }, [browseChapterNumber, browseVerseNumber, chapters]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch specific verse details from the API
  useEffect(() => {
    if (!selectedChapter) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShloka(null);
      return;
    }

    const fetchVerse = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${apiBase}/shloka/${selectedChapter.chapterNumber}/${currentVerse}?email=${encodeURIComponent(email)}&lang=${lang}`
        );
        if (!res.ok) {
          throw new Error('Failed to retrieve shloka details. Please try again.');
        }
        const data = await res.json();
        setShloka(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error occurred';
        console.error('Error fetching shloka:', err);
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchVerse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapter, currentVerse, email, apiBase]);

  // Handle chapter selection
  const handleChapterClick = (chapter: Chapter) => {
    // eslint-disable-next-line react-hooks/immutability
    window.location.hash = `#/browse/chapter/${chapter.chapterNumber}/verse/1`;
  };

  // Navigation handlers
  const handleNext = () => {
    if (!selectedChapter) return;
    if (currentVerse < selectedChapter.verses.length) {
      window.location.hash = `#/browse/chapter/${selectedChapter.chapterNumber}/verse/${currentVerse + 1}`;
    }
  };

  const handlePrev = () => {
    if (!selectedChapter) return;
    if (currentVerse > 1) {
      window.location.hash = `#/browse/chapter/${selectedChapter.chapterNumber}/verse/${currentVerse - 1}`;
    }
  };

  const handleVerseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedChapter) return;
    window.location.hash = `#/browse/chapter/${selectedChapter.chapterNumber}/verse/${e.target.value}`;
  };

  const handleBackToChapters = () => {
    window.location.hash = '#/browsechapters';
  };

  const isBookmarked = shloka
    ? bookmarks.some((b) => b.chapter === shloka.chapter && b.verse === shloka.verse)
    : false;

  // Render main chapter list
  if (!selectedChapter) {
    return (
      <div>
        <div className="dashboard-header">
          <h2 className="dashboard-title">{T.browse.pageTitle}</h2>
          <span className="dashboard-subtitle">{T.browse.pageSubtitle}</span>
        </div>

        {readingHistory && (
          <div 
            onClick={() => window.location.hash = `#/browse/chapter/${readingHistory.chapter}/verse/${readingHistory.verse}`}
            style={{
              background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.05) 100%)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.3s ease',
              animation: 'fadeIn 0.5s ease'
            }}
            className="continue-reading-banner"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(212, 175, 55, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
                <Bookmark size={24} color="var(--gold-primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Continue Reading</h3>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {T.browse.chapter} {readingHistory.chapter}, {T.browse.verse} {readingHistory.verse}
                </span>
              </div>
            </div>
            <ChevronRight size={24} color="var(--gold-primary)" />
          </div>
        )}

        <div className="chapters-grid">
          {chapters.map((ch) => (
            <div
              key={ch.chapterNumber}
              className="chapter-card"
              onClick={() => handleChapterClick(ch)}
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
            >
              <span className="chapter-number">
                {T.browse.chapter} {ch.chapterNumber}
              </span>
              <h3 className="chapter-theme" style={{ color: 'var(--gold-primary)', minHeight: '3rem' }}>
                {ch.theme}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {ch.verses.length} {T.browse.verse}s
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render detail paginated view for a selected chapter
  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={handleBackToChapters}
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
          title="Back to Chapters"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="dashboard-title">{selectedChapter.theme}</h2>
          <span className="dashboard-subtitle">
            {T.browse.chapter} {selectedChapter.chapterNumber}
          </span>
        </div>
      </div>

      {/* Pagination controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-secondary)',
          padding: '0.75rem 1.25rem',
          borderRadius: '12px',
          border: '1px solid var(--card-border)',
          marginBottom: '1.5rem',
          gap: '1rem',
        }}
      >
        <button
          onClick={handlePrev}
          disabled={currentVerse === 1 || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            background: 'transparent',
            border: 'none',
            color: currentVerse === 1 ? 'var(--text-muted)' : 'var(--gold-primary)',
            cursor: currentVerse === 1 ? 'default' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={18} />
          {navLabels.prev}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{T.browse.verse}:</span>
          <select
            value={currentVerse}
            onChange={handleVerseChange}
            disabled={loading}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              color: 'var(--text-primary)',
              border: '1px solid var(--card-border)',
              borderRadius: '6px',
              padding: '0.25rem 0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            {selectedChapter.verses.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            of {selectedChapter.verses.length}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentVerse === selectedChapter.verses.length || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            background: 'transparent',
            border: 'none',
            color: currentVerse === selectedChapter.verses.length ? 'var(--text-muted)' : 'var(--gold-primary)',
            cursor: currentVerse === selectedChapter.verses.length ? 'default' : 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          {navLabels.next}
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0' }}>
          <Loader2 className="spinner" size={36} style={{ color: 'var(--gold-primary)', marginBottom: '1rem' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Loading Shloka Details...</span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', color: 'var(--error)', textAlign: 'center' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Detail card */}
      {shloka && !loading && !error && (
        <div className="shloka-card-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
          <div className="shloka-card" style={{ position: 'relative', overflow: 'hidden', border: '1px solid rgba(212, 175, 55, 0.25)', boxShadow: '0 10px 40px rgba(212, 175, 55, 0.05)' }}>
            
            {/* Background Illustration Overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(/images/${(shloka.chapter + shloka.verse) % 3 === 0 ? 'chariot' : (shloka.chapter + shloka.verse) % 3 === 1 ? 'discourse' : 'vishwaroopa'}.jpg)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.07,
                pointerEvents: 'none',
                zIndex: 0,
                borderRadius: '20px',
                filter: 'blur(1px)'
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="shloka-card-header">
                <span className="shloka-meta" style={{ color: 'var(--gold-primary)', fontWeight: 600 }}>
                  {T.card.chapterVerse(shloka.chapter, shloka.verse)}
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <ShlokaShare shloka={shloka} />
                  <button
                    onClick={() => onToggleBookmark(shloka)}
                    className={`bookmark-icon-btn ${isBookmarked ? 'active' : ''}`}
                    title={T.card.addBookmark}
                  >
                    <Bookmark size={22} fill={isBookmarked ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>

              <div className="shloka-sanskrit" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                {shloka.sanskrit}
              </div>
              <div className="shloka-transliteration" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                {shloka.reflection?.translatedTransliteration || shloka.transliteration}
              </div>

              <div className="shloka-translation-box" style={{ background: 'rgba(25, 28, 43, 0.45)', backdropFilter: 'blur(4px)' }}>
                <div className="shloka-translation-label">{T.card.translationLabel}</div>
                <p className="shloka-translation" style={{ color: '#ffffff' }}>
                  {shloka.reflection?.translatedTranslation || shloka.translation}
                </p>
              </div>

              {/* Reflection / Guidance section (styled like a friendly talk card) */}
              <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                {/* Modern counsel - friendly tone */}
                <div style={{ background: 'rgba(212, 175, 55, 0.04)', borderLeft: '3px solid var(--gold-primary)', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gold-primary)', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Sparkles size={16} />
                    <span>{T.card.aiDeepUnderstanding}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {shloka.reflection?.modernReflection}
                  </p>
                </div>

                {/* Emotional wellbeing */}
                <div style={{ background: 'rgba(79, 70, 229, 0.04)', borderLeft: '3px solid #6366f1', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Heart size={16} />
                    <span>{T.card.emotionalWellbeing}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {shloka.reflection?.emotionalWellbeing}
                  </p>
                </div>

                {/* Action step / Mindfulness practice */}
                <div style={{ background: 'rgba(16, 185, 129, 0.04)', borderLeft: '3px solid #10b981', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    <Compass size={16} />
                    <span>{T.card.mindfulPractice}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: '1.6' }}>
                    {shloka.reflection?.mindfulnessTip}
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
