import React, { useRef, useState } from 'react';
import { Bookmark, Sparkles, Brain, Heart, Briefcase, Share2 } from 'lucide-react';
import { t } from '../i18n';

export interface Reflection {
  modernReflection: string;
  emotionalWellbeing: string;
  careerApplication: string;
  mindfulnessTip: string;
  translatedTranslation?: string;
  translatedTransliteration?: string;
}

export interface Shloka {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration: string;
  translation: string;
  theme: string;
  topics: string[];
  reflection?: Reflection;
}

interface ShlokaCardProps {
  shloka: Shloka;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  lang?: string;
}

export const ShlokaCard: React.FC<ShlokaCardProps> = ({
  shloka,
  isBookmarked,
  onToggleBookmark,
  lang = 'english',
}) => {
  const T = t(lang);
  const { reflection } = shloka;

  const artworks = [
    '/images/chariot.jpg',
    '/images/discourse.jpg',
    '/images/vishwaroopa.jpg'
  ];
  const activeArtwork = artworks[(shloka.chapter + shloka.verse) % artworks.length];

  const cardRef = useRef<HTMLDivElement>(null);
  const shareRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!shareRef.current) return;
    try {
      setIsSharing(true);
      // Brief timeout to ensure the DOM is ready
      await new Promise(res => setTimeout(res, 100));
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(shareRef.current, {
        quality: 1.0,
        backgroundColor: '#0a0b10',
        pixelRatio: 3,
        style: {
          transform: 'scale(1)',
          margin: '0'
        }
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `gita-ch${shloka.chapter}-v${shloka.verse}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Krishna Bodha - Ch ${shloka.chapter}, Verse ${shloka.verse}`,
          text: 'Daily wisdom and reflection from Krishna Bodha.',
          files: [file]
        });
      } else {
        // Fallback: download
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to share image', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
    <div className="shloka-card" ref={cardRef} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Subtle background image watermark */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${activeArtwork})`,
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
            {T.card.chapterVerse(shloka.chapter, shloka.verse)}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleShare}
              className="bookmark-icon-btn"
              title="Share as Image"
              aria-label="Share as Image"
            >
              <Share2 size={22} />
            </button>
            <button
              onClick={onToggleBookmark}
              className={`bookmark-icon-btn ${isBookmarked ? 'active' : ''}`}
              title={isBookmarked ? T.card.removeBookmark : T.card.addBookmark}
              aria-label={isBookmarked ? T.card.removeBookmark : T.card.addBookmark}
            >
              <Bookmark size={22} fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        <div className="shloka-sanskrit" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{shloka.sanskrit}</div>
        <div className="shloka-transliteration" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{reflection?.translatedTransliteration || shloka.transliteration}</div>

        <div className="shloka-translation-box" style={{ background: 'rgba(25, 28, 43, 0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="shloka-translation-label">{T.card.translationLabel}</div>
          <p className="shloka-translation" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{reflection?.translatedTranslation || shloka.translation}</p>
        </div>

        {reflection && (
          <div className="ai-section">
            <div className="ai-header">
              <Sparkles size={20} style={{ color: 'var(--gold-primary)' }} />
              <h3 className="ai-header-title" style={{ color: 'var(--gold-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                {T.card.aiDeepUnderstanding}
              </h3>
            </div>

            <div className="reflection-grid">
              <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                  <Brain size={16} />
                  <span>{T.card.modernRelevance}</span>
                </div>
                <p className="reflection-text" style={{ color: '#e5e7eb' }}>{reflection.modernReflection}</p>
              </div>

              <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                  <Heart size={16} />
                  <span>{T.card.emotionalWellbeing}</span>
                </div>
                <p className="reflection-text" style={{ color: '#e5e7eb' }}>{reflection.emotionalWellbeing}</p>
              </div>

              <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                  <Briefcase size={16} />
                  <span>{T.card.careerFocus}</span>
                </div>
                <p className="reflection-text" style={{ color: '#e5e7eb' }}>{reflection.careerApplication}</p>
              </div>
            </div>

            <div className="mindfulness-banner" style={{ background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <span className="mindfulness-banner-icon">🧘</span>
              <div className="mindfulness-content">
                <span className="mindfulness-title" style={{ color: 'var(--gold-secondary)' }}>{T.card.mindfulPractice}</span>
                <span className="mindfulness-desc" style={{ color: '#ffffff', fontStyle: 'italic' }}>"{reflection.mindfulnessTip}"</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Hidden Shareable Container (Exact Browser UI without extra AI cards) */}
    <div 
      ref={shareRef}
      className="shloka-card"
      style={{
        position: 'absolute',
        top: '-10000px',
        left: '-10000px',
        width: '400px',
        overflow: 'hidden',
        padding: '1.5rem',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${activeArtwork})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: 0,
          filter: 'blur(1px)'
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <img src="/flute-icon.png" alt="Krishna Bodha Logo" style={{ width: '40px', height: '40px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold-primary)' }}>कृष्णबोध</span>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>Krishna Bodha</span>
          </div>
        </div>

        <div className="shloka-card-header" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
          <span className="shloka-meta" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: '1rem' }}>
            {T.card.chapterVerse(shloka.chapter, shloka.verse)}
          </span>
        </div>

        <div className="shloka-sanskrit" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{shloka.sanskrit}</div>
        <div className="shloka-transliteration" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{reflection?.translatedTransliteration || shloka.transliteration}</div>

        <div className="shloka-translation-box" style={{ background: 'rgba(25, 28, 43, 0.45)', backdropFilter: 'blur(4px)', marginTop: '1.5rem' }}>
          <div className="shloka-translation-label">{T.card.translationLabel}</div>
          <p className="shloka-translation" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{reflection?.translatedTranslation || shloka.translation}</p>
        </div>

        {reflection?.mindfulnessTip && (
          <div className="mindfulness-banner" style={{ background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(212, 175, 55, 0.2)', marginTop: '1.5rem' }}>
            <span className="mindfulness-banner-icon">🧘</span>
            <div className="mindfulness-content">
              <span className="mindfulness-title" style={{ color: 'var(--gold-secondary)' }}>{T.card.mindfulPractice}</span>
              <span className="mindfulness-desc" style={{ color: '#ffffff', fontStyle: 'italic' }}>"{reflection.mindfulnessTip}"</span>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>with ❤️ by Sameer Joshi</p>
        </div>
      </div>
    </div>
    </>
  );
};
