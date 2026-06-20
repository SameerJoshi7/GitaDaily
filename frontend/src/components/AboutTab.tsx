import React from 'react';

interface AboutTabProps {
  onSeekGuidanceClick: () => void;
}

export const AboutTab: React.FC<AboutTabProps> = ({ onSeekGuidanceClick }) => {
  return (
    <div>
      <div className="dashboard-header">
        <h2 className="dashboard-title">About Krishna Bodha</h2>
        <span className="dashboard-subtitle">Ancient wisdom contextualized for the modern world.</span>
      </div>

      {/* Philosophy / Intro Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.06) 0%, rgba(79, 70, 229, 0.03) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: '40%',
          backgroundImage: 'url(/images/discourse.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '80%' }}>
          <span style={{ 
            color: 'var(--gold-primary)', 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '2px',
            display: 'block',
            marginBottom: '0.5rem'
          }}>The Philosophy of Sadhana</span>
          
          <h3 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.75rem', 
            color: 'var(--text-primary)', 
            margin: '0 0 1rem 0',
            lineHeight: '1.2'
          }}>Cultivating Daily Discipline & Mental Equanimity</h3>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
            In a fast-paced world filled with continuous digital notifications and workplace pressures, 
            maintaining mental clarity and emotional focus is harder than ever. <strong>Krishna Bodha</strong> was built to be 
            your spiritual anchor, helping you establish a strict, daily habit of morning reflection (<em>Sadhana</em>) 
            grounded in the eternal guidelines of the Bhagavad Gita.
          </p>
        </div>
      </div>

      {/* Core Pillars Section */}
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Core Capabilities</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Pillar 1 */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', padding: '0.5rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '10px', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🌅
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Daily 6:00 AM Broadcast</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Begin your day with intention. The app broadcasts a daily verse (shloka) along with custom-generated AI reflections targeting modern relevance, career focus, and emotional peace directly to your preferred channels at exactly 6:00 AM.
          </p>
        </div>

        {/* Pillar 2 */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(212, 175, 55, 0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', padding: '0.5rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '10px', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✨
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--gold-primary)', fontWeight: 600 }}>Seek Divine Guidance</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Our flagship feature. Type any struggle, confusion, career query, or emotional challenge. The AI engine parses our sacred database of shlokas to match the perfect verse to your query and delivers customized counseling in your chosen language.
          </p>
        </div>

        {/* Pillar 3 */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--card-border)',
          borderRadius: '16px',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem', padding: '0.5rem', background: 'rgba(212, 175, 55, 0.08)', borderRadius: '10px', color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              🔔
            </div>
            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Multi-Channel Dispatch</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Receive guidance where it fits your lifestyle. Subscribe and set preferences to get daily shlokas delivered via email, interactive browser push notifications, or connect to our dedicated channels. Authenticate securely using passwordless email OTPs.
          </p>
        </div>
      </div>

      {/* Architecture / Tech Stack Section */}
      <div style={{
        background: 'rgba(255,255,255,0.01)',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '2rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: 0, marginBottom: '0.5rem' }}>Tech Stack & Systems</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
          Krishna Bodha leverages modern web technologies to ensure zero-friction, robust delivery and instant AI computation.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>React 18 & Vite</span>
          <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>TypeScript</span>
          <span style={{ background: 'rgba(212, 175, 55, 0.06)', color: 'var(--gold-primary)', border: '1px solid rgba(212, 175, 55, 0.25)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 600 }}>Google Gemini AI (gemini-flash-latest)</span>
          <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>Node.js & Express</span>
          <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>EmailJS secure HTTP API</span>
          <span style={{ background: 'rgba(255, 255, 255, 0.03)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.4rem 0.8rem', borderRadius: '30px', fontSize: '0.8rem', fontWeight: 500 }}>VAPID Web Push Protocol</span>
        </div>
      </div>

      {/* Quick Action Link Banner */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '16px',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem'
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 600 }}>Need help navigating life's challenges right now?</h4>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Ask the Gita for answers regarding stress, career path, relationships, or mindfulness.</p>
        </div>
        <button
          onClick={onSeekGuidanceClick}
          className="primary-btn"
          style={{
            padding: '0.5rem 1.25rem',
            fontSize: '0.85rem',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#000',
            fontWeight: 600,
            border: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Seek Guidance Now
        </button>
      </div>
    </div>
  );
};
