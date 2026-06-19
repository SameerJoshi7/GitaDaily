import React from 'react';
import { Bookmark, TrendingUp } from 'lucide-react';
import type { Shloka } from './ShlokaCard';

interface BookmarksTabProps {
  bookmarks: Shloka[];
  onToggleBookmark: (shloka: Shloka) => void;
  onBookmarkSelect: (chapter: number, verse: number) => void;
}

export const BookmarksTab: React.FC<BookmarksTabProps> = ({ bookmarks, onToggleBookmark, onBookmarkSelect }) => {
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">My Bookmarks</h2>
        <span className="dashboard-subtitle">Your saved verses for quick reflection and meditation.</span>
      </div>

      {bookmarks.length > 0 ? (
        <div className="bookmarks-grid">
          {bookmarks.map((s, idx) => (
            <div 
              key={idx} 
              className="bookmark-card"
              onClick={() => onBookmarkSelect(s.chapter, s.verse)}
            >
              <div>
                <div className="bookmark-header">
                  <span className="bookmark-title">Chapter {s.chapter}, Verse {s.verse}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(s);
                    }}
                    className="remove-bookmark-btn"
                    title="Remove bookmark"
                  >
                    <Bookmark size={16} fill="currentColor" />
                  </button>
                </div>
                <p className="bookmark-body">"{s.translation}"</p>
              </div>
              <div className="bookmark-footer">
                <TrendingUp size={14} />
                <span>{s.theme}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">🔖</span>
          <p>No bookmarked verses yet. Go to Daily Insight or Browse to bookmark verses that speak to you.</p>
        </div>
      )}
    </div>
  );
};
