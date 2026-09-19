import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink, Waves, Sparkles } from 'lucide-react';
import { SocialShareBar, FREQ_LABELS } from './SocialShareBar';

export interface EmbeddedPlayerWidgetProps {
  trackId?: string;
  initialFreq?: string;
  onOpenFullApp?: () => void;
  className?: string;
}

interface TrackMeta {
  id: string;
  title: string;
  artist: string;
  fundamentalHz: number;
  musicalKey: string;
  durationSeconds: number;
}

const DEFAULT_TRACKS: Record<string, TrackMeta> = {
  'splintered-self': {
    id: 'splintered-self',
    title: 'Splintered Self',
    artist: 'VEL94EV',
    fundamentalHz: 220.0,
    musicalKey: 'A Minor',
    durationSeconds: 264,
  },
  'bones-for-the-crows': {
    id: 'bones-for-the-crows',
    title: 'Bones For The Crows',
    artist: 'Nickelback',
    fundamentalHz: 196.0,
    musicalKey: 'G Major',
    durationSeconds: 242,
  },
  'counting-stars': {
    id: 'counting-stars',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    fundamentalHz: 261.63,
    musicalKey: 'C# / Db Minor',
    durationSeconds: 257,
  },
  'the-soldier-4': {
    id: 'the-soldier-4',
    title: 'The Soldier 4',
    artist: 'Mike Shinoda solo Linkin Park',
    fundamentalHz: 293.66,
    musicalKey: 'D Minor',
    durationSeconds: 218,
  },
};

export const EmbeddedPlayerWidget: React.FC<EmbeddedPlayerWidgetProps> = ({
  trackId = 'splintered-self',
  initialFreq = '432_NATURAL',
  onOpenFullApp,
  className = '',
}) => {
  const normId = trackId.includes('bones')
    ? 'bones-for-the-crows'
    : trackId.includes('counting')
      ? 'counting-stars'
      : trackId.includes('soldier')
        ? 'the-soldier-4'
        : 'splintered-self';

  const track = DEFAULT_TRACKS[normId] || DEFAULT_TRACKS['splintered-self'];

  const [activeFreq, setActiveFreq] = useState<string>(initialFreq);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);

  const streamUrl = `/api/stream/${track.id}?freq=${activeFreq}`;

  // Mini animation sur le canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isPhi = activeFreq.includes('phi') || activeFreq.includes('binaural');
      ctx.strokeStyle = isPhi ? 'rgba(245, 158, 11, 0.7)' : 'rgba(0, 255, 157, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;
      const step = 4;

      for (let x = 0; x < width; x += step) {
        const amplitude = isPlaying ? 12 : 3;
        const freqMultiplier = isPhi ? 0.05 : 0.035;
        const y = centerY + Math.sin(x * freqMultiplier + phase) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (isPlaying) {
        phase += 0.08;
      } else {
        phase += 0.01;
      }
      animRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, activeFreq]);

  // Gestion de la bascule fréquentielle sans coupure
  const handleFreqChange = (newFreq: string) => {
    if (newFreq === activeFreq) return;
    const audio = audioRef.current;
    if (audio) {
      const pos = audio.currentTime;
      const wasPlaying = !audio.paused;
      setActiveFreq(newFreq);
      audio.src = `/api/stream/${track.id}?freq=${newFreq}`;
      audio.currentTime = pos;
      if (wasPlaying) {
        audio.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      setActiveFreq(newFreq);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMute = !isMuted;
      audioRef.current.muted = newMute;
      setIsMuted(newMute);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const freqButtons = [
    { id: '440_BYPASS', label: '440 Hz' },
    { id: '432_NATURAL', label: '432 Hz' },
    { id: '432_PHI', label: 'Φ 432 Hz' },
    { id: '432_528_BINAURAL', label: '528 Hz' },
  ];

  return (
    <div
      id="harmonic-embedded-widget"
      className={`bg-[#0B1313] border border-[#00FF9D]/30 rounded-xl p-3.5 text-gray-100 font-mono shadow-[0_0_30px_rgba(0,0,0,0.8)] relative flex flex-col justify-between select-none ${className}`}
      style={{ minHeight: '220px', maxWidth: '100%' }}
    >
      <audio
        ref={audioRef}
        src={streamUrl}
        crossOrigin="anonymous"
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Ligne 1 : En-tête du morceau + Fréquence active + Boutons de partage Social (Twitter/X & Facebook) */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded bg-[#00FF9D]/10 border border-[#00FF9D]/30 text-[#00FF9D] shrink-0">
            <Waves className="w-3.5 h-3.5" />
          </div>
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
              <span>{track.title}</span>
              <span className="text-[10px] text-gray-400 font-normal">• {track.artist}</span>
            </div>
            <div className="text-[10px] text-[#00FF9D] flex items-center gap-1">
              <span>{FREQ_LABELS[activeFreq] || activeFreq}</span>
              <span className="text-gray-500">• EBU R128</span>
            </div>
          </div>
        </div>

        {/* Boutons de partage social intégrés au widget : Twitter/X, Facebook & Lien direct */}
        <div className="flex items-center gap-1 shrink-0">
          <SocialShareBar
            trackTitle={track.title}
            trackArtist={track.artist}
            trackId={track.id}
            freqMode={activeFreq}
            compact={true}
          />
          {onOpenFullApp && (
            <button
              onClick={onOpenFullApp}
              title="Ouvrir dans Harmonic Studio"
              className="p-1.5 rounded-lg bg-black/60 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all ml-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ligne 2 : Canvas d'ondes spectrales & commutation rapide des 4 matrices */}
      <div className="my-2 relative flex items-center justify-between gap-3 bg-black/40 border border-white/5 rounded-lg p-2 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={300}
          height={36}
          className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
        />

        {/* Boutons fréquences A/B */}
        <div className="relative z-10 flex items-center gap-1.5 flex-wrap">
          {freqButtons.map((btn) => {
            const isActive = activeFreq === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => handleFreqChange(btn.id)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00FF9D] text-black border-[#00FF9D] shadow-[0_0_10px_rgba(0,255,157,0.4)]'
                    : 'bg-black/60 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Badges de Résonance */}
        <div className="relative z-10 text-[10px] text-gray-400 hidden sm:flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#F59E0B]" />
          <span>{activeFreq.includes('phi') ? 'Φ 1.618' : '432 Hz'}</span>
        </div>
      </div>

      {/* Ligne 3 : Barre de progression & Seek */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={track.durationSeconds}
          step="0.5"
          value={currentTime}
          onChange={handleSeek}
          aria-label="Position temporelle"
          className="flex-1 h-1 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#00FF9D]"
        />
        <span>{formatTime(track.durationSeconds)}</span>
      </div>

      {/* Ligne 4 : Barre de transport (Play, Volume, Marque) */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
        <div className="flex items-center gap-2.5">
          <button
            id="widget-play-toggle-btn"
            onClick={togglePlay}
            className="bg-[#00FF9D] hover:bg-[#00FF9D]/90 text-black p-2 rounded-lg flex items-center justify-center font-bold transition-all shadow-[0_0_12px_rgba(0,255,157,0.3)] cursor-pointer"
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="text-gray-400 hover:text-white p-1 transition-colors cursor-pointer"
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                setIsMuted(false);
                if (audioRef.current) {
                  audioRef.current.volume = val;
                  audioRef.current.muted = false;
                }
              }}
              aria-label="Volume du widget"
              className="w-14 h-1 bg-black/50 rounded-lg appearance-none cursor-pointer accent-[#00FF9D]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 tracking-wider uppercase hidden xs:inline">
            HARMONIC STUDIO 432HZ
          </span>
          <span className="text-[9px] bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/20 px-1.5 py-0.5 rounded font-bold">
            RFC 7233
          </span>
        </div>
      </div>
    </div>
  );
};
