import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Zap, Volume2, VolumeX, Sliders, SkipBack, SkipForward, ListMusic, Trash2, Repeat, X } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';
import { HarmonicFrequency } from '../types';
import { Spectral432Fingerprint } from './Spectral432Fingerprint';

export const HarmonicPlayer: React.FC = () => {
  const {
    currentTrack,
    tracks,
    isPlaying,
    currentTime,
    duration,
    activeFrequency,
    volume,
    measuredLufs,
    peakDbtp,
    queue,
    autoPlayNext,
    playNext,
    playPrevious,
    removeFromQueue,
    clearQueue,
    toggleAutoPlayNext,
    playTrack,
    togglePlay,
    seek,
    setFrequency,
    setVolume,
  } = useAudioStore();

  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Format seconds to M:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Render Spectrum visualizer to canvas with local RAF loop (Zero React re-renders)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    const sampleBuffer = new Uint8Array(128);

    const render = () => {
      const { engine } = useAudioStore.getState();
      const analyser = engine.analyserNode;

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(sampleBuffer);
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 48;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor(i * (sampleBuffer.length / barCount));
        const val = isPlaying ? (sampleBuffer[dataIndex] || 8) : 6;
        const barHeight = Math.max(2, (val / 255) * height);

        // Palette visuelle stricte avec contraste > 9:1 (#00FF9D / #F59E0B)
        if (activeFrequency === 'phi') {
          ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#00FF9D';
        } else if (activeFrequency === 'binaural') {
          ctx.fillStyle = i % 2 === 0 ? '#8B5CF6' : '#00FF9D';
        } else if (activeFrequency === '432') {
          ctx.fillStyle = '#00FF9D';
        } else {
          ctx.fillStyle = '#64748b';
        }

        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1.5, barHeight);
      }

      if (isPlaying) {
        animFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [isPlaying, activeFrequency]);

  const frequencyOptions: Array<{
    id: HarmonicFrequency;
    title: string;
    subtitle: string;
    icon: string;
    accentColor: string;
  }> = [
    {
      id: '440',
      title: '440 Hz Standard',
      subtitle: "Son d'origine (Tension)",
      icon: '🎛️',
      accentColor: 'neutral',
    },
    {
      id: '432',
      title: '432 Hz Naturel',
      subtitle: 'Diapason Verdi (Relaxation)',
      icon: '🌿',
      accentColor: 'emerald',
    },
    {
      id: 'phi',
      title: 'Φ 432 Hz Nombre d\'Or',
      subtitle: 'Onde Φ 1.618 Hz (Clarté)',
      icon: '✨',
      accentColor: 'amber',
    },
    {
      id: 'binaural',
      title: '432Hz + 528Hz Binaural',
      subtitle: 'Solfège Sacré & Miracle ADN',
      icon: '🧬',
      accentColor: 'purple',
    },
  ];

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <aside
      id="harmonic-player-container"
      className="w-full bg-[#0F171B] border border-neutral-800/90 rounded-2xl p-5 md:p-6 shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex flex-col justify-between space-y-5 relative"
    >
      {/* Top Album Art & Track Info */}
      <div className="flex flex-col items-center text-center space-y-3 pt-2">
        {/* Album Artwork with Golden Ratio Phi Glyph */}
        <div
          id="player-cover-art"
          className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] shadow-[0_10px_30px_rgba(245,158,11,0.35)] flex items-center justify-center select-none transform transition-transform hover:scale-105"
        >
          <span className="text-black font-serif text-5xl md:text-6xl font-black leading-none drop-shadow-sm">
            Φ
          </span>
        </div>

        {/* Track Title and Master Subtitle */}
        <div className="space-y-0.5">
          <h3
            id="player-track-title"
            className="text-lg md:text-xl font-bold text-white tracking-tight font-mono"
          >
            {currentTrack.title}
          </h3>
          <p className="text-xs text-neutral-400 font-mono">
            {currentTrack.artist} • Master Studio Remasterisé
          </p>
        </div>
      </div>

      {/* Frequency Comparison Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-neutral-300 font-semibold tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>COMPARAISON DES DIFFÉRENCES DE SONS :</span>
          </div>
          <span className="text-[#00FF9D] font-mono text-[11px] tracking-wide animate-pulse">
            Bascule directe sans coupure
          </span>
        </div>

        {/* 2x2 Frequency Selector Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Sélection de profil harmonique">
          {frequencyOptions.map((opt) => {
            const isSelected = activeFrequency === opt.id;
            const isPhi = opt.id === 'phi';

            return (
              <button
                key={opt.id}
                id={`btn-freq-${opt.id}`}
                role="radio"
                aria-checked={isSelected}
                onClick={() => setFrequency(opt.id)}
                className={`p-2.5 md:p-3 rounded-xl text-left transition-all duration-150 cursor-pointer flex flex-col justify-between border ${
                  isSelected
                    ? isPhi
                      ? 'border-[#F59E0B] bg-[#221605] shadow-[0_0_15px_rgba(245,158,11,0.25)] text-amber-200'
                      : 'border-[#00FF9D] bg-[#0A1B14] shadow-[0_0_15px_rgba(0,255,157,0.25)] text-[#00FF9D]'
                    : 'border-neutral-800 bg-[#121A1E]/80 hover:bg-[#162228] text-neutral-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{opt.icon}</span>
                  <span className="text-xs md:text-sm font-bold font-mono tracking-tight">
                    {opt.title}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-sans mt-1 pl-6">
                  {opt.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Spectrum Visualizer & EBU R128 Meters */}
      <div className="space-y-1.5 bg-[#090F12] border border-neutral-800/80 rounded-xl p-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span className="flex items-center gap-1">
            <Sliders className="w-3 h-3 text-[#00FF9D]" />
            FFT 4096 / R128: <strong className="text-[#00FF9D]">{measuredLufs} LUFS</strong>
          </span>
          <span>
            True Peak: <strong className="text-amber-400">{peakDbtp} dBTP</strong>
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={280}
          height={24}
          className="w-full h-6 rounded bg-black/40 block"
        />
      </div>

      {/* Playback Controls & Progress */}
      <div className="space-y-3.5 pt-1">
        {/* Real-time Spectral Fingerprint 432 Hz Component (Web Audio AnalyserNode) */}
        <Spectral432Fingerprint />

        {/* Time and Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span id="player-current-time">{formatTime(currentTime)}</span>
            <span id="player-total-time">{formatTime(duration)}</span>
          </div>

          <div className="relative w-full flex items-center group">
            <input
              id="player-progress-slider"
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              aria-label="Position de lecture"
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-[#00FF9D] z-10"
              style={{
                background: `linear-gradient(to right, #00FF9D ${progressPercent}%, #262626 ${progressPercent}%)`,
              }}
            />
          </div>
        </div>

        {/* Transport Controls (Prev, Giant Play, Next) & Quick Toggles */}
        <div className="flex items-center justify-between px-1">
          {/* Volume Control */}
          <div className="flex items-center gap-1.5 text-neutral-400">
            <button
              id="btn-toggle-mute"
              onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
              className="hover:text-[#00FF9D] transition-colors cursor-pointer p-1"
              aria-label={volume === 0 ? 'Activer le son' : 'Couper le son'}
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              id="volume-slider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume audio"
              className="w-12 sm:w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#00FF9D]"
            />
          </div>

          {/* Transport Cluster (Previous, Giant Play, Next) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-player-previous"
              onClick={playPrevious}
              aria-label="Morceau précédent"
              title="Morceau précédent"
              className="w-9 h-9 rounded-full bg-neutral-800/90 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-neutral-700/60 shadow-sm"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            {/* Giant 64px Circular Play Button */}
            <button
              id="btn-player-giant-play"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Mettre en pause' : 'Lancer la lecture'}
              className="w-16 h-16 rounded-full bg-[#00FF9D] text-black shadow-[0_0_30px_rgba(0,255,157,0.7)] flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-black" />
              ) : (
                <Play className="w-7 h-7 fill-black ml-1" />
              )}
            </button>

            <button
              id="btn-player-next"
              onClick={playNext}
              aria-label="Morceau suivant"
              title="Morceau suivant"
              className="w-9 h-9 rounded-full bg-neutral-800/90 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-neutral-700/60 shadow-sm"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Queue & Auto-play toggles */}
          <div className="flex items-center gap-1.5">
            <button
              id="btn-toggle-autoplay"
              onClick={toggleAutoPlayNext}
              aria-label={autoPlayNext ? 'Désactiver la lecture auto' : 'Activer la lecture auto'}
              title={autoPlayNext ? 'Lecture auto : Activée' : 'Lecture auto : Désactivée'}
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                autoPlayNext
                  ? 'border-[#00FF9D]/50 bg-[#00FF9D]/10 text-[#00FF9D]'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Repeat className={`w-3.5 h-3.5 ${autoPlayNext ? 'text-[#00FF9D]' : 'text-neutral-500'}`} />
            </button>

            <button
              id="btn-toggle-queue"
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              aria-label="Afficher la file d'attente"
              title="File d'attente (Playlist)"
              className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono relative ${
                isQueueOpen || queue.length > 0
                  ? 'border-[#00FF9D]/50 bg-[#0A1B14] text-[#00FF9D]'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:text-white'
              }`}
            >
              <ListMusic className="w-3.5 h-3.5" />
              {queue.length > 0 && (
                <span className="bg-[#00FF9D] text-black text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                  {queue.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Playlist Queue Panel */}
        {isQueueOpen && (
          <div
            id="player-queue-drawer"
            className="bg-[#090F12] border border-neutral-800 rounded-xl p-3 space-y-2 text-xs font-mono animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
              <div className="flex items-center gap-1.5 text-white font-bold">
                <ListMusic className="w-3.5 h-3.5 text-[#00FF9D]" />
                <span>File d'attente ({queue.length})</span>
              </div>
              <div className="flex items-center gap-2">
                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-[10px] text-neutral-400 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Vider</span>
                  </button>
                )}
                <button
                  onClick={() => setIsQueueOpen(false)}
                  className="text-neutral-400 hover:text-white p-0.5 cursor-pointer"
                  aria-label="Fermer la file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Auto-play status indicator */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 bg-black/40 px-2 py-1 rounded">
              <span>Lecture auto du suivant :</span>
              <button
                onClick={toggleAutoPlayNext}
                className={`font-bold uppercase cursor-pointer ${
                  autoPlayNext ? 'text-[#00FF9D]' : 'text-neutral-500'
                }`}
              >
                {autoPlayNext ? 'Activée (Automatique)' : 'Désactivée'}
              </button>
            </div>

            {queue.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                {queue.map((qTrack, idx) => (
                  <div
                    key={`${qTrack.id}-${idx}`}
                    className="flex items-center justify-between p-1.5 rounded bg-neutral-900/80 hover:bg-neutral-800/80 border border-neutral-800/60 group"
                  >
                    <div
                      onClick={() => {
                        removeFromQueue(idx);
                        playTrack(qTrack);
                      }}
                      className="min-w-0 flex-1 cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-neutral-500 text-[10px]">#{idx + 1}</span>
                      <div className="truncate">
                        <div className="font-sans font-medium text-white truncate text-xs group-hover:text-[#00FF9D] transition-colors">
                          {qTrack.title}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {qTrack.artist} • {qTrack.durationSeconds}s
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="text-neutral-500 hover:text-red-400 p-1 cursor-pointer transition-colors"
                      title="Retirer de la file"
                      aria-label="Retirer de la file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-neutral-400 text-center py-2 bg-black/20 rounded">
                <div>La file d'attente est vide.</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">
                  Morceau suivant prévu :{' '}
                  <strong className="text-neutral-300">
                    {tracks[(tracks.findIndex((t) => t.id === currentTrack.id) + 1) % tracks.length]?.title || 'Aucun'}
                  </strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Technical Footer Specs */}
        <div
          id="player-tech-footer"
          className="text-center text-[10px] md:text-[11px] font-mono text-neutral-400 tracking-wider pt-2 border-t border-neutral-800/80 uppercase"
        >
          FLUX STREAMING RANGE 206 • MP3 320 KBPS • ZÉRO COUPURE
        </div>
      </div>
    </aside>
  );
};
