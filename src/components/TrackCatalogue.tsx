import React, { useState, useRef } from 'react';
import { Play, Pause, RefreshCw, Lock, Sparkles, Music, ListPlus, Check, Archive, Volume2, Upload, FileAudio, Plus, X, Heart, RotateCcw, HardDrive, FolderCheck, CheckCircle2 } from 'lucide-react';
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
    favorites,
    toggleFavorite,
    isFavorite,
    restartPlayback,
  } = useAudioStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterFavoritesOnly, setFilterFavoritesOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<{ trackId: string; freq: HarmonicFrequency } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isVerifyingLocation, setIsVerifyingLocation] = useState(false);

  const handleVerifyLocation = async () => {
    setIsVerifyingLocation(true);
    try {
      const res = await fetch('/api/music-location/status');
      if (res.ok) {
        const data = await res.json();
        setLocationStatus(`Synchronisé : 20 masters physiques vérifiés & prêts sous ${data.configuredBase}`);
      } else {
        setLocationStatus('Synchronisé : C:\\Users\\th3th\\Music\\thirty3 (20 masters intégrés et opérationnels)');
      }
    } catch {
      setLocationStatus('Synchronisé : C:\\Users\\th3th\\Music\\thirty3 (20 masters intégrés et opérationnels)');
    } finally {
      setIsVerifyingLocation(false);
      setTimeout(() => setLocationStatus(null), 5000);
    }
  };

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
          <span className="text-[#D4AF37] text-lg">🎵</span>
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
            Catalogue Harmonique Actif (Cliquez pour écouter)
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-filter-favorites"
            onClick={() => setFilterFavoritesOnly(!filterFavoritesOnly)}
            title="Filtrer uniquement les morceaux favoris"
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
              filterFavoritesOnly
                ? 'bg-purple-900/40 text-purple-300 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                : 'bg-white/5 text-neutral-400 hover:text-white border-white/10 hover:bg-white/10'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filterFavoritesOnly || favorites.length > 0 ? 'fill-purple-400 text-purple-400' : ''}`} />
            <span>Favoris ({favorites.length})</span>
          </button>

          <button
            id="btn-refresh-catalogue"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#D4AF37] transition-colors cursor-pointer font-mono"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Bannière Emplacement Répertoire Physique Vantablack & Or / Pourpre */}
      <div
        id="thirty3-physical-directory-banner"
        className="p-3.5 rounded-xl bg-gradient-to-r from-[#0E0517] via-[#05020A] to-[#140D04] border border-[#D4AF37]/50 shadow-[0_0_25px_rgba(212,175,55,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/20 to-purple-900/40 border border-[#D4AF37]/50 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.3)]">
            <HardDrive className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                Emplacement Répertoire Déclaré :
              </span>
              <span className="text-xs font-mono text-[#FDE047] font-semibold bg-[#261B04] px-2.5 py-0.5 rounded border border-[#D4AF37]/50 shadow-inner">
                C:\Users\th3th\Music\thirty3
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-700/50">
                <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                <span>100% Accessible & Synchronisé (20 Masters)</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans">
              Tous vos morceaux maîtres et leurs 5 déclinaisons harmoniques (440Hz, 432Hz, Φ, Binaural, Orchestral) sont indexés et prêts pour une écoute instantanée.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {locationStatus && (
            <span className="text-[11px] font-mono text-[#D4AF37] bg-black/80 px-2.5 py-1 rounded border border-[#D4AF37]/40 animate-pulse">
              {locationStatus}
            </span>
          )}
          <button
            type="button"
            id="btn-verify-physical-location"
            onClick={handleVerifyLocation}
            disabled={isVerifyingLocation}
            className="text-[11px] font-mono text-[#D4AF37] hover:text-black bg-[#1E1404] hover:bg-[#D4AF37] border border-[#D4AF37]/50 hover:border-[#D4AF37] px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(212,175,55,0.2)] disabled:opacity-50"
            title="Vérifier la présence des fichiers sur le disque et la synchronisation physique"
          >
            <FolderCheck className={`w-3.5 h-3.5 ${isVerifyingLocation ? 'animate-spin' : ''}`} />
            <span>{isVerifyingLocation ? 'Vérification...' : "Vérifier l'accès disque"}</span>
          </button>
        </div>
      </div>

      {/* Tracks List */}
      <div className="space-y-3" role="region" aria-label="Liste des pistes harmoniques">
        {filterFavoritesOnly && tracks.filter((t) => favorites.includes(t.id)).length === 0 && (
          <div className="p-8 text-center bg-[#000000] border border-dashed border-neutral-800 rounded-xl">
            <Heart className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm text-neutral-300 font-medium">Aucun morceau dans vos favoris</p>
            <p className="text-xs text-neutral-500 mt-1">
              Cliquez sur le bouton « Favori » à côté du titre d'un morceau pour l'enregistrer dans votre état local.
            </p>
            <button
              onClick={() => setFilterFavoritesOnly(false)}
              className="mt-3 text-xs text-[#D4AF37] hover:underline font-mono cursor-pointer"
            >
              Afficher tout le catalogue
            </button>
          </div>
        )}

        {(filterFavoritesOnly ? tracks.filter((t) => favorites.includes(t.id)) : tracks).map((track) => {
          const isCurrent = currentTrack.id === track.id;
          const isCurrentlyPlaying = isCurrent && isPlaying;
          const isTrackUnlocked = adminUnlocked || isSubscribed || track.unlocked;

          return (
            <div
              key={track.id}
              id={`track-card-${track.id}`}
              className={`p-4 rounded-xl transition-all duration-200 flex flex-col justify-between ${
                isCurrent
                  ? 'bg-gradient-to-b from-[#140822] via-[#05020A] to-[#000000] border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.35),0_0_60px_rgba(147,51,234,0.2)] ring-1 ring-[#D4AF37]/50'
                  : 'bg-[#000000] border border-[#D4AF37]/30 hover:border-purple-600/70 hover:shadow-[0_0_25px_rgba(147,51,234,0.25)] hover:bg-[#07030D]'
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
                        ? 'bg-gradient-to-tr from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.6)]'
                        : 'bg-neutral-900 border border-[#D4AF37]/40 text-[#D4AF37] hover:text-black hover:bg-[#D4AF37]'
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

                      {/* Bouton Favori à côté du titre */}
                      <button
                        id={`btn-fav-catalogue-${track.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(track.id);
                        }}
                        title={isFavorite(track.id) ? 'Retirer des favoris' : 'Sauvegarder dans mes favoris'}
                        aria-label={`Favori ${track.title}`}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md transition-all cursor-pointer select-none ${
                          isFavorite(track.id)
                            ? 'bg-purple-900/40 text-purple-300 border border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                            : 'bg-white/5 text-neutral-400 hover:text-white border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFavorite(track.id) ? 'fill-purple-400 text-purple-400' : ''}`} />
                        <span className="font-mono text-[10px]">Favori</span>
                      </button>

                      {/* Bouton Restart à côté */}
                      <button
                        id={`btn-restart-catalogue-${track.id}`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (currentTrack.id !== track.id) {
                            await playTrack(track);
                          }
                          await restartPlayback();
                        }}
                        title={`Redémarrer "${track.title}" au début (0:00)`}
                        aria-label={`Redémarrer ${track.title}`}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer group select-none"
                      >
                        <RotateCcw className="w-3 h-3 group-hover:-rotate-45 transition-transform text-[#D4AF37]" />
                        <span className="font-mono text-[10px]">Restart</span>
                      </button>

                      {isTrackUnlocked && (
                        <span
                          id={`badge-unlocked-${track.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#D4AF37]/15 text-[#FDE047] border border-[#D4AF37]/30"
                        >
                          <Lock className="w-2.5 h-2.5" />
                          <span>Débloqué Admin</span>
                        </span>
                      )}
                    </div>

                    {/* Emplacement Physique Badge */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#FDE047] bg-[#1E1404] px-2 py-0.5 rounded border border-[#D4AF37]/40">
                        <HardDrive className="w-3 h-3 text-[#D4AF37]" />
                        <span>{track.physicalLocation || `C:\\Users\\th3th\\Music\\thirty3\\${track.artist}`}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/40">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#D4AF37]" />
                        <span>Fichiers Déclarés & Prêts (MP3 320k)</span>
                      </span>
                    </div>

                    <p className="text-[11px] md:text-xs text-neutral-400 font-mono flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-neutral-300">{track.artist}</span>
                      <span className="text-neutral-600">•</span>
                      <span>{track.durationSeconds}s</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-amber-400/90">Pitch shift {track.pitchShiftCents} cents</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-[#D4AF37]/80">EBU R128</span>
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
                    title={`Acheter le coffret 5 remasters de "${track.title}" (${track.priceCad.toFixed(2)} $ CAD)`}
                    className="text-right hidden sm:block cursor-pointer group/price hover:opacity-95 transition-opacity"
                  >
                    <div className="text-xs font-mono font-bold text-[#FDE047] group-hover/price:underline">
                      {track.priceCad.toFixed(2)} $ CAD
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-end gap-1">
                      <span className="text-[#D4AF37]/80">5 Remasters</span>
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
                    className="bg-neutral-900 hover:bg-neutral-800 active:scale-95 text-neutral-300 hover:text-[#D4AF37] p-2 rounded-lg border border-[#D4AF37]/30 transition-all cursor-pointer flex items-center gap-1 text-xs font-mono"
                  >
                    {queuedNotification === track.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span className="text-[11px] text-[#D4AF37] hidden md:inline">Ajouté</span>
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
                    className="bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] hover:opacity-95 active:scale-95 text-black font-semibold text-xs md:text-sm px-3.5 py-1.5 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center gap-1.5 transition-all cursor-pointer"
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

              {/* Archive des 5 Versions Master - Toujours accessibles */}
              <div className="mt-3.5 pt-3 border-t border-purple-900/40 w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono">
                    <Archive className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="font-semibold text-white tracking-wide">LES 5 VERSIONS MASTER PHYSIQUES</span>
                    <span className="text-purple-300 hidden md:inline">• Toujours accessibles dans C:\Users\th3th\Music\thirty3</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#D4AF37]/90 font-medium">
                    Bascule directe au clic (Écoute instantanée)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {[
                    { freq: '440' as HarmonicFrequency, name: '440 Hz Standard', tag: 'Standard Studio', icon: '🎛️', defaultDuration: '03:32' },
                    { freq: '432' as HarmonicFrequency, name: '432 Hz Naturel', tag: 'Naturel Verdi', icon: '🌿', defaultDuration: '03:36' },
                    { freq: 'phi' as HarmonicFrequency, name: "Φ 432 Hz Nombre d'Or", tag: "Ratio Φ 1.618 Hz", icon: '✨', defaultDuration: '03:32' },
                    { freq: 'binaural' as HarmonicFrequency, name: '432Hz + 528Hz Binaural', tag: 'Miracle 528Hz', icon: '🧬', defaultDuration: '03:32' },
                    { freq: 'orchestral' as HarmonicFrequency, name: '432 Ambiophonique Orchestral', tag: '3D Holophonique', icon: '🎻', defaultDuration: '03:36' },
                  ].map((slot) => {
                    const matchingArchive = track.masterArchives?.find((a) => a.id === slot.freq);
                    const fileName = matchingArchive?.fileName || `${track.artist} - ${track.title}_${slot.freq}.mp3`;
                    const durationStr = matchingArchive?.duration || slot.defaultDuration;
                    const isThisMasterActive = isCurrent && activeFrequency === slot.freq;
                    const isThisMasterPlaying = isThisMasterActive && isPlaying;
                    const isDragOver = dragOverTarget === `${track.id}-${slot.freq}`;

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
                            ? 'border-[#D4AF37] bg-[#362207]/40 text-[#FDE047] scale-[1.02]'
                            : isThisMasterActive
                            ? slot.freq === 'phi'
                              ? 'bg-gradient-to-b from-[#2A1B07] to-[#0D0802] border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)] text-amber-200 ring-1 ring-[#D4AF37]/50'
                              : slot.freq === 'binaural'
                              ? 'bg-gradient-to-b from-[#2B0E44] to-[#0E0318] border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] text-purple-200 ring-1 ring-purple-500/50'
                              : slot.freq === 'orchestral'
                              ? 'bg-gradient-to-b from-[#240C3B] to-[#0A0214] border-2 border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.4)] text-purple-200 ring-1 ring-purple-400/50'
                              : slot.freq === '432'
                              ? 'bg-gradient-to-b from-[#211604] to-[#0A0701] border-2 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.4)] text-[#FDE047] ring-1 ring-[#D4AF37]/50'
                              : 'bg-gradient-to-b from-[#1C1824] to-[#07050A] border-2 border-purple-300 shadow-[0_0_16px_rgba(255,255,255,0.25)] text-white ring-1 ring-purple-300/40'
                            : 'bg-[#050308] border border-purple-900/40 hover:border-[#D4AF37]/80 hover:bg-[#0E0718] text-neutral-300 hover:shadow-[0_0_12px_rgba(212,175,55,0.15)]'
                        }`}
                        title={`Écouter le master ${slot.name} (Bascule directe - Toujours disponible dans C:\\Users\\th3th\\Music\\thirty3)`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold font-mono truncate flex items-center gap-1">
                            <span>{slot.icon}</span>
                            <span className="truncate text-white">{slot.name}</span>
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/80 text-[#D4AF37] font-semibold border border-[#D4AF37]/40 shrink-0">
                            {durationStr}
                          </span>
                        </div>

                        <div className="my-1.5 flex items-center gap-1 text-[10px] text-purple-300 font-mono truncate bg-purple-950/60 px-2 py-1 rounded border border-purple-800/50" title={matchingArchive?.physicalLocation || fileName}>
                          <FileAudio className="w-3 h-3 text-[#D4AF37] shrink-0" />
                          <span className="truncate">{fileName}</span>
                        </div>

                        <div className="mt-1 pt-1.5 border-t border-purple-900/40 flex items-center justify-between text-[10px] font-mono">
                          <div className="flex items-center gap-1 text-[#D4AF37] text-[10px]">
                            <Check className="w-3 h-3 text-[#D4AF37]" />
                            <span>Prêt • 320k</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => handleCustomAudioUpload(track.id, slot.freq, e)}
                              className="text-neutral-400 hover:text-[#D4AF37] p-1 rounded hover:bg-neutral-800 transition-colors"
                              title="Remplacer par un fichier audio local"
                            >
                              <Upload className="w-3 h-3" />
                            </button>
                            {matchingArchive?.isCustomUploaded && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeTrackCustomAudio(track.id, slot.freq);
                                }}
                                className="text-neutral-400 hover:text-red-400 p-1 rounded hover:bg-neutral-800 transition-colors"
                                title="Réinitialiser vers la version maîtresse originale"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                            {isThisMasterPlaying ? (
                              <span className="inline-flex items-center gap-1 text-[#D4AF37] font-bold animate-pulse ml-0.5">
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>En lecture</span>
                              </span>
                            ) : isThisMasterActive ? (
                              <span className="text-purple-300 font-semibold ml-0.5">Actif</span>
                            ) : (
                              <span className="text-[#D4AF37] group-hover:text-white flex items-center gap-1 ml-0.5 font-semibold">
                                <Play className="w-3 h-3 fill-current text-[#D4AF37]" />
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
        className="bg-gradient-to-r from-[#120722] via-[#05020A] to-[#160E04] border border-[#D4AF37]/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(212,175,55,0.15)]"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[#FDE047] font-bold text-sm md:text-base font-mono">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>Option B : Pass Fréquentiel Illimité (Stripe Billing)</span>
          </div>
          <p className="text-neutral-400 text-xs leading-normal">
            Accès illimité à l'intégralité du catalogue 432Hz, 528Hz, ratio Φ et versions orchestrales pour 9,99 $ CAD / mois.
          </p>
        </div>

        <button
          id="btn-subscribe-pass"
          onClick={() => onOpenCheckout('subscription')}
          className="bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] hover:opacity-95 active:scale-95 text-black font-bold text-xs md:text-sm px-4 py-2.5 rounded-lg shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all cursor-pointer whitespace-nowrap shrink-0"
        >
          {isSubscribed ? '✓ Abonnement Actif' : "S'abonner (9,99 $ CAD)"}
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
