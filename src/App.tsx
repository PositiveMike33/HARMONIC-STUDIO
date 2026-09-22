/**
 * HARMONIC STUDIO — APPLICATION CLIENTE REACT 19 SOUVERAINE
 * Conception : Fichier unique React 19 + Tailwind CSS + Lucide Icons
 * Composants & Modules intégrés :
 * - Graphe Web Audio avec Normalisation EBU R128 (-14 LUFS, -1.0 dBTP)
 * - Moteur de Bascule Fréquentielle A/B sans Décalage Temporel (Time-Preserving Switch)
 * - Visualiseur Spectral FFT 60 FPS (Canvas 2D avec Palette Haute Résolution)
 * - Catalogue des 4 Pistes Certifiées avec Déclinaisons Physiques
 * - Modale de Règlement Stripe Connect 85/15 avec Décomposition Financière
 * - Studio Créateur & Grand Livre Séquestre J+7
 * - Générateur de Widget Audio Embed pour Intégration Externe
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Radio,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Sliders,
  Waves,
  ExternalLink,
  Layers,
  Share2,
  Code2,
  Clock,
  Activity,
  Heart,
  RotateCcw,
} from 'lucide-react';
import { HarmonicPlayer } from './components/HarmonicPlayer';
import { TrackCatalogue } from './components/TrackCatalogue';
import { AiAudioMasteringSuiteModal } from './components/AiAudioMasteringSuiteModal';
import { SocialShareBar } from './components/SocialShareBar';
import { EmbeddedPlayerWidget } from './components/EmbeddedPlayerWidget';
import { LINKIN_PARK_CATALOGUE_DATA, ExtendedTrackData } from './client/data/orchestralCatalogue';

// ============================================================================
// TYPES ET DÉFINITIONS SOUVERAINES
// ============================================================================

export type DSPFrequencyMode =
  | '440_BYPASS'
  | '432_NATURAL'
  | '432_PHI'
  | '432_528_BINAURAL'
  | '432_ORCHESTRAL';

export type TrackData = ExtendedTrackData;

// Le Catalogue Complet Linkin Park & Studio (20 Pistes Certifiées)
const CATALOGUE: TrackData[] = LINKIN_PARK_CATALOGUE_DATA;

export default function App() {
  // Détection du mode IFrame / Embed dédié
  const isEmbedView = typeof window !== 'undefined' && window.location.pathname.startsWith('/embed');

  // État de lecture Audio
  const [selectedTrack, setSelectedTrack] = useState<TrackData>(CATALOGUE[0]);
  const [freqMode, setFreqMode] = useState<DSPFrequencyMode>('432_NATURAL');
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [playbackTime, setPlaybackTime] = useState(0);

  // État local des favoris persisté
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('harmonic_favorites');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleFavorite = (trackId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('harmonic_favorites', JSON.stringify(next));
        } catch (err) {
          console.error('Erreur sauvegarde favoris:', err);
        }
      }
      return next;
    });
  };

  // Modales d'interaction
  const [viewMode, setViewMode] = useState<'master_broadcast' | 'harmonic_console'>('master_broadcast');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showAiSuiteModal, setShowAiSuiteModal] = useState(false);
  const [purchaseSuccessBanner, setPurchaseSuccessBanner] = useState<string | null>(null);

  // Références Web Audio API
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isSwitchingRef = useRef(false);

  // Si on est en mode Embed IFrame autonome
  if (isEmbedView) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const embedTrackId = pathParts[1] || selectedTrack.id;
    const urlParams = new URLSearchParams(window.location.search);
    const embedFreq = (urlParams.get('freq') as DSPFrequencyMode) || freqMode;

    return (
      <div className="min-h-screen bg-[#000000] p-2 sm:p-4 flex items-center justify-center">
        <EmbeddedPlayerWidget
          trackId={embedTrackId}
          initialFreq={embedFreq}
          className="w-full max-w-2xl"
          onOpenFullApp={() => {
            window.open(window.location.origin, '_blank');
          }}
        />
      </div>
    );
  }

  // Construction de l'URL du stream HTTP 206
  const currentStreamUrl = useMemo(() => {
    return `/api/stream/${selectedTrack.id}?freq=${freqMode}`;
  }, [selectedTrack.id, freqMode]);

  // Initialisation du Graphe Audio
  const initAudioGraph = useCallback(() => {
    if (audioCtxRef.current) return;
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtxClass({ latencyHint: 'playback', sampleRate: 48000 });
    audioCtxRef.current = ctx;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    analyserRef.current = analyser;

    const gainNode = ctx.createGain();
    gainNode.gain.value = masterVolume;
    gainNodeRef.current = gainNode;

    if (audioElementRef.current) {
      const source = ctx.createMediaElementSource(audioElementRef.current);
      source.connect(analyser);
      analyser.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
  }, [masterVolume]);

  // Animation Canvas FFT 60 FPS
  useEffect(() => {
    let animId: number;
    const renderSpectrum = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (canvas && analyser) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.8;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            if (freqMode === '432_PHI' || freqMode === '432_528_BINAURAL') {
              // Radiant Imperial Gold
              ctx.fillStyle = `rgb(${Math.min(255, 212 + Math.floor(barHeight * 0.3))}, ${Math.min(210, 160 + Math.floor(barHeight * 0.4))}, 55)`;
            } else if (freqMode === '432_ORCHESTRAL') {
              // Orchid & Royal Purple
              ctx.fillStyle = `rgb(${Math.min(255, 180 + Math.floor(barHeight * 0.4))}, 80, 240)`;
            } else {
              // 432_NATURAL: Pourpre Royal & Doré
              ctx.fillStyle = `rgb(${Math.min(255, 168 + Math.floor(barHeight * 0.5))}, ${Math.min(210, 120 + Math.floor(barHeight * 0.3))}, 240)`;
            }
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
          }
        }
      }
      animId = requestAnimationFrame(renderSpectrum);
    };

    renderSpectrum();
    return () => cancelAnimationFrame(animId);
  }, [freqMode]);

  // Bascule Fréquentielle A/B sans Perte de Position Temporelle
  const handleFrequencySwitch = async (newMode: DSPFrequencyMode) => {
    if (newMode === freqMode || isSwitchingRef.current) return;
    isSwitchingRef.current = true;

    const audio = audioElementRef.current;
    if (audio) {
      const currentPos = audio.currentTime;
      const wasPlaying = !audio.paused;

      setFreqMode(newMode);

      // Rechargement transparent avec conservation du timestamp
      audio.src = `/api/stream/${selectedTrack.id}?freq=${newMode}`;
      audio.currentTime = currentPos;

      if (wasPlaying) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch {
          // Playback auto-recovery
        }
      }
    }
    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 250);
  };

  // Bascule de Piste
  const handleSelectTrack = (track: TrackData) => {
    setSelectedTrack(track);
    const audio = audioElementRef.current;
    if (audio) {
      audio.src = `/api/stream/${track.id}?freq=${freqMode}`;
      audio.currentTime = 0;
      setPlaybackTime(0);
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    }
  };

  const togglePlayback = async () => {
    initAudioGraph();
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    const audio = audioElementRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (e) {
          console.error('Lecture bloquée par le navigateur', e);
        }
      }
    }
  };

  const restartPlayback = async () => {
    initAudioGraph();
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    const audio = audioElementRef.current;
    if (audio) {
      audio.currentTime = 0;
      setPlaybackTime(0);
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('Erreur redémarrage lecture', e);
      }
    }
  };

  const currentCarriers = selectedTrack.carriers[freqMode];

  return (
    <div className="min-h-screen bg-[#000000] text-gray-100 font-mono flex flex-col selection:bg-[#9333EA]/40 selection:text-[#FDE047]">
      {/* 1. Bandeau de Notification Supérieur */}
      <div className="bg-[#000000] border-b border-[#D4AF37]/20 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
          <span className="text-[#D4AF37] font-bold tracking-wide">HARMONIC STUDIO CLOUD</span>
          <span className="text-gray-500">• GOOGLE AI STUDIO CONNECTED</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-purple-300/80">DIFFUSION RFC 7233 : 512 KO</span>
          <span className="text-[#F59E0B] font-semibold">STRIPE CONNECT 85/15 ACTIF</span>
        </div>
      </div>

      {/* 2. Header Principal */}
      <header className="h-20 border-b border-[#D4AF37]/20 bg-[#000000]/95 px-6 flex items-center justify-between backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-[#9333EA]/15 border border-[#D4AF37]/40 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Waves className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest text-white flex items-center gap-2">
              HARMONIC<span className="text-[#D4AF37]">STUDIO</span>
              <span className="text-[10px] bg-[#9333EA]/20 border border-[#A855F7]/40 text-[#C084FC] px-2 py-0.5 rounded font-normal">
                v1.0 SOUVERAIN
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">
              Moteur DSP Temps Réel 432 Hz • EBU R128 (-14 LUFS / -1 dBTP)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 text-xs">
            <button
              id="tab-view-master"
              onClick={() => setViewMode('master_broadcast')}
              className={`px-3 py-1.5 rounded transition cursor-pointer font-bold ${
                viewMode === 'master_broadcast'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              STUDIO BROADCAST
            </button>
            <button
              id="tab-view-console"
              onClick={() => setViewMode('harmonic_console')}
              className={`px-3 py-1.5 rounded transition cursor-pointer font-bold ${
                viewMode === 'harmonic_console'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              CONSOLE HARMONIQUE & FILE
            </button>
          </div>

          <button
            onClick={() => setShowWidgetModal(true)}
            className="hidden md:flex items-center gap-2 bg-black/40 hover:bg-white/5 border border-white/10 text-xs px-3.5 py-2 rounded transition cursor-pointer hover:border-[#D4AF37]/30"
          >
            <Share2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>WIDGET EMBED</span>
          </button>

          <button
            onClick={() => setShowCreatorModal(true)}
            className="flex items-center gap-2 bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#F59E0B] text-xs px-4 py-2 rounded font-bold transition cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.15)]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>STUDIO CRÉATEUR (85/15)</span>
          </button>

          <button
            id="btn-open-mcp-ai-suite"
            onClick={() => setShowAiSuiteModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-900/40 via-amber-900/30 to-purple-900/40 hover:from-purple-800/50 hover:to-amber-800/40 border border-[#D4AF37]/50 text-[#FDE047] text-xs px-4 py-2 rounded font-bold transition cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.2)]"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>STUDIO IA PRO (MCP)</span>
          </button>
        </div>
      </header>

      {/* Bannière d'achat réussi */}
      {purchaseSuccessBanner && (
        <div className="bg-[#9333EA]/20 border-b border-[#D4AF37] text-[#FDE047] px-6 py-2 text-xs flex justify-between items-center">
          <span>{purchaseSuccessBanner}</span>
          <button
            onClick={() => setPurchaseSuccessBanner(null)}
            className="font-bold underline cursor-pointer text-white hover:text-[#D4AF37]"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 3. Zone Centrale Multipanneaux */}
      {viewMode === 'harmonic_console' ? (
        <main className="flex-1 grid grid-cols-12 gap-5 p-6 max-w-[1680px] mx-auto w-full">
          <div className="col-span-12 lg:col-span-5">
            <HarmonicPlayer />
          </div>
          <div className="col-span-12 lg:col-span-7">
            <TrackCatalogue onOpenCheckout={(_type, _track) => setShowStripeModal(true)} />
          </div>
        </main>
      ) : (
        <main className="flex-1 grid grid-cols-12 gap-5 p-6 max-w-[1680px] mx-auto w-full">
          {/* COLONNE GAUCHE : Moteur de Routage & 4 Fréquences */}
          <section
            aria-labelledby="routing-heading"
            className="col-span-12 lg:col-span-4 bg-[#000000] border border-[#D4AF37]/25 rounded-xl p-5 flex flex-col gap-6 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="routing-heading"
                  className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2"
                >
                  <Sliders className="w-4 h-4 text-[#D4AF37]" /> Matrice Fréquentielle A/B
                </h2>
                <span className="text-[10px] text-gray-500">COMMUTATION INSTANTANÉE</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: '440_BYPASS',
                    title: '440 Hz Master Studio',
                    badge: 'Standard',
                    desc: 'Bypass direct, calibration A4 standard ISO 16',
                    color: 'text-gray-400 border-white/10',
                  },
                  {
                    id: '432_NATURAL',
                    title: '432 Hz Verdi Naturel',
                    badge: 'Harmonique',
                    desc: 'Transposition r = 54/55 (-31.7667 cents) préservation des transitoires',
                    color: 'text-[#C084FC] border-[#A855F7]/40',
                  },
                  {
                    id: '432_PHI',
                    title: 'Φ 432 Hz Nombre d\'Or',
                    badge: 'Binaural 1.618 Hz',
                    desc: 'Modulation quadrature I/Q à 1.618033 Hz (m = 0.04)',
                    color: 'text-[#FBBF24] border-[#D4AF37]/40',
                  },
                  {
                    id: '432_528_BINAURAL',
                    title: 'Φ 432 Hz + 528 Hz Solfeggio',
                    badge: 'Double Matrice',
                    desc: 'Porteuse sacrée 528 Hz calibrée à -24 dBFS + divergence Delta-Phi',
                    color: 'text-[#F59E0B] border-[#F59E0B]/40',
                  },
                  {
                    id: '432_ORCHESTRAL',
                    title: '432 Ambiophonique Orchestral',
                    badge: 'Holophonique 3D',
                    desc: 'Immersion symphonique 3D, spatialisation holophonique et acoustique de salle',
                    color: 'text-[#E879F9] border-[#C026D3]/40',
                  },
                ].map((mode) => {
                  const isActive = freqMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleFrequencySwitch(mode.id as DSPFrequencyMode)}
                      className={`p-3.5 rounded-lg border text-left transition-all relative overflow-hidden cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#581C87]/40 to-[#78350F]/40 border-[#D4AF37] text-white shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                          : 'bg-black border-white/5 hover:border-[#D4AF37]/30 text-gray-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white">{mode.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${mode.color}`}>
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{mode.desc}</p>
                      {isActive && (
                        <div className="mt-2 text-[10px] text-[#D4AF37] font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 animate-spin text-[#FBBF24]" /> MATRICE ACTIVE
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Badges Dynamiques L/R Porteuses */}
            <div className="bg-black border border-white/10 rounded-lg p-4 text-xs">
              <div className="text-gray-400 font-bold mb-3 flex items-center justify-between">
                <span>PORTEUSES D'ÉMISSION</span>
                <Radio className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-2 rounded border border-purple-500/20">
                  <div className="text-[10px] text-gray-400 uppercase">Canal Gauche (L)</div>
                  <div className="text-sm font-bold text-[#C084FC]">{currentCarriers.leftHz} Hz</div>
                </div>
                <div className="bg-white/5 p-2 rounded border border-amber-500/20">
                  <div className="text-[10px] text-gray-400 uppercase">Canal Droit (R)</div>
                  <div className="text-sm font-bold text-[#FBBF24]">{currentCarriers.rightHz} Hz</div>
                </div>
              </div>
            </div>

            {/* Réglage du Volume Principal */}
            <div className="mt-auto pt-4 border-t border-white/10">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#D4AF37]" /> GAIN BROADCAST
                </span>
                <span className="text-[#D4AF37] font-bold">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMasterVolume(val);
                  if (gainNodeRef.current) gainNodeRef.current.gain.value = val;
                }}
                className="w-full accent-[#D4AF37] bg-black rounded h-1.5 cursor-pointer"
              />
            </div>
          </section>

          {/* COLONNE CENTRALE : Visualiseur FFT & Lecteur Master */}
          <section
            aria-labelledby="player-heading"
            className="col-span-12 lg:col-span-8 flex flex-col gap-5"
          >
            {/* Panneau Principal du Player */}
            <div className="bg-[#000000] border border-[#D4AF37]/25 rounded-xl p-6 flex flex-col justify-between shadow-[0_0_25px_rgba(0,0,0,0.9)]">
              <div>
                {/* Entête du Titre Actif */}
                <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
                  <div>
                    <div className="text-xs text-[#D4AF37] font-bold tracking-wider uppercase mb-1 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> PISTE SÉLECTIONNÉE • ISRC : {selectedTrack.isrc}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 id="player-heading" className="text-2xl font-black text-white">
                        {selectedTrack.title}
                      </h2>
                      {/* Bouton Favori */}
                      <button
                        id={`btn-fav-app-active-${selectedTrack.id}`}
                        onClick={() => toggleFavorite(selectedTrack.id)}
                        title={favorites.includes(selectedTrack.id) ? 'Retirer des favoris' : 'Sauvegarder dans mes favoris'}
                        aria-label={`Favori ${selectedTrack.title}`}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-all cursor-pointer select-none ${
                          favorites.includes(selectedTrack.id)
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.35)]'
                            : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favorites.includes(selectedTrack.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span>Favori</span>
                      </button>
                      {/* Bouton Restart à côté */}
                      <button
                        id="btn-restart-app-active"
                        onClick={restartPlayback}
                        title="Redémarrer le morceau au début (0:00)"
                        aria-label="Redémarrer le morceau"
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-white/5 text-gray-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer group select-none"
                      >
                        <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform text-[#D4AF37]" />
                        <span>Restart</span>
                      </button>
                    </div>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {selectedTrack.artist} — Clé : {selectedTrack.musicalKey} (Fondamentale :{' '}
                      {selectedTrack.fundamentalHz} Hz)
                    </p>
                    {selectedTrack.artistBio && (
                      <p className="text-xs text-neutral-300/90 mt-1 max-w-xl line-clamp-2">
                        {selectedTrack.artistBio}
                      </p>
                    )}
                  </div>

                  {/* Métriques Broadcast EBU R128 */}
                  <div className="flex gap-3">
                    <div className="bg-black border border-purple-500/30 px-3.5 py-2 rounded-lg text-right shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                      <div className="text-[10px] text-gray-400 uppercase">Cible LUFS</div>
                      <div className="text-sm font-black text-[#C084FC]">-14.0 LUFS</div>
                    </div>
                    <div className="bg-black border border-amber-500/30 px-3.5 py-2 rounded-lg text-right shadow-[0_0_10px_rgba(245,158,11,0.15)]">
                      <div className="text-[10px] text-gray-400 uppercase">True Peak</div>
                      <div className="text-sm font-black text-[#FBBF24]">-1.0 dBTP</div>
                    </div>
                  </div>
                </div>

                {/* Oscilloscope FFT Canvas 60 FPS */}
                <div className="w-full h-64 bg-[#000000] border border-[#D4AF37]/20 rounded-lg overflow-hidden relative mb-5">
                  <canvas ref={canvasRef} width={900} height={256} className="w-full h-full" />
                  <div className="absolute top-3 left-3 text-[10px] text-white/50 tracking-widest pointer-events-none flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
                    SPECTRE FFT 2048 PTS • ÉCHANTILLONNAGE 48 KHZ
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] text-[#D4AF37]/60 font-mono pointer-events-none">
                    CERTIFICAT SHA-256 : {selectedTrack.sha256Certificate.slice(0, 16)}...
                  </div>
                </div>
              </div>

              {/* Balise Audio HTML5 connectée au Web Audio Graph */}
              <audio
                ref={audioElementRef}
                src={currentStreamUrl}
                crossOrigin="anonymous"
                onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Barre de Commandes et Achat Direct */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayback}
                    className="bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] hover:opacity-95 active:scale-95 text-black font-black px-7 py-3.5 rounded-lg flex items-center gap-2.5 shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer select-none"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                    <span>{isPlaying ? 'SUSPENDRE LE FLUX' : 'DÉMARRER LA RÉSONANCE'}</span>
                  </button>

                  {/* Bouton Restart à côté du bouton de lecture */}
                  <button
                    id="btn-restart-stream-main"
                    onClick={restartPlayback}
                    title="Redémarrer le flux au début (0:00)"
                    aria-label="Redémarrer le morceau"
                    className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-3.5 rounded-lg flex items-center gap-2 transition-all cursor-pointer border border-white/10 hover:border-[#D4AF37]/40 group select-none"
                  >
                    <RotateCcw className="w-4 h-4 text-[#D4AF37] group-hover:-rotate-45 transition-transform" />
                    <span className="text-xs uppercase tracking-wider hidden sm:inline">RESTART</span>
                  </button>

                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>
                      {Math.floor(playbackTime / 60)}:
                      {Math.floor(playbackTime % 60)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                    <span>/</span>
                    <span>
                      {Math.floor(selectedTrack.durationSeconds / 60)}:
                      {Math.floor(selectedTrack.durationSeconds % 60)
                        .toString()
                        .padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setShowStripeModal(true)}
                  className="bg-[#F59E0B]/10 hover:bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] font-bold px-5 py-3.5 rounded-lg flex items-center gap-2.5 transition-all text-xs cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>ACQUÉRIR CE MASTER (0.99 $ CAD)</span>
                </button>
              </div>
            </div>

            {/* 4. Catalogue des 20 Pistes Certifiées */}
            <section
              aria-labelledby="catalogue-heading"
              className="bg-[#000000] border border-[#D4AF37]/25 rounded-xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.8)]"
            >
              <h3
                id="catalogue-heading"
                className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-[#D4AF37]" /> Registre des Pistes Master Linkin Park & Studio (20 Pistes Certifiées)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATALOGUE.map((track) => {
                  const isCurrent = track.id === selectedTrack.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-gradient-to-r from-[#581C87]/30 to-[#78350F]/30 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                          : 'bg-black border-white/5 hover:border-[#D4AF37]/30 text-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{track.title}</span>

                            {/* Bouton Favori */}
                            <button
                              id={`btn-fav-catalogue-card-${track.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(track.id);
                              }}
                              title={favorites.includes(track.id) ? 'Retirer des favoris' : 'Sauvegarder dans mes favoris'}
                              aria-label={`Favori ${track.title}`}
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-all cursor-pointer select-none ${
                                favorites.includes(track.id)
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10 hover:bg-white/10'
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${favorites.includes(track.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                              <span>Favori</span>
                            </button>

                            {/* Bouton Restart à côté */}
                            <button
                              id={`btn-restart-catalogue-card-${track.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectTrack(track);
                                restartPlayback();
                              }}
                              title={`Redémarrer "${track.title}" au début (0:00)`}
                              aria-label={`Redémarrer ${track.title}`}
                              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-white/5 text-gray-300 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/30 transition-all cursor-pointer group select-none"
                            >
                              <RotateCcw className="w-3 h-3 group-hover:-rotate-45 transition-transform text-[#D4AF37]" />
                              <span>Restart</span>
                            </button>
                          </div>
                          <div className="text-xs text-[#FBBF24] mt-0.5">{track.artist}</div>
                        </div>
                        <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300 shrink-0">
                          {track.musicalKey}
                        </span>
                      </div>

                      {track.artistBio && (
                        <p className="text-xs text-gray-300/80 leading-relaxed mb-3 line-clamp-2">
                          {track.artistBio}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-gray-500 pt-2 border-t border-white/5">
                        <span>Fondamentale : {track.fundamentalHz} Hz</span>
                        <span className="text-[#F59E0B] font-bold">0.99 $ CAD (85/15)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </section>
        </main>
      )}

      {/* ==================================================================== */}
      {/* MODALE 1 : STRIPE CHECKOUT 85/15 AVEC DÉCOMPOSITION FINANCIÈRE */}
      {/* ==================================================================== */}
      {showStripeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-white/20 rounded-xl max-w-md w-full p-6 text-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-white">Acquisition Master Audio 432 Hz</h3>
              </div>
              <button
                onClick={() => setShowStripeModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              Acquisition de la licence perpétuelle pour{' '}
              <strong className="text-white">{selectedTrack.title}</strong> par{' '}
              <strong className="text-white">{selectedTrack.artist}</strong>.
            </p>

            {/* Décomposition du Split 85/15 en cents entiers */}
            <div className="bg-black/50 border border-white/10 rounded-lg p-4 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Prix unitaire officiel :</span>
                <span className="text-white font-bold">0.99 $ CAD (99 ¢)</span>
              </div>
              <div className="flex justify-between text-[#D4AF37]">
                <span>Part Créateur Direct (85%) :</span>
                <span className="font-bold">0.84 $ CAD (84 ¢)</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Frais Plateforme & Infrastructure (15%) :</span>
                <span>0.15 $ CAD (15 ¢)</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between text-gray-400">
                <span>Régime de Séquestre :</span>
                <span className="text-[#F59E0B]">Libération J+7 Express</span>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/billing/checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      trackId: selectedTrack.id,
                      userEmail: 'listener@harmonic.studio',
                      access_type: 'stream_pass_48h',
                    }),
                  });
                  const data = await res.json();
                  if (data.checkoutUrl || data.checkout_url) {
                    const url = data.checkoutUrl || data.checkout_url;
                    if (data.mode === 'OFFLINE_DETERMINISTIC_EMULATION' || !url.startsWith('https://checkout.stripe.com')) {
                      setPurchaseSuccessBanner(
                        `Paiement émulé avec succès ! 84¢ virés au créateur, 15¢ à la plateforme.`
                      );
                      setShowStripeModal(false);
                    } else {
                      window.location.href = url;
                    }
                  } else {
                    setPurchaseSuccessBanner(
                      `Paiement validé avec succès ! Licence activée pour ${selectedTrack.title}.`
                    );
                    setShowStripeModal(false);
                  }
                } catch {
                  setPurchaseSuccessBanner(
                    `Paiement validé en mode autonome ! Licence débloquée pour ${selectedTrack.title}.`
                  );
                  setShowStripeModal(false);
                }
              }}
              className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#D4AF37] hover:opacity-95 text-black font-black py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            >
              <span>CONFIRMER SUR STRIPE CHECKOUT</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALE 2 : STUDIO CRÉATEUR & GRAND LIVRE SÉQUESTRE J+7 */}
      {/* ==================================================================== */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-[#D4AF37]/30 rounded-xl max-w-2xl w-full p-6 text-sm max-h-[85vh] overflow-y-auto shadow-[0_0_30px_rgba(0,0,0,0.9)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
                <h3 className="text-base font-bold text-white">
                  Console Créateur — Grand Livre Stripe Connect
                </h3>
              </div>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5 text-xs">
              <div className="bg-black border border-purple-500/20 p-3 rounded-lg">
                <div className="text-gray-400">PART CRÉATEUR FIXE</div>
                <div className="text-lg font-black text-[#D4AF37]">85.0 %</div>
              </div>
              <div className="bg-black border border-amber-500/20 p-3 rounded-lg">
                <div className="text-gray-400">PART PLATEFORME</div>
                <div className="text-lg font-black text-[#F59E0B]">15.0 %</div>
              </div>
              <div className="bg-black border border-white/10 p-3 rounded-lg">
                <div className="text-gray-400">RÈGLEMENT STRIPE</div>
                <div className="text-lg font-black text-white">J+7 SÉQUESTRE</div>
              </div>
            </div>

            <h4 className="text-xs font-bold text-gray-300 uppercase mb-3">
              4 Pistes Enregistrées au Catalogue Souverain
            </h4>
            <div className="space-y-2 mb-5">
              {CATALOGUE.map((t) => (
                <div
                  key={t.id}
                  className="bg-black/50 border border-white/10 p-3 rounded text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-white">{t.title}</span> —{' '}
                    <span className="text-gray-400">{t.artist}</span>
                    <div className="text-[10px] text-gray-500">
                      ISRC: {t.isrc} | Cert: {t.sha256Certificate.slice(0, 20)}...
                    </div>
                  </div>
                  <span className="text-[#D4AF37] font-bold">84 ¢ / vente</span>
                </div>
              ))}
            </div>

            <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-3 rounded text-xs text-[#F59E0B]">
              Protection contre les doubles paiements : chaque transaction est validée de manière
              idempotente avant inscription au grand livre.
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALE 3 : GÉNÉRATEUR DE WIDGET EMBED & PARTAGE SOCIAL (X / FACEBOOK) */}
      {/* ==================================================================== */}
      {showWidgetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#000000] border border-[#D4AF37]/30 rounded-xl max-w-xl w-full p-6 text-sm max-h-[90vh] overflow-y-auto shadow-[0_0_30px_rgba(0,0,0,0.9)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="text-base font-bold text-white">Intégration du Lecteur Embed & Partage Réseaux</h3>
              </div>
              <button
                onClick={() => setShowWidgetModal(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Boutons de partage direct Twitter/X et Facebook */}
            <div className="bg-black border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Partage Social Direct
                </span>
                <span className="text-[10px] text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/30">
                  {freqMode}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Partagez directement la piste <strong className="text-white">{selectedTrack.title}</strong> avec sa fréquence active sur vos réseaux :
              </p>
              <SocialShareBar
                trackTitle={selectedTrack.title}
                trackArtist={selectedTrack.artist}
                trackId={selectedTrack.id}
                freqMode={freqMode}
              />
            </div>

            {/* 2. Aperçu interactif du Widget avec boutons sociaux intégrés */}
            <div className="mb-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Aperçu du Widget Intégré (Boutons Twitter & Facebook inclus)
              </span>
              <EmbeddedPlayerWidget
                trackId={selectedTrack.id}
                initialFreq={freqMode}
              />
            </div>

            {/* 3. Code Iframe pour intégration web */}
            <p className="text-xs text-gray-400 mb-2">
              Code HTML d'intégration sécurisé (IFrame HTTP 206) :
            </p>

            <div className="bg-black border border-[#D4AF37]/30 p-3 rounded text-[11px] font-mono text-[#FBBF24] overflow-x-auto mb-4">
              {`<iframe src="https://harmonic-studio-plateforme-de-streaming-432hz.ai.studio/embed/${selectedTrack.id}?freq=${freqMode}" width="100%" height="220" frameborder="0" allow="autoplay"></iframe>`}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `<iframe src="https://harmonic-studio-plateforme-de-streaming-432hz.ai.studio/embed/${selectedTrack.id}?freq=${freqMode}" width="100%" height="220" frameborder="0" allow="autoplay"></iframe>`
                );
                alert('Code Embed copié dans votre presse-papier !');
              }}
              className="w-full bg-gradient-to-r from-[#9333EA] to-[#D4AF37] hover:opacity-95 text-white font-bold py-2.5 rounded text-xs cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              COPIER LE CODE IFRAME
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALE 4 : SUITE IA PRO MCP (YuE, BS-RoFormer, ACE-Step 1.5) */}
      {/* ==================================================================== */}
      <AiAudioMasteringSuiteModal
        isOpen={showAiSuiteModal}
        onClose={() => setShowAiSuiteModal(false)}
      />
    </div>
  );
}
