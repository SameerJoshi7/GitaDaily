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
            transition: 'color 0.2s ease, border-bottom-color 0.2s ease',
            borderBottom: '1px dotted rgba(255,255,255,0.2)',
            paddingBottom: '1px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--gold-primary)';
            e.currentTarget.style.borderBottomColor = 'var(--gold-primary)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.2)';
          }}
        >
          Sameer Joshi
        </a>
      </div>
    </footer>
  );
}

