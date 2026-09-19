import React, { useState, useRef } from 'react';
import { Play, Pause, RefreshCw, Lock, Sparkles, Music, ListPlus, Check, Archive, Volume2, Upload, FileAudio, Plus, X } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';
import { Track, HarmonicFrequency } from '../types';

interface TrackCatalogueProps {
  onOpenCheckout: (type: 'single' | 'subscription', track?: Track) => void;
}

export const TrackCatalogue: React.FC<TrackCatalogueProps> = ({ onOpenCheckout }) => {
  const {
    tracks,
    currentTrack,
    isPlaying,
    activeFrequency,
    playTrack,
    playTrackMaster,
    togglePlay,
    adminUnlocked,
    isSubscribed,
    addToQueue,
    queue,
    setTrackCustomAudio,
    removeTrackCustomAudio,
  } = useAudioStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ trackId: string; freq: HarmonicFrequency } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const handleCustomAudioUpload = (trackId: string, freq: HarmonicFrequency, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUploadTarget({ trackId, freq });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTarget) {
      const url = URL.createObjectURL(file);
      setTrackCustomAudio(uploadTarget.trackId, uploadTarget.freq, url, file.name, undefined, true);
      setUploadTarget(null);
    }
  };

  const handleDropOnMaster = (trackId: string, freq: HarmonicFrequency, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTrackCustomAudio(trackId, freq, url, file.name, undefined, true);
    }
  };
  const [queuedNotification, setQueuedNotification] = useState<string | null>(null);

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

          const archives = track.masterArchives && track.masterArchives.length === 4
            ? track.masterArchives
            : [
                { id: `${track.id}-440`, frequency: '440' as const, label: '440 Hz Standard', durationSeconds: 212, audioUrl: track.audioUrl, bitRate: '320 kbps', description: 'Accordage standard international de référence' },
                { id: `${track.id}-432`, frequency: '432' as const, label: '432 Hz Naturel', durationSeconds: 216, audioUrl: track.audioUrl, bitRate: '320 kbps', description: 'Diapason Verdi harmonique naturel' },
                { id: `${track.id}-phi`, frequency: 'phi' as const, label: "Φ 432 Hz Nombre d'Or", durationSeconds: 212, audioUrl: track.audioUrl, bitRate: '320 kbps', description: 'Harmonisation ratio divin 1.618 Hz' },
                { id: `${track.id}-binaural`, frequency: 'binaural' as const, label: '432Hz + 528Hz Binaural', durationSeconds: 212, audioUrl: track.audioUrl, bitRate: '320 kbps', description: 'Solfège Sacré & Réparation ADN' },
              ];

          return (
            <div
              key={track.id}
              id={`track-card-${track.id}`}
              className={`p-3.5 md:p-4 rounded-xl transition-all duration-200 flex flex-col justify-between ${
                isCurrent
                  ? 'bg-[#0B1516] border-2 border-[#00FF9D] shadow-[0_0_20px_rgba(0,255,157,0.2)]'
                  : 'bg-[#0F171B] border border-neutral-800/80 hover:border-neutral-700'
              }`}
            >
              {/* Top Row: Info and Actions */}
              <div className="flex items-center justify-between gap-3 w-full">
                {/* Left Play/Pause Icon Button & Metadata */}
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
                    {track.artistBio && (
                      <p className="text-[11px] text-neutral-400 font-sans line-clamp-1 mt-0.5">
                        {track.artistBio}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action and Price */}
                <div className="flex items-center gap-3 shrink-0">
                  <div
                    id={`price-box-${track.id}`}
                    onClick={() => onOpenCheckout('single', track)}
                    title={`Acheter le coffret 4 remasters de "${track.title}" (${track.priceCad.toFixed(2)} $ CAD)`}
                    className="text-right hidden sm:block cursor-pointer group/price hover:opacity-95 transition-opacity"
                  >
                    <div className="text-xs font-mono font-bold text-[#00FF9D] group-hover/price:underline">
                      {track.priceCad.toFixed(2)} $ CAD
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-end gap-1">
                      <span className="text-[#00FF9D]/80">4 Remasters</span>
                      <span className="text-neutral-600">•</span>
                      <span>320k</span>
                    </div>
                  </div>

                  {/* Add to Queue Button */}
                  <button
                    id={`btn-queue-${track.id}`}
                    onClick={() => {
                      addToQueue(track);
                      setQueuedNotification(track.id);
                      setTimeout(() => setQueuedNotification(null), 1500);
                    }}
                    title="Ajouter à la file d'attente"
                    aria-label={`Ajouter ${track.title} à la file d'attente`}
                    className="bg-neutral-800/90 hover:bg-neutral-700 active:scale-95 text-neutral-300 hover:text-[#00FF9D] p-2 rounded-lg border border-neutral-700/80 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
                  >
                    {queuedNotification === track.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#00FF9D]" />
                        <span className="text-[11px] text-[#00FF9D] hidden md:inline">Ajouté</span>
                      </>
                    ) : (
                      <>
                        <ListPlus className="w-3.5 h-3.5" />
                        <span className="text-[11px] hidden md:inline">+ File</span>
                      </>
                    )}
                  </button>

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

              {/* Archive des 4 Versions Master */}
              <div className="mt-3.5 pt-3 border-t border-neutral-800/80 w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Archive className="w-3.5 h-3.5 text-[#00FF9D]" />
                    <span className="font-semibold text-white tracking-wide">ARCHIVE DES 4 VERSIONS MASTER</span>
                    <span className="text-neutral-500 hidden md:inline">• Cases prêtes pour vos MP3 remasterisés</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#00FF9D]/80">
                    Bascule directe au clic (1 version à la fois)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { freq: '440' as HarmonicFrequency, name: '440 Hz Standard', tag: 'Standard Studio', icon: '🎛️', defaultDuration: '03:32' },
                    { freq: '432' as HarmonicFrequency, name: '432 Hz Naturel', tag: 'Naturel Verdi', icon: '🌿', defaultDuration: '03:36' },
                    { freq: 'phi' as HarmonicFrequency, name: "Φ 432 Hz Nombre d'Or", tag: "Ratio Φ 1.618 Hz", icon: '✨', defaultDuration: '03:32' },
                    { freq: 'binaural' as HarmonicFrequency, name: '432Hz + 528Hz Binaural', tag: 'Miracle 528Hz', icon: '🧬', defaultDuration: '03:32' },
                  ].map((slot) => {
                    const matchingArchive = track.masterArchives?.find((a) => a.id === slot.freq);
                    const isAssigned = Boolean(matchingArchive?.customAudioUrl);
                    const fileName = matchingArchive?.fileName;
                    const durationStr = matchingArchive?.duration || slot.defaultDuration;
                    const isThisMasterActive = isCurrent && activeFrequency === slot.freq;
                    const isThisMasterPlaying = isThisMasterActive && isPlaying;
                    const isDragOver = dragOverTarget === `${track.id}-${slot.freq}`;

                    if (!isAssigned) {
                      return (
                        <div
                          key={slot.freq}
                          id={`btn-archive-${track.id}-${slot.freq}`}
                          onClick={(e) => handleCustomAudioUpload(track.id, slot.freq, e)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverTarget(`${track.id}-${slot.freq}`);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDragOverTarget(null);
                          }}
                          onDrop={(e) => handleDropOnMaster(track.id, slot.freq, e)}
                          className={`p-2.5 rounded-lg text-left transition-all duration-150 border-2 border-dashed flex flex-col justify-between cursor-pointer group relative ${
                            isDragOver
                              ? 'border-[#00FF9D] bg-[#00FF9D]/10 text-white scale-[1.02]'
                              : 'border-neutral-700/70 bg-[#0d1418]/60 hover:border-[#00FF9D]/60 hover:bg-[#121c22] text-neutral-400 hover:text-neutral-200'
                          }`}
                          title={`Case vide : Cliquez ou glissez le MP3 remasterisé ${slot.name} - La lecture démarrera immédiatement`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold font-mono text-neutral-300 group-hover:text-white flex items-center gap-1 truncate">
                              <span>{slot.icon}</span>
                              <span className="truncate">{slot.name}</span>
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900/90 text-neutral-400 border border-neutral-800 shrink-0">
                              Vide
                            </span>
                          </div>

                          <div className="py-2.5 flex flex-col items-center justify-center text-center">
                            <div className="w-7 h-7 rounded-full bg-neutral-800/80 group-hover:bg-[#00FF9D]/20 group-hover:text-[#00FF9D] flex items-center justify-center text-neutral-400 transition-colors mb-1">
                              <Plus className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-mono text-neutral-300 group-hover:text-[#00FF9D] font-medium">
                              Insérer MP3
                            </span>
                            <span className="text-[9px] text-neutral-400">
                              Cliquer ou glisser
                            </span>
                          </div>

                          <div className="pt-1.5 border-t border-neutral-800/70 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                            <span>Non assigné</span>
                            <span className="text-[#00FF9D]/70 group-hover:text-[#00FF9D] flex items-center gap-0.5 text-[9px]">
                              <Upload className="w-2.5 h-2.5" />
                              <span>Charger</span>
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={slot.freq}
                        id={`btn-archive-${track.id}-${slot.freq}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          playTrackMaster(track, slot.freq);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverTarget(`${track.id}-${slot.freq}`);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverTarget(null);
                        }}
                        onDrop={(e) => handleDropOnMaster(track.id, slot.freq, e)}
                        className={`p-2.5 rounded-lg text-left transition-all duration-150 border flex flex-col justify-between cursor-pointer group relative ${
                          isDragOver
                            ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200 scale-[1.02]'
                            : isThisMasterActive
                            ? slot.freq === 'phi'
                              ? 'bg-[#221605] border-[#F59E0B] shadow-[0_0_16px_rgba(245,158,11,0.35)] text-amber-200 ring-1 ring-[#F59E0B]/40'
                              : slot.freq === 'binaural'
                              ? 'bg-[#1A0B2E] border-purple-500 shadow-[0_0_16px_rgba(168,85,247,0.35)] text-purple-200 ring-1 ring-purple-500/40'
                              : slot.freq === '432'
                              ? 'bg-[#0A1B14] border-[#00FF9D] shadow-[0_0_16px_rgba(0,255,157,0.3)] text-[#00FF9D] ring-1 ring-[#00FF9D]/40'
                              : 'bg-neutral-900 border-neutral-300 shadow-[0_0_16px_rgba(255,255,255,0.2)] text-white ring-1 ring-neutral-300/40'
                            : 'bg-[#121A1E] border-neutral-700/80 hover:border-neutral-500 hover:bg-[#182329] text-neutral-300'
                        }`}
                        title={`Écouter le master ${slot.name} (Bascule directe - 1 seule version à la fois)`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold font-mono truncate flex items-center gap-1">
                            <span>{slot.icon}</span>
                            <span className="truncate">{slot.name}</span>
                          </span>
                          <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-black/60 text-emerald-400 font-semibold border border-emerald-800/40 shrink-0">
                            {durationStr}
                          </span>
                        </div>

                        {fileName ? (
                          <div className="my-1.5 flex items-center gap-1 text-[10px] text-emerald-300 font-mono truncate bg-emerald-950/50 px-1.5 py-1 rounded border border-emerald-800/50" title={fileName}>
                            <FileAudio className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="truncate">{fileName}</span>
                          </div>
                        ) : (
                          <div className="my-1 text-[11px] text-neutral-400 font-sans truncate">
                            {slot.tag}
                          </div>
                        )}

                        <div className="mt-1 pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
                            <Check className="w-3 h-3" />
                            <span>Prêt</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleCustomAudioUpload(track.id, slot.freq, e)}
                              className="text-neutral-400 hover:text-emerald-400 p-0.5 rounded hover:bg-neutral-800 transition-colors"
                              title="Remplacer le fichier MP3"
                            >
                              <Upload className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTrackCustomAudio(track.id, slot.freq);
                              }}
                              className="text-neutral-400 hover:text-red-400 p-0.5 rounded hover:bg-neutral-800 transition-colors"
                              title="Vider cette case (remettre à vide)"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {isThisMasterPlaying ? (
                              <span className="inline-flex items-center gap-1 text-[#00FF9D] font-bold animate-pulse ml-0.5">
                                <Volume2 className="w-3 h-3" />
                                <span>En lecture</span>
                              </span>
                            ) : isThisMasterActive ? (
                              <span className="text-amber-400 font-semibold ml-0.5">Actif</span>
                            ) : (
                              <span className="text-neutral-300 group-hover:text-white flex items-center gap-1 ml-0.5">
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Écouter</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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

      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept="audio/mp3,audio/mpeg,audio/wav,audio/*"
        className="hidden"
      />
    </section>
  );
};
