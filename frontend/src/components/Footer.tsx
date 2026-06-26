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
      <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
        श्रीकृष्णार्पणमस्तु • By <a href="https://www.linkedin.com/in/sameer-joshi-691457146/" target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', textDecoration: 'none' }}>Sameer Joshi</a>
      </div>
    </footer>
  );
}
