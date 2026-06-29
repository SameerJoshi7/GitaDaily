import React, { useState, useEffect } from 'react';
import { User, Sparkles } from 'lucide-react';

interface NamePromptModalProps {
  isOpen: boolean;
  onSave: (name: string) => Promise<void>;
  loading: boolean;
}

export function NamePromptModal({ isOpen, onSave, loading }: NamePromptModalProps) {
  const [name, setName] = useState('');

  // Reset internal state if it opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* No close button rendered here, as requested */}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', textAlign: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
              width: '4rem', height: '4rem', borderRadius: '50%', 
              background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold-primary)' 
            }}>
              <Sparkles size={32} />
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              How should Krishna address you?
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>
              Please enter your name to make your divine guidance deeply personal.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginTop: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0, textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Your Name
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <User size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '2.8rem' }}
                  placeholder="e.g. Arjuna"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-btn"
              style={{ background: 'linear-gradient(135deg, #fbbf24, #d97706)', color: '#000', padding: '0.8rem', justifyContent: 'center', fontSize: '1rem' }}
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <div style={{
                  width: '20px', height: '20px',
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderTopColor: '#000',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              ) : (
                'Save My Name'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
