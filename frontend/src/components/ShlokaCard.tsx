import React from 'react';
import { Bookmark, Sparkles, Brain, Heart, Briefcase } from 'lucide-react';

export interface Reflection {
  modernReflection: string;
  emotionalWellbeing: string;
  careerApplication: string;
  mindfulnessTip: string;
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
}

export const ShlokaCard: React.FC<ShlokaCardProps> = ({
  shloka,
  isBookmarked,
  onToggleBookmark,
}) => {
  const { reflection } = shloka;

  const artworks = [
    '/images/chariot.jpg',
    '/images/discourse.jpg',
    '/images/vishwaroopa.jpg'
  ];
  const activeArtwork = artworks[(shloka.chapter + shloka.verse) % artworks.length];

  return (
    <div className="shloka-card" style={{ position: 'relative', overflow: 'hidden' }}>
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
          <span className="shloka-meta" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Chapter {shloka.chapter}, Verse {shloka.verse}</span>
          <button 
            onClick={onToggleBookmark} 
            className={`bookmark-icon-btn ${isBookmarked ? 'active' : ''}`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Shloka'}
            aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Shloka'}
          >
            <Bookmark size={22} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        <div className="shloka-sanskrit" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>{shloka.sanskrit}</div>
        <div className="shloka-transliteration" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{shloka.transliteration}</div>

        <div className="shloka-translation-box" style={{ background: 'rgba(25, 28, 43, 0.45)', backdropFilter: 'blur(4px)' }}>
          <div className="shloka-translation-label">English Translation</div>
          <p className="shloka-translation" style={{ color: '#ffffff', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{shloka.translation}</p>
        </div>

        {reflection && (
          <div className="ai-section">
            <div className="ai-header">
              <Sparkles size={20} style={{ color: 'var(--gold-primary)' }} />
              <h3 className="ai-header-title" style={{ color: 'var(--gold-primary)', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>AI Deep Understanding</h3>
            </div>

            <div className="reflection-grid">
              <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                  <Brain size={16} />
                  <span>Modern Relevance</span>
                </div>
                <p className="reflection-text" style={{ color: '#e5e7eb' }}>{reflection.modernReflection}</p>
              </div>

              <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                  <Heart size={16} />
                  <span>Emotional Well-being</span>
                </div>
                <p className="reflection-text" style={{ color: '#e5e7eb' }}>{reflection.emotionalWellbeing}</p>
              </div>

              <div className="reflection-card" style={{ background: 'rgba(18, 20, 31, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="reflection-title" style={{ color: 'var(--gold-secondary)' }}>
                  <Briefcase size={16} />
                  <span>Career & Focus</span>
                </div>
                <p className="reflection-text" style={{ color: '#e5e7eb' }}>{reflection.careerApplication}</p>
              </div>
            </div>

            <div className="mindfulness-banner" style={{ background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.1), rgba(79, 70, 229, 0.05))', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <span className="mindfulness-banner-icon">🧘</span>
              <div className="mindfulness-content">
                <span className="mindfulness-title" style={{ color: 'var(--gold-secondary)' }}>Mindful Practice for Today</span>
                <span className="mindfulness-desc" style={{ color: '#ffffff', fontStyle: 'italic' }}>"{reflection.mindfulnessTip}"</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
