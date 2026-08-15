import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenLine, Loader2, ArrowRight } from 'lucide-react';

interface JournalTabProps {
  email?: string;
  lang?: string;
}

export const JournalTab: React.FC<JournalTabProps> = ({ email, lang: _lang = 'english' }) => {
  const navigate = useNavigate();
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setLoading(false);
      return;
    }
    
    const fetchJournals = async () => {
      try {
        const res = await fetch(`/api/journal?email=${encodeURIComponent(email)}`);
        if (res.ok) {
          const data = await res.json();
          setJournals(data);
        }
      } catch (err) {
        console.error('Failed to fetch journals', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJournals();
  }, [email]);

  if (!email) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📝</span>
        <p>Please subscribe or log in to use the Spiritual Journal.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PenLine size={24} /> My Journal
        </h2>
        <span className="dashboard-subtitle">Your private reflections on the divine wisdom</span>
      </div>

      {loading ? (
        <div className="loading-container">
          <Loader2 className="spinner" size={32} />
        </div>
      ) : journals.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {journals.map((j) => (
            <div key={`${j.chapter}-${j.verse}`} className="reflection-card" style={{ background: 'rgba(25, 28, 43, 0.4)', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h4 style={{ margin: 0, color: 'var(--gold-primary)' }}>Chapter {j.chapter}, Verse {j.verse}</h4>
                <button 
                  onClick={() => navigate(`/chapter/${j.chapter}/verse/${j.verse}`)}
                  className="secondary-btn" 
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                >
                  View Verse <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                </button>
              </div>
              <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontSize: '0.95rem', lineHeight: 1.6 }}>{j.note}</p>
              <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Last updated: {new Date(j.updatedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>You haven't written any reflections yet. Read a shloka and add your first journal entry!</p>
        </div>
      )}
    </div>
  );
};
