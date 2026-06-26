export function Footer() {
  return (
    <footer style={{
      marginTop: '4rem',
      paddingTop: '2rem',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      fontSize: '0.8rem',
      color: 'var(--text-secondary)'
    }}>
      <details style={{ width: '100%', maxWidth: '400px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--gold-primary)', textAlign: 'center', listStyle: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
          ℹ️ Developer Details
        </summary>
        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', lineHeight: '1.5', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'left' }}>
          <strong>Developer:</strong> Sameer Joshi<br />
          <strong>Stack:</strong> React, Node.js, Express, MongoDB (Mongoose), Gemini Flash (gemini-flash-latest), Web Push, EmailJS API<br />
          <strong>Links:</strong> <a href="https://github.com/SameerJoshi7" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>GitHub</a> | <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>LinkedIn</a>
        </div>
      </details>

      <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        श्रीकृष्णार्पणमस्तु • By Sameer Joshi
      </div>
    </footer>
  );
}
