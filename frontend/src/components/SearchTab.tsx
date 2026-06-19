import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import type { Shloka } from './ShlokaCard';

interface SearchTabProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: Shloka[];
  activeTopic: string | null;
  topics: string[];
  onTopicClick: (topic: string) => void;
  onSearchSubmit: (queryStr: string) => void;
  onVerseSelect: (chapter: number, verse: number) => void;
}

export const SearchTab: React.FC<SearchTabProps> = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  activeTopic,
  topics,
  onTopicClick,
  onSearchSubmit,
  onVerseSelect
}) => {
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">Search & Explore</h2>
        <span className="dashboard-subtitle">Search by keyword or select a topic below to discover relevant guidance.</span>
      </div>

      <div className="search-container">
        <div className="search-bar-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="input-field search-input"
            placeholder="Search keywords, chapter theme, translation content..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearchSubmit(e.target.value);
            }}
          />
        </div>

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
                <span className="result-meta">Chapter {s.chapter}, Verse {s.verse}</span>
                <p className="result-text">{s.translation}</p>
              </div>
              <ArrowRight size={16} className="arrow-right-icon" />
            </div>
          ))}

          {searchQuery && searchResults.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <p>No verses match your query. Try searching for "duty", "focus", "mind", or chapter names.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
