interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg, rgba(18,20,31,0.98), rgba(30,33,52,0.98))',
      border: '1px solid rgba(212, 175, 55, 0.35)',
      borderRadius: '12px',
      padding: '0.75rem 1.5rem',
      color: 'var(--text-primary)',
      fontSize: '0.9rem',
      fontWeight: 500,
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'fadeIn 0.3s ease-out',
      backdropFilter: 'blur(12px)',
      maxWidth: '90vw',
      textAlign: 'center',
    }}>
      {message}
    </div>
  );
}
