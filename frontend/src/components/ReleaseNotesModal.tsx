import { Flame, Star, CheckCircle } from 'lucide-react';

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export function ReleaseNotesModal({ isOpen, onClose, version }: ReleaseNotesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem', maxWidth: '450px' }}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '0.8rem', borderRadius: '50%' }}>
            <Star size={28} color="var(--gold-primary)" />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-primary)', fontSize: '1.4rem', margin: 0 }}>
              What's New in {version}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              We've been building for your spiritual journey
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Flame size={24} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#f3f4f6', margin: '0 0 0.4rem 0' }}>Sadhana Streaks</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Track your daily wisdom habit! Your profile now displays a streak counter. Read daily to keep your streak alive and track your longest consistency.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <CheckCircle size={24} color="var(--gold-secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1.05rem', color: '#f3f4f6', margin: '0 0 0.4rem 0' }}>Performance Polish</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                We've smoothed out the offline caching and app performance so your reading experience is more fluid than ever.
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="primary-btn"
          style={{ 
            width: '100%', 
            justifyContent: 'center', 
            padding: '0.8rem', 
            background: 'linear-gradient(135deg, #fbbf24, #d97706)', 
            color: '#000', 
            fontSize: '1rem',
            fontWeight: 600 
          }}
        >
          Explore Now
        </button>
      </div>
    </div>
  );
}
