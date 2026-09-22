import { Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '2.5rem 2rem', maxWidth: '400px' }}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
          <img src="/flute-icon.png" alt="Krishna Bodha Logo" style={{ width: '56px', height: '56px', filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.4))', marginBottom: '1rem' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold-primary)', fontSize: '1.5rem', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Welcome to
          </h2>
          <div className="brand-name-sanskrit" style={{ fontSize: '2.2rem', marginTop: '0.2rem' }}>कृष्णबोध</div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          <span style={{ fontStyle: 'italic', color: 'var(--gold-secondary)' }}>
            "You have the right to perform your duties, but you are not entitled to the fruits of your actions."
          </span>
          <br /><br />
          Welcome to Krishna Bodha. Embark on a journey of discovering timeless wisdom and inner peace. Let go of outcomes and focus on the present moment, one verse at a time.
        </p>

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
          <Sparkles size={18} style={{ marginRight: '8px' }} />
          Get Started
        </button>
      </div>
    </div>
  );
}
