import React from 'react';

export interface Chapter {
  chapterNumber: number;
  theme: string;
  verses: number[];
}

interface BrowseTabProps {
  chapters: Chapter[];
  onVerseSelect: (chapterNumber: number, verse: number) => void;
}

export const BrowseTab: React.FC<BrowseTabProps> = ({ chapters, onVerseSelect }) => {
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">Browse Gita Chapters</h2>
        <span className="dashboard-subtitle">Explore the wisdom of the Bhagavad Gita by chapter and verse.</span>
      </div>

      <div className="chapters-grid">
        {chapters.map((ch) => (
          <div key={ch.chapterNumber} className="chapter-card">
            <span className="chapter-number">Chapter {ch.chapterNumber}</span>
            <h3 className="chapter-theme">{ch.theme}</h3>
            <div className="verses-list">
              {ch.verses.map((verse) => (
                <button 
                  key={verse} 
                  onClick={() => onVerseSelect(ch.chapterNumber, verse)}
                  className="verse-tag"
                >
                  Verse {verse}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
