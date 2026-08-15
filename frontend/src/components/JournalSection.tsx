import React, { useState, useEffect } from 'react';
import { PenLine, Check, Loader2, Trash2 } from 'lucide-react';

interface JournalSectionProps {
  chapter: number;
  verse: number;
  email: string;
  lang?: string;
}

export const JournalSection: React.FC<JournalSectionProps> = ({
  chapter,
  verse,
  email,
  lang: _lang = 'english',
}) => {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gita-daily-backend.onrender.com/api';
  const [note, setNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch existing note for this verse
    const fetchNote = async () => {
      if (!email) return;
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/journal?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const journals = await res.json();
          const existing = journals.find((j: any) => j.chapter === chapter && j.verse === verse);
          if (existing) {
            setNote(existing.note);
          } else {
            setNote('');
          }
        }
      } catch (err) {
        console.error('Failed to fetch journal note', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNote();
  }, [chapter, verse, email]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`${API_BASE}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, chapter, verse, note })
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save journal note', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    try {
      await fetch(`${API_BASE}/journal`, {
        method: 'POST', // The backend handles empty string as delete
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, chapter, verse, note: '' })
      });
      setNote('');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to delete journal note', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!email) return null; // Must be logged in to journal

  return (
    <div style={{
      marginTop: '1.5rem',
      background: 'rgba(212, 175, 55, 0.05)',
      border: '1px solid rgba(212, 175, 55, 0.2)',
      borderRadius: '12px',
      padding: '1.25rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--gold-primary)', fontSize: '0.95rem' }}>
          <PenLine size={18} />
          Spiritual Journal
        </h4>
        {note && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Edit
          </button>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
          <Loader2 className="spinner" size={20} style={{ color: 'var(--gold-primary)' }} />
        </div>
      ) : isEditing || !note ? (
        <div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write your personal reflections on this verse..."
            style={{
              width: '100%',
              minHeight: '100px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              padding: '0.75rem',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              resize: 'vertical',
              marginBottom: '1rem'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            {(note || isEditing) && (
              <button 
                onClick={handleDelete}
                disabled={isSaving}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.4rem 0.75rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.85rem'
                }}
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="primary-btn"
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#000',
                border: 'none',
                borderRadius: '6px',
                padding: '0.4rem 1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: 600
              }}
            >
              {isSaving ? <Loader2 className="spinner" size={14} /> : <Check size={14} />} Save
            </button>
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
          {note}
        </div>
      )}
    </div>
  );
};
