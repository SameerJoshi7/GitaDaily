import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  chapter: number;
  verse: number;
}

export function AudioPlayer({ chapter, verse }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Construct URL for open source Gita recitation
  const audioUrl = `/audio/verse_recitation/${chapter}/${verse}.mp3`;

  useEffect(() => {
    // Reset state when chapter/verse changes
    setIsPlaying(false);
    setProgress(0);
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load(); // Force reload of new src
    }
  }, [chapter, verse]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback failed:", err);
        setError("Audio unavailable for this verse.");
      });
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const handleError = () => {
    setIsPlaying(false);
    setError("Audio file not found.");
  };

  return (
    <div className="audio-player-container" style={{
      background: 'rgba(255, 255, 255, 0.03)',
      border: '1px solid rgba(212, 175, 55, 0.2)',
      borderRadius: '12px',
      padding: '0.8rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginTop: '1rem'
    }}>
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        preload="none"
      />
      
      <button 
        onClick={togglePlay}
        disabled={!!error}
        style={{
          background: error ? '#475569' : 'var(--gold-primary)',
          color: '#000',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: error ? 'not-allowed' : 'pointer',
          flexShrink: 0
        }}
      >
        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
      </button>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <span style={{ color: error ? '#ef4444' : 'var(--text-primary)', fontWeight: 500 }}>
            {error ? 'Unavailable' : 'Sanskrit Recitation'}
          </span>
          {!error && <span>{Math.round(progress)}%</span>}
        </div>
        
        {/* Progress Bar */}
        <div style={{ 
          height: '4px', 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: 'var(--gold-primary)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>

      <button 
        onClick={toggleMute}
        disabled={!!error}
        style={{
          background: 'transparent',
          border: 'none',
          color: error ? '#475569' : 'var(--text-secondary)',
          cursor: error ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.5rem'
        }}
      >
        {error ? <AlertCircle size={20} /> : (isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />)}
      </button>
    </div>
  );
}
