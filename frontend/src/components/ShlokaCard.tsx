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
        width: 1080,
        height: 1920,
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

    {/* Hidden Shareable Container for 1080x1920 (9:16) Instagram/WhatsApp Status format */}
    <div 
      ref={shareRef}
      style={{
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        width: '1080px',
        height: '1920px',
        backgroundColor: '#050508',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '100px 80px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif"
      }}
    >
      {/* Background Image Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url(${activeArtwork})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.12,
        zIndex: 0
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* TOP: Header */}
        <div style={{ textAlign: 'center', marginBottom: 'auto' }}>
           <img src="/flute-icon.png" alt="Krishna Bodha" style={{ width: '100px', height: '100px', filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.6))', marginBottom: '30px', mixBlendMode: 'screen' }} />
           <h2 style={{ color: '#fbbf24', fontSize: '36px', letterSpacing: '4px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Chapter {shloka.chapter}, Verse {shloka.verse}</h2>
        </div>

        {/* MIDDLE: Sanskrit & Translation */}
        <div style={{ textAlign: 'center', margin: 'auto 0' }}>
          <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#fbbf24', lineHeight: 1.5, fontFamily: "'Rozha One', 'Georgia', serif", textShadow: '0 4px 12px rgba(0,0,0,0.8)', marginBottom: '40px' }}>
            {shloka.sanskrit}
          </div>
          
          <div style={{ fontSize: '32px', fontStyle: 'italic', color: '#9ca3af', lineHeight: 1.5, marginBottom: '80px', padding: '0 40px' }}>
            {reflection?.translatedTransliteration || shloka.transliteration}
          </div>

          <div style={{ backgroundColor: 'rgba(25, 28, 43, 0.8)', border: '2px solid rgba(255, 255, 255, 0.05)', borderRadius: '24px', padding: '50px', textAlign: 'left', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: '22px', color: '#fbbf24', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600 }}>Translation</div>
            <p style={{ fontSize: '34px', color: '#ffffff', lineHeight: 1.6, margin: 0 }}>{reflection?.translatedTranslation || shloka.translation}</p>
          </div>
          
          {reflection?.mindfulnessTip && (
            <div style={{ marginTop: '60px', backgroundColor: 'rgba(212, 175, 55, 0.08)', border: '2px solid rgba(212, 175, 55, 0.2)', borderRadius: '24px', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧘</div>
              <div style={{ color: '#fbbf24', fontSize: '26px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '15px' }}>Mindful Practice</div>
              <p style={{ fontSize: '30px', color: '#ffffff', fontStyle: 'italic', margin: 0 }}>"{reflection.mindfulnessTip}"</p>
            </div>
          )}
        </div>

        {/* BOTTOM: Footer */}
        <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '50px', borderTop: '2px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-primary)', fontSize: '42px', fontWeight: 'bold', letterSpacing: '3px' }}>KRISHNA BODHA</span>
          <p style={{ margin: '20px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: '26px' }}>with love by Sameer Joshi</p>
        </div>
      </div>
    </div>
    </>
  );
};
