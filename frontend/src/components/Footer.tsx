export function Footer() {
  return (
    <footer style={{
      marginTop: '4rem',
      paddingTop: '2rem',
      paddingBottom: '2.5rem',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.75rem',
      width: '100%',
      textAlign: 'center'
    }}>
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '0.04em',
        background: 'linear-gradient(135deg, var(--gold-secondary) 0%, var(--gold-primary) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        textShadow: '0 0 10px rgba(212, 175, 55, 0.15)',
        display: 'inline-block',
      }}>
        श्रीकृष्णार्पणमस्तु
      </div>
      <div style={{ 
        fontSize: '0.75rem', 
        color: 'var(--text-muted)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        By <a 
          href="https://www.linkedin.com/in/sameer-joshi-691457146/" 
          target="_blank" 
          rel="noreferrer" 
          style={{ 
            color: 'var(--text-secondary)', 
            textDecoration: 'none',
            fontWeight: 500,
            transition: 'color 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--gold-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          Sameer Joshi
        </a>
      </div>
      
      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
        <a 
          href="mailto:help@krishnabodha.in?subject=Krishna Bodha Support" 
          style={{ 
            color: 'var(--text-muted)', 
            textDecoration: 'none',
            transition: 'color 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
          </svg>
          Contact Us
        </a>
      </div>
    </footer>
  );
}
