import React, { useRef, useState, useEffect } from 'react';
import { Share2, Sparkles, Brain, Heart } from 'lucide-react';
import type { Shloka } from './ShlokaCard';

interface ShlokaShareProps {
  shloka: Shloka;
  customCounsel?: {
    modernCounsel: string;
    wellbeingInsight: string;
    actionStep: string;
  };
}

export const ShlokaShare: React.FC<ShlokaShareProps> = ({ shloka, customCounsel }) => {
  const shareRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [base64Images, setBase64Images] = useState({ bg: '', logo: '' });

  const artworks = [
    '/images/chariot.jpg',
    '/images/discourse.jpg',
    '/images/vishwaroopa.jpg'
  ];
  const activeArtwork = artworks[(shloka.chapter + shloka.verse) % artworks.length];

  // Pre-load images as Base64 on mount to completely avoid any rendering race condition 
  // when the user clicks share. This guarantees they render properly on mobile.
  useEffect(() => {
    const toDataURL = async (url: string) => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error('Failed to load image as base64', e);
        return '';
      }
    };

    const loadImages = async () => {
      const [bgData, logoData] = await Promise.all([
        toDataURL(activeArtwork),
        toDataURL('/flute-icon.png')
      ]);
      setBase64Images({ bg: bgData, logo: logoData });
    };

    loadImages();
  }, [activeArtwork]);

  const handleShare = async () => {
    if (!shareRef.current) return;
    try {
      setIsSharing(true);
      
      // Wait a tiny bit just to let UI show loading state
      await new Promise(res => setTimeout(res, 100)); 
      
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareRef.current, {
        scale: 1, // we are already 1080x1350, so 1 is fine
        backgroundColor: '#0a0b10',
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `gita-ch${shloka.chapter}-v${shloka.verse}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Krishna Bodha - Ch ${shloka.chapter}, Verse ${shloka.verse}`,
          text: 'Daily wisdom and reflection from Krishna Bodha.',
          files: [file]
        });
      } else {
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

  const hasAI = customCounsel || shloka.reflection;

  return (
    <>
      <button
        onClick={handleShare}
        className="bookmark-icon-btn"
        title="Share as Image"
        aria-label="Share as Image"
        disabled={isSharing}
        style={{ opacity: isSharing ? 0.5 : 1 }}
      >
        <Share2 size={22} />
      </button>

      {/* Shareable Container: 1080x1350 */}
      <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -1000, pointerEvents: 'none' }}>
        <div 
          ref={shareRef}
          style={{
            width: '1080px',
            height: '1350px',
            backgroundColor: '#0a0b10',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '3rem',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          {/* Background Image & Overlay */}
          {base64Images.bg && (
            <img
              src={base64Images.bg}
              alt="background"
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: 0.25,
                zIndex: 0
              }}
            />
          )}
          <div
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: 'linear-gradient(to bottom, rgba(10,11,16,0.3) 0%, rgba(10,11,16,0.9) 100%)',
              zIndex: 0
            }}
          />

          {/* Decorative Border */}
          <div
            style={{
              position: 'absolute', top: '2rem', left: '2rem', right: '2rem', bottom: '2rem',
              border: '2px solid rgba(212, 175, 55, 0.4)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          >
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--gold-primary)' }} />
            <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--gold-primary)' }} />
            <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--gold-primary)' }} />
            <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--gold-primary)' }} />
          </div>

          {/* Content Container */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%' }}>
            
            {/* Header Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                {base64Images.logo && <img src={base64Images.logo} alt="Logo" style={{ width: '40px', height: '40px' }} />}
                <span style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--gold-primary)', fontFamily: 'var(--font-serif)' }}>कृष्णबोध</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '3px', fontFamily: 'var(--font-display)' }}>Krishna Bodha</span>
            </div>

            {/* Chapter Header */}
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '1rem',
              padding: '0.5rem 1.5rem', borderBottom: '1px solid var(--gold-primary)', borderTop: '1px solid var(--gold-primary)',
              marginBottom: '1.5rem'
            }}>
              <Sparkles size={16} color="var(--gold-primary)" />
              <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-primary)', fontSize: '1.1rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
                CHAPTER {shloka.chapter}, VERSE {shloka.verse}
              </span>
              <Sparkles size={16} color="var(--gold-primary)" />
            </div>

            {/* Sanskrit & Transliteration */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', width: '95%' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.5, marginBottom: '0.75rem', whiteSpace: 'pre-line', textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
                {shloka.sanskrit}
              </div>
              <div style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.8)', fontSize: '1.2rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                {shloka.reflection?.translatedTransliteration || shloka.transliteration}
              </div>
            </div>

            {/* Translation Box */}
            <div style={{ 
              width: '95%', background: 'rgba(18, 20, 31, 0.7)', border: '1px solid rgba(212, 175, 55, 0.3)', 
              borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center', position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
                background: '#0a0b10', padding: '0 1rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-display)',
                fontSize: '1rem', letterSpacing: '2px'
              }}>
                TRANSLATION
              </div>
              <p style={{ color: '#ffffff', fontSize: '1.3rem', lineHeight: 1.5 }}>
                {shloka.reflection?.translatedTranslation || shloka.translation}
              </p>
            </div>

            {/* AI Sections */}
            {hasAI && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '95%', flexGrow: 1, justifyContent: 'space-evenly' }}>
                
                {/* Deep Understanding */}
                <div style={{ display: 'flex', gap: '1.25rem', background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1), transparent)', borderLeft: '3px solid var(--gold-primary)', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }}>
                  <Brain size={32} color="var(--gold-primary)" style={{ flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '1px' }}>
                      {customCounsel ? 'PERSONALIZED COUNSEL' : 'AI DEEP UNDERSTANDING'}
                    </span>
                    <span style={{ color: '#e5e7eb', fontSize: '1.1rem', lineHeight: 1.4 }}>
                      {customCounsel ? customCounsel.modernCounsel : shloka.reflection?.modernReflection}
                    </span>
                  </div>
                </div>

                {/* Emotional Wellbeing */}
                <div style={{ display: 'flex', gap: '1.25rem', background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.1), transparent)', borderLeft: '3px solid #a855f7', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }}>
                  <Heart size={32} color="#a855f7" style={{ flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: '#a855f7', fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '1px' }}>EMOTIONAL WELL-BEING</span>
                    <span style={{ color: '#e5e7eb', fontSize: '1.1rem', lineHeight: 1.4 }}>
                      {customCounsel ? customCounsel.wellbeingInsight : shloka.reflection?.emotionalWellbeing}
                    </span>
                  </div>
                </div>

                {/* Mindfulness */}
                <div style={{ display: 'flex', gap: '1.25rem', background: 'linear-gradient(90deg, rgba(34, 197, 94, 0.1), transparent)', borderLeft: '3px solid #22c55e', padding: '1rem 1.25rem', borderRadius: '0 12px 12px 0' }}>
                  <span style={{ fontSize: '2rem', flexShrink: 0 }}>🧘</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ color: '#22c55e', fontFamily: 'var(--font-display)', fontSize: '1rem', letterSpacing: '1px' }}>
                      {customCounsel ? 'ACTIONABLE STEP' : 'MINDFUL PRACTICE FOR TODAY'}
                    </span>
                    <span style={{ color: '#e5e7eb', fontSize: '1.1rem', lineHeight: 1.4, fontStyle: 'italic' }}>
                      "{customCounsel ? customCounsel.actionStep : shloka.reflection?.mindfulnessTip}"
                    </span>
                  </div>
                </div>

              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '1rem', textAlign: 'center', width: '100%' }}>
              <span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', display: 'block' }}>
                with ❤️ by Sameer Joshi
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
