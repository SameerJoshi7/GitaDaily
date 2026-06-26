import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import type { Shloka } from './ShlokaCard';
import { t } from '../i18n';

interface SearchTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Shloka[];
  activeTopic: string | null;
  topics: string[];
  onTopicClick: (topic: string) => void;
  onSearchSubmit: (queryStr: string) => void;
  onVerseSelect: (chapter: number, verse: number) => void;
  lang?: string;
  searchError?: string | null;
  searchRetryTimer?: number;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  activeTopic,
  topics,
  onTopicClick,
  onSearchSubmit,
  onVerseSelect,
  lang = 'english',
  searchError,
  searchRetryTimer,
}) => {
  const T = t(lang);
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">{T.search.pageTitle}</h2>
        <span className="dashboard-subtitle">{T.search.pageSubtitle}</span>
      </div>

      <div className="search-container">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder={T.search.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchSubmit(e.target.value);
            }}
          />
        </div>

        {searchError && (
          <div style={{ margin: '1rem 0', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: 'var(--error)', fontSize: '0.9rem', textAlign: 'center' }}>
            ⚠️ {searchError}
            {searchRetryTimer !== undefined && searchRetryTimer > 0 && (
              <div style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                Please try again in {searchRetryTimer}s
              </div>
            )}
          </div>
        )}

        <div className="topic-filters">
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => onTopicClick(topic)}
              className={`topic-pill ${activeTopic === topic ? 'active' : ''}`}
            >
              #{topic}
            </button>
          ))}
        </div>

        <div className="search-results-list">
          {searchResults.map((s, idx) => (
            <div
              key={idx}
              className="search-result-row"
              onClick={() => onVerseSelect(s.chapter, s.verse)}
            >
              <div className="result-info">
                <span className="result-meta">{T.search.chapterVerse(s.chapter, s.verse)}</span>
                <p className="result-text">{s.translation}</p>
              </div>
              <ArrowRight size={16} className="arrow-right-icon" />
            </div>
          ))}

          {searchQuery && searchResults.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <p>{T.search.noResults}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
