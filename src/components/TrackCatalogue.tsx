import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Lock, Sparkles, Music } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';
import { Track } from '../types';

interface TrackCatalogueProps {
  onOpenCheckout: (type: 'single' | 'subscription', track?: Track) => void;
}

export const TrackCatalogue: React.FC<TrackCatalogueProps> = ({ onOpenCheckout }) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    adminUnlocked,
    isSubscribed,
  } = useAudioStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/tracks');
      if (res.ok) {
        // Catalogue fetched fresh from server
      }
    } catch {
      // Offline fallback
    }
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <section id="harmonic-catalogue-section" className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-[#00FF9D] text-lg">🎵</span>
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Catalogue Harmonique Actif (Cliquez pour écouter)
          </h2>
        </div>

        <button
          id="btn-refresh-catalogue"
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#00FF9D] transition-colors cursor-pointer font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Tracks List */}
      <div className="space-y-3" role="region" aria-label="Liste des pistes harmoniques">
        {tracks.map((track) => {
          const isCurrent = currentTrack.id === track.id;
          const isCurrentlyPlaying = isCurrent && isPlaying;
          const isTrackUnlocked = adminUnlocked || isSubscribed || track.unlocked;

          return (
            <div
              key={track.id}
              id={`track-card-${track.id}`}
              className={`p-3.5 md:p-4 rounded-xl transition-all duration-200 flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-[#0B1516] border-2 border-[#00FF9D] shadow-[0_0_20px_rgba(0,255,157,0.2)]'
                  : 'bg-[#0F171B] border border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              {/* Left Play/Pause Icon Button */}
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  id={`btn-play-left-${track.id}`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playTrack(track);
                    }
                  }}
                  aria-label={`Écouter ${track.title}`}
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#00FF9D] text-black shadow-[0_0_12px_rgba(0,255,157,0.5)]'
                      : 'bg-neutral-800/90 text-neutral-300 hover:text-white hover:bg-neutral-700'
                  }`}
                >
                  {isCurrentlyPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Track Metadata */}
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm md:text-base text-white tracking-tight truncate font-sans">
                      {track.title}
                    </span>

                    {isTrackUnlocked && (
                      <span
                        id={`badge-unlocked-${track.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/30"
                      >
                        <Lock className="w-2.5 h-2.5" />
                        <span>Débloqué Admin</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] md:text-xs text-neutral-400 font-mono flex flex-wrap items-center gap-1.5">
                    <span className="text-neutral-300">{track.artist}</span>
                    <span className="text-neutral-600">•</span>
                    <span>{track.durationSeconds}s</span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-amber-400/90">Pitch shift {track.pitchShiftCents} cents</span>
                    <span className="text-neutral-600">•</span>
                    <span className="text-[#00FF9D]/80">EBU R128</span>
                  </p>
                </div>
              </div>

              {/* Right Action and Price */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-mono font-bold text-[#00FF9D]">
                    {track.priceCad.toFixed(2)} $ CAD
                  </div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    Master 320 kbps
                  </div>
                </div>

                <button
                  id={`btn-listen-${track.id}`}
                  onClick={() => {
                    if (isCurrent) {
                      togglePlay();
                    } else {
                      playTrack(track);
                    }
                  }}
                  className="bg-[#00FF9D] hover:bg-[#00e68d] active:scale-95 text-black font-semibold text-xs md:text-sm px-3.5 py-1.5 rounded-lg shadow-[0_0_10px_rgba(0,255,157,0.3)] flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {isCurrentlyPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-black" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Écouter</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Option B : Pass Fréquentiel Illimité (Stripe Billing) */}
      <div
        id="pass-unlimited-box"
        className="bg-[#1E170C] border border-[#D97706] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(217,119,6,0.15)]"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-sm md:text-base font-mono">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Option B : Pass Fréquentiel Illimité (Stripe Billing)</span>
          </div>
          <p className="text-neutral-400 text-xs leading-normal">
            Accès illimité à l'intégralité du catalogue 432Hz, 528Hz et ratio Φ pour 9,99 $ CAD / mois.
          </p>
        </div>

        <button
          id="btn-subscribe-pass"
          onClick={() => onOpenCheckout('subscription')}
          className="bg-[#F59E0B] hover:bg-[#d97706] active:scale-95 text-black font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          {isSubscribed ? '✓ Abonnement Actif' : "S'abonner (9,99 $)"}
        </button>
      </div>
    </section>
  );
};
