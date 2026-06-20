import React from 'react';
import { t } from '../i18n';

export interface Chapter {
  chapterNumber: number;
  theme: string;
  verses: number[];
}

interface BrowseTabProps {
  chapters: Chapter[];
  onVerseSelect: (chapterNumber: number, verse: number) => void;
  lang?: string;
}

export const BrowseTab: React.FC<BrowseTabProps> = ({ chapters, onVerseSelect, lang = 'english' }) => {
  const T = t(lang);
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">{T.browse.pageTitle}</h2>
        <span className="dashboard-subtitle">{T.browse.pageSubtitle}</span>
      </div>

      <div className="chapters-grid">
        {chapters.map((ch) => (
          <div key={ch.chapterNumber} className="chapter-card">
            <span className="chapter-number">{T.browse.chapter} {ch.chapterNumber}</span>
            <h3 className="chapter-theme">{ch.theme}</h3>
            <div className="verses-list">
              {ch.verses.map((verse) => (
                <button
                  key={verse}
                  onClick={() => onVerseSelect(ch.chapterNumber, verse)}
                  className="verse-tag"
                >
                  {T.browse.verse} {verse}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
