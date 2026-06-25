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
        top: '-10000px',
        left: '-10000px',
        width: '1080px',
        height: '1920px',
        backgroundColor: '#0a0b10',
        display: 'flex',
        flexDirection: 'column',
        padding: '80px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
        overflow: 'hidden'
      }}
    >
      {/* Background Image Overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url(${activeArtwork})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        zIndex: 0,
        filter: 'blur(4px)'
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* TOP: Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '50px' }}>
           <img src="/flute-icon.png" alt="Krishna Bodha" style={{ width: '90px', height: '90px', filter: 'drop-shadow(0 0 15px rgba(212, 175, 55, 0.8))' }} />
           <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
             <h2 style={{ color: '#fbbf24', fontSize: '36px', letterSpacing: '6px', textTransform: 'uppercase', margin: 0, fontWeight: 700 }}>Chapter {shloka.chapter}</h2>
             <h3 style={{ color: '#ffffff', fontSize: '26px', letterSpacing: '4px', textTransform: 'uppercase', margin: '8px 0 0 0', fontWeight: 400, opacity: 0.8 }}>Verse {shloka.verse}</h3>
           </div>
        </div>

        {/* VERSES */}
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <div style={{ fontSize: '52px', fontWeight: 'bold', color: '#fbbf24', lineHeight: 1.4, fontFamily: "'Rozha One', 'Georgia', serif", textShadow: '0 4px 12px rgba(0,0,0,0.8)', marginBottom: '24px' }}>
            {shloka.sanskrit}
          </div>
          
          <div style={{ fontSize: '28px', fontStyle: 'italic', color: '#e5e7eb', lineHeight: 1.5, padding: '0 40px', opacity: 0.9 }}>
            {reflection?.translatedTransliteration || shloka.transliteration}
          </div>
        </div>

        {/* TRANSLATION */}
        <div style={{ backgroundColor: 'rgba(20, 22, 35, 0.8)', backdropFilter: 'blur(12px)', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '24px', padding: '40px', textAlign: 'center', marginBottom: '50px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: '22px', color: '#fbbf24', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '20px', fontWeight: 600 }}>Translation</div>
          <p style={{ fontSize: '32px', color: '#ffffff', lineHeight: 1.6, margin: 0, fontWeight: 300 }}>{reflection?.translatedTranslation || shloka.translation}</p>
        </div>
        
        {/* AI SECTION */}
        {reflection && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '30px' }}>
              <span style={{ fontSize: '32px' }}>✨</span>
              <h3 style={{ color: '#fbbf24', fontSize: '30px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0, fontWeight: 600 }}>AI Deep Understanding</h3>
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24', marginBottom: '20px', fontSize: '24px', fontWeight: 600 }}>
                  🧠 Modern
                </div>
                <p style={{ color: '#e5e7eb', fontSize: '22px', lineHeight: 1.5, margin: 0 }}>{reflection.modernReflection}</p>
              </div>

              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24', marginBottom: '20px', fontSize: '24px', fontWeight: 600 }}>
                  ❤️ Emotional
                </div>
                <p style={{ color: '#e5e7eb', fontSize: '22px', lineHeight: 1.5, margin: 0 }}>{reflection.emotionalWellbeing}</p>
              </div>

              <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24', marginBottom: '20px', fontSize: '24px', fontWeight: 600 }}>
                  💼 Career
                </div>
                <p style={{ color: '#e5e7eb', fontSize: '22px', lineHeight: 1.5, margin: 0 }}>{reflection.careerApplication}</p>
              </div>
            </div>

            <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.12)', border: '1px solid rgba(212, 175, 55, 0.3)', borderRadius: '24px', padding: '35px', textAlign: 'center', marginTop: 'auto' }}>
              <div style={{ color: '#fbbf24', fontSize: '24px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '15px' }}>🧘 Mindful Practice</div>
              <p style={{ fontSize: '30px', color: '#ffffff', fontStyle: 'italic', margin: 0, fontWeight: 300 }}>"{reflection.mindfulnessTip}"</p>
            </div>
          </div>
        )}

        {/* BOTTOM: Footer */}
        <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <span style={{ fontFamily: "'Rozha One', 'Georgia', serif", color: '#fbbf24', fontSize: '42px', fontWeight: 'bold', letterSpacing: '4px' }}>KRISHNA BODHA</span>
          <p style={{ margin: '15px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: '24px', letterSpacing: '1px' }}>with love by Sameer Joshi</p>
        </div>
      </div>
    </div>
    </>
  );
};
