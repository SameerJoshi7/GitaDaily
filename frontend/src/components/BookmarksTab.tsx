import React from 'react';
import { Bookmark, TrendingUp } from 'lucide-react';
import type { Shloka } from './ShlokaCard';
import { t } from '../i18n';

interface BookmarksTabProps {
  bookmarks: Shloka[];
  onToggleBookmark: (shloka: Shloka) => void;
  onBookmarkSelect: (chapter: number, verse: number) => void;
  lang?: string;
}

export const BookmarksTab: React.FC<BookmarksTabProps> = ({
  bookmarks,
  onToggleBookmark,
  onBookmarkSelect,
  lang = 'english',
}) => {
  const T = t(lang);
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">{T.bookmarks.pageTitle}</h2>
        <span className="dashboard-subtitle">{T.bookmarks.pageSubtitle}</span>
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
                  <span className="bookmark-title">{T.bookmarks.chapterVerse(s.chapter, s.verse)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleBookmark(s);
                    }}
                    className="remove-bookmark-btn"
                    title={T.bookmarks.removeBookmark}
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
          <p>{T.bookmarks.emptyState}</p>
        </div>
      )}
    </div>
  );
};
