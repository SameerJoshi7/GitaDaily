import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Music, SkipForward } from 'lucide-react';

interface Track {
  title: string;
  subtitle: string;
  url: string;
}

const tracks: Track[] = [
  {
    title: "Playful Krishna",
    subtitle: "Dr. N. Ramani (Carnatic Flute)",
    url: "https://archive.org/download/classical-music-flute/Classical%20Music-Flute/03-Theeratha%20Villattu%20Pillai.mp3"
  },
  {
    title: "Vrindavan Meditations",
    subtitle: "Pt. Hariprasad Chaurasia",
    url: "https://archive.org/download/PanditHariprasadChaurasiaAtRamakrishnaMissionDelhi20140119/PanditHariprasadChaurasiaAtRamakrishnaMissionDelhi2014_01_19.mp3"
  }
];

export const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() => {
    const saved = localStorage.getItem('gitadaily_music_track');
    if (saved !== null) {
      const parsed = parseInt(saved);
      if (parsed >= 0 && parsed < tracks.length) return parsed;
    }
    return 0;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('gitadaily_music_muted') === 'true';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync volume & mute state on mount and update
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      audioRef.current.volume = 0.02; // Set extremely soft, whisper background volume (2%)
    }
    localStorage.setItem('gitadaily_music_muted', String(isMuted));
  }, [isMuted]);

  // Sync current track source and play state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = tracks[currentTrackIndex].url;
      audioRef.current.load();
      audioRef.current.volume = 0.02; // Maintain soft volume on load
      localStorage.setItem('gitadaily_music_track', String(currentTrackIndex));
      if (isPlaying) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error("Playback block / error:", err);
            setIsPlaying(false);
          });
      }
    }
  }, [currentTrackIndex]);

  // Handle first user interaction to bypass autoplay policies
  useEffect(() => {
    const startAudio = () => {
      // Autoplay only if user hasn't explicitly paused it previously
      const isExplicitlyPaused = localStorage.getItem('gitadaily_music_playing') === 'false';
      if (!isExplicitlyPaused && audioRef.current && !isPlaying) {
        audioRef.current.volume = 0.02;
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            localStorage.setItem('gitadaily_music_playing', 'true');
          })
          .catch((err) => {
            console.log("Autoplay blocked by browser policy on interaction:", err);
          });
      }

      cleanupListeners();
    };

    const cleanupListeners = () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('touchstart', startAudio);
    };

    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
    window.addEventListener('touchstart', startAudio);

    return cleanupListeners;
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      localStorage.setItem('gitadaily_music_playing', 'false');
    } else {
      audioRef.current.volume = 0.02;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem('gitadaily_music_playing', 'true');
        })
        .catch((err) => {
          console.error("Playback block / error:", err);
          alert("Click OK and play again. Browser policies require user interaction to play sound.");
        });
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  const nextTrack = () => {
    setCurrentTrackIndex((prev) => (prev + 1) % tracks.length);
  };

  return (
    <div className="audio-player-floating">
      <audio
        ref={audioRef}
        loop
        preload="auto"
      />
      <div className="audio-info">
        <div className={`audio-icon-wrapper ${isPlaying ? 'playing' : ''}`}>
          <Music size={15} className="flute-note-icon" />
          {isPlaying && (
            <div className="music-bars">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
          )}
        </div>
        <div className="audio-text" style={{ maxWidth: '140px' }}>
          <span className="audio-title" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tracks[currentTrackIndex].title}
          </span>
          <span className="audio-subtitle" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tracks[currentTrackIndex].subtitle}
          </span>
        </div>
      </div>
      <div className="audio-controls">
        <button
          onClick={togglePlay}
          className="audio-btn play-pause-btn"
          title={isPlaying ? "Pause Melody" : "Play Melody"}
        >
          {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
        </button>
        <button
          onClick={nextTrack}
          className="audio-btn skip-btn"
          title="Next Melody"
        >
          <SkipForward size={14} fill="currentColor" />
        </button>
        <button
          onClick={toggleMute}
          className="audio-btn mute-btn"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    </div>
  );
};
