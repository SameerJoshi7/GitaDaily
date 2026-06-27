import React, { useState, useEffect } from 'react';
import { Star, Send } from 'lucide-react';
import { useApp } from '../hooks/useApp';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (guidanceRating: number, appRating: number, suggestions: string, isEdit: boolean, newName: string) => Promise<void>;
  loading: boolean;
  email?: string;
  userName?: string;
  onNameUpdate?: (name: string) => void;
}

export function FeedbackModal({ isOpen, onClose, onSubmit, loading, email, userName, onNameUpdate }: FeedbackModalProps) {
  const [guidanceRating, setGuidanceRating] = useState<number>(0);
  const [appRating, setAppRating] = useState<number>(0);
  const [suggestions, setSuggestions] = useState('');
  const [localName, setLocalName] = useState(userName || '');
  
  const [hoverGuidance, setHoverGuidance] = useState<number>(0);
  const [hoverApp, setHoverApp] = useState<number>(0);
  
  const [isEdit, setIsEdit] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const { API_BASE } = useApp();

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalName(userName || '');
      // If subscribed, check if they already gave feedback
      if (email) {
        setIsFetching(true);
        fetch(`${API_BASE}/feedback/${encodeURIComponent(email)}`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.feedback) {
              setGuidanceRating(data.feedback.guidanceRating);
              setAppRating(data.feedback.appRating);
              setSuggestions(data.feedback.suggestions || '');
              if (data.feedback.userName) {
                setLocalName(data.feedback.userName);
              }
              setIsEdit(true);
            } else {
              setGuidanceRating(0);
              setAppRating(0);
              setSuggestions('');
              setIsEdit(false);
            }
          })
          .catch(err => console.error('Failed to fetch feedback:', err))
          .finally(() => setIsFetching(false));
      } else {
        // Guest user, reset completely unless they already typed it this session
        setGuidanceRating(0);
        setAppRating(0);
        setSuggestions('');
        setIsEdit(false);
      }
    }
  }, [isOpen, email, userName, API_BASE]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guidanceRating === 0 || appRating === 0) {
      alert('Please provide a rating for both categories.');
      return;
    }
    if (!localName.trim()) {
      alert('Please provide your name.');
      return;
    }
    
    await onSubmit(guidanceRating, appRating, suggestions, isEdit, localName.trim());
    
    if (onNameUpdate && localName.trim() !== userName) {
      onNameUpdate(localName.trim());
    }
    
    if (!isEdit) {
      setGuidanceRating(0);
      setAppRating(0);
      setSuggestions('');
    }
  };

  const renderStars = (
    rating: number, 
    hover: number, 
    setRating: (r: number) => void, 
    setHover: (r: number) => void
  ) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none transition-transform hover:scale-110"
            style={{ 
              color: star <= (hover || rating) ? 'var(--gold-primary)' : 'var(--border-light)',
              background: 'none', 
              border: 'none', 
              padding: '0.2rem',
              cursor: 'pointer'
            }}
          >
            <Star 
              size={28} 
              fill={star <= (hover || rating) ? 'var(--gold-primary)' : 'transparent'} 
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
          <h3 style={{ color: 'var(--gold-primary)', margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
            {isEdit ? 'Update Your Feedback' : 'Share Your Feedback'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', margin: '-0.5rem 0 0.5rem 0' }}>
            Your feedback helps us improve Krishna Bodha.
          </p>

          {isFetching ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading your previous feedback...
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Name Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Your Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder="How should we address you?"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Guidance Rating */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Seek Guidance Accuracy
                </label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                  How well does Krishna understand and solve your problems?
                </p>
                {renderStars(guidanceRating, hoverGuidance, setGuidanceRating, setHoverGuidance)}
              </div>

              {/* App Experience Rating */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Overall App Experience & Content
                </label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                  How is the UI, daily shlokas, and overall feeling of the app?
                </p>
                {renderStars(appRating, hoverApp, setAppRating, setHoverApp)}
              </div>

              {/* Suggestions */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Suggestions / Improvements
                </label>
                <textarea
                  className="input-field"
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Tell us what you love, what you'd change, or request new features..."
                  rows={4}
                  style={{ resize: 'none', width: '100%', padding: '0.75rem' }}
                />
              </div>

              <button
                type="submit"
                className="primary-btn"
                disabled={loading || guidanceRating === 0 || appRating === 0 || !localName.trim()}
                style={{ padding: '0.75rem', justifyContent: 'center', background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: (guidanceRating === 0 || appRating === 0 || !localName.trim()) ? 0.5 : 1 }}
              >
                {loading ? 'Submitting...' : (
                  <>
                    <Send size={16} />
                    <span>{isEdit ? 'Update Feedback' : 'Submit Feedback'}</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
