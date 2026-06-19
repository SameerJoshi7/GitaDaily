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

  return (
    <div className="shloka-card">
      <div className="shloka-card-header">
        <span className="shloka-meta">Chapter {shloka.chapter}, Verse {shloka.verse}</span>
        <button 
          onClick={onToggleBookmark} 
          className={`bookmark-icon-btn ${isBookmarked ? 'active' : ''}`}
          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Shloka'}
          aria-label={isBookmarked ? 'Remove Bookmark' : 'Bookmark Shloka'}
        >
          <Bookmark size={22} fill={isBookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="shloka-sanskrit">{shloka.sanskrit}</div>
      <div className="shloka-transliteration">{shloka.transliteration}</div>

      <div className="shloka-translation-box">
        <div className="shloka-translation-label">English Translation</div>
        <p className="shloka-translation">{shloka.translation}</p>
      </div>

      {reflection && (
        <div className="ai-section">
          <div className="ai-header">
            <Sparkles size={20} />
            <h3 className="ai-header-title">AI Deep Understanding</h3>
          </div>

          <div className="reflection-grid">
            <div className="reflection-card">
              <div className="reflection-title">
                <Brain size={16} />
                <span>Modern Relevance</span>
              </div>
              <p className="reflection-text">{reflection.modernReflection}</p>
            </div>

            <div className="reflection-card">
              <div className="reflection-title">
                <Heart size={16} />
                <span>Emotional Well-being</span>
              </div>
              <p className="reflection-text">{reflection.emotionalWellbeing}</p>
            </div>

            <div className="reflection-card">
              <div className="reflection-title">
                <Briefcase size={16} />
                <span>Career & Focus</span>
              </div>
              <p className="reflection-text">{reflection.careerApplication}</p>
            </div>
          </div>

          <div className="mindfulness-banner">
            <span className="mindfulness-banner-icon">🧘</span>
            <div className="mindfulness-content">
              <span className="mindfulness-title">Mindful Practice for Today</span>
              <span className="mindfulness-desc">"{reflection.mindfulnessTip}"</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
