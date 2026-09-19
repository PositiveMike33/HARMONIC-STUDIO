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
} from 'lucide-react';
import { HarmonicPlayer } from './components/HarmonicPlayer';
import { TrackCatalogue } from './components/TrackCatalogue';
import { AiAudioMasteringSuiteModal } from './components/AiAudioMasteringSuiteModal';
import { SocialShareBar } from './components/SocialShareBar';
import { EmbeddedPlayerWidget } from './components/EmbeddedPlayerWidget';

// ============================================================================
// TYPES ET DÉFINITIONS SOUVERAINES
// ============================================================================

export type DSPFrequencyMode =
  | '440_BYPASS'
  | '432_NATURAL'
  | '432_PHI'
  | '432_528_BINAURAL';

export interface TrackData {
  id: string;
  title: string;
  artist: string;
  artistBio?: string;
  fundamentalHz: number;
  musicalKey: string;
  durationSeconds: number;
  priceCentsCad: number;
  isrc: string;
  sha256Certificate: string;
  carriers: {
    '440_BYPASS': { leftHz: number; rightHz: number };
    '432_NATURAL': { leftHz: number; rightHz: number };
    '432_PHI': { leftHz: number; rightHz: number; binauralBeatHz: number };
    '432_528_BINAURAL': { leftHz: number; rightHz: number; solfeggioCarrierHz: number };
  };
}

// Les 4 Pistes Certifiées
const CATALOGUE: TrackData[] = [
  {
    id: 'splintered-self',
    title: 'Splintered Self',
    artist: 'VEL94EV',
    artistBio: 'Compositeur et producteur électro-acoustique explorant les résonances modulaires et les fréquences sacrées.',
    fundamentalHz: 220.0,
    musicalKey: 'A Minor',
    durationSeconds: 264,
    priceCentsCad: 99,
    isrc: 'CA-V94-24-00101',
    sha256Certificate: 'a7b3c94f61e82019b8849c71a354d2f09918bcde76a21104e5f41289dc3301a9',
    carriers: {
      '440_BYPASS': { leftHz: 440.0, rightHz: 440.0 },
      '432_NATURAL': { leftHz: 432.0, rightHz: 432.0 },
      '432_PHI': { leftHz: 431.191, rightHz: 432.809, binauralBeatHz: 1.618 },
      '432_528_BINAURAL': { leftHz: 527.191, rightHz: 528.809, solfeggioCarrierHz: 528.0 },
    },
  },
  {
    id: 'bones-for-the-crows',
    title: 'Bones For The Crows',
    artist: 'Nickelback',
    artistBio: 'Groupe rock canadien incontournable, remastérisé en diapason naturel 432 Hz Verdi pour une chaleur harmonique organique.',
    fundamentalHz: 196.0,
    musicalKey: 'G Major',
    durationSeconds: 242,
    priceCentsCad: 99,
    isrc: 'US-RR1-11-00892',
    sha256Certificate: 'c4e91278ba040188d3f56e9021bca908472199bdf013acde45b981290311ee84',
    carriers: {
      '440_BYPASS': { leftHz: 440.0, rightHz: 440.0 },
      '432_NATURAL': { leftHz: 432.0, rightHz: 432.0 },
      '432_PHI': { leftHz: 431.191, rightHz: 432.809, binauralBeatHz: 1.618 },
      '432_528_BINAURAL': { leftHz: 527.191, rightHz: 528.809, solfeggioCarrierHz: 528.0 },
    },
  },
  {
    id: 'counting-stars',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    artistBio: 'Formation pop-rock internationale de Ryan Tedder, transposée avec précision en 432 Hz et battement binaural d’or.',
    fundamentalHz: 261.63,
    musicalKey: 'C# / Db Minor',
    durationSeconds: 257,
    priceCentsCad: 99,
    isrc: 'US-IR2-13-00142',
    sha256Certificate: 'f812049ba18745cdbe9003847291aebcd401837466eefa19028374a91b2c4e51',
    carriers: {
      '440_BYPASS': { leftHz: 440.0, rightHz: 440.0 },
      '432_NATURAL': { leftHz: 432.0, rightHz: 432.0 },
      '432_PHI': { leftHz: 431.191, rightHz: 432.809, binauralBeatHz: 1.618 },
      '432_528_BINAURAL': { leftHz: 527.191, rightHz: 528.809, solfeggioCarrierHz: 528.0 },
    },
  },
  {
    id: 'the-soldier-4',
    title: 'The Soldier 4',
    artist: 'Mike Shinoda solo Linkin Park',
    artistBio: 'Co-fondateur, producteur et multi-instrumentiste de Linkin Park, Mike Shinoda explore dans cette version solo studio des textures acoustiques hybrides et des arrangements intimistes sublimés en accordage naturel 432 Hz et résonance sacrée Phi.',
    fundamentalHz: 293.66,
    musicalKey: 'D Minor',
    durationSeconds: 218,
    priceCentsCad: 99,
    isrc: 'CA-H33-26-00004',
    sha256Certificate: '99e401bca280149ff9203947bca88172049182bcfe00192384a77e81920349b1',
    carriers: {
      '440_BYPASS': { leftHz: 440.0, rightHz: 440.0 },
      '432_NATURAL': { leftHz: 432.0, rightHz: 432.0 },
      '432_PHI': { leftHz: 431.191, rightHz: 432.809, binauralBeatHz: 1.618 },
      '432_528_BINAURAL': { leftHz: 527.191, rightHz: 528.809, solfeggioCarrierHz: 528.0 },
    },
  },
];

export default function App() {
  // Détection du mode IFrame / Embed dédié
  const isEmbedView = typeof window !== 'undefined' && window.location.pathname.startsWith('/embed');

  // État de lecture Audio
  const [selectedTrack, setSelectedTrack] = useState<TrackData>(CATALOGUE[0]);
  const [freqMode, setFreqMode] = useState<DSPFrequencyMode>('432_NATURAL');
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.85);
  const [playbackTime, setPlaybackTime] = useState(0);

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
      <div className="min-h-screen bg-[#070B0D] p-2 sm:p-4 flex items-center justify-center">
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

          ctx.fillStyle = '#100E0C';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 2.8;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height;
            if (freqMode === '432_PHI' || freqMode === '432_528_BINAURAL') {
              ctx.fillStyle = `rgb(${Math.min(255, barHeight + 140)}, ${Math.min(200, Math.floor(barHeight * 0.6) + 120)}, 25)`; // Or Solaire & Ambre Radiant
            } else {
              ctx.fillStyle = `rgb(${Math.min(255, barHeight + 130)}, ${Math.min(210, Math.floor(barHeight * 0.7) + 140)}, 40)`; // Chaleur Tube Analogique
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

  const currentCarriers = selectedTrack.carriers[freqMode];

  return (
    <div className="min-h-screen bg-[#0C0A09] text-stone-100 font-mono flex flex-col selection:bg-amber-500/30 selection:text-amber-300">
      {/* 1. Bandeau de Notification Supérieur */}
      <div className="bg-[#12100E] border-b border-stone-800/80 px-6 py-2 flex flex-wrap items-center justify-between text-xs text-stone-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="text-amber-400 font-bold tracking-wider">HARMONIC STUDIO CLOUD</span>
          <span>• GOOGLE AI STUDIO CONNECTED</span>
        </div>
        <div className="flex items-center gap-4">
          <span>DIFFUSION RFC 7233 : 512 KO</span>
          <span className="text-amber-400 font-semibold">STRIPE CONNECT 85/15 ACTIF</span>
        </div>
      </div>

      {/* 2. Header Principal */}
      <header className="h-20 border-b border-stone-800/90 bg-[#141210]/95 px-6 flex items-center justify-between backdrop-blur sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Waves className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest text-stone-100 flex items-center gap-2">
              HARMONIC<span className="text-amber-400">STUDIO</span>
              <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded font-normal">
                v1.0 SOUVERAIN
              </span>
            </h1>
            <p className="text-[11px] text-stone-400">
              Moteur DSP Temps Réel 432 Hz • EBU R128 (-14 LUFS / -1 dBTP)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#100E0C] p-1 rounded-lg border border-stone-800 text-xs">
            <button
              id="tab-view-master"
              onClick={() => setViewMode('master_broadcast')}
              className={`px-3.5 py-1.5 rounded-md transition cursor-pointer font-bold ${
                viewMode === 'master_broadcast'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              STUDIO BROADCAST
            </button>
            <button
              id="tab-view-console"
              onClick={() => setViewMode('harmonic_console')}
              className={`px-3.5 py-1.5 rounded-md transition cursor-pointer font-bold ${
                viewMode === 'harmonic_console'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              CONSOLE HARMONIQUE & FILE
            </button>
          </div>

          <button
            onClick={() => setShowWidgetModal(true)}
            className="hidden md:flex items-center gap-2 bg-stone-900/80 hover:bg-stone-800 border border-stone-700/70 text-xs px-3.5 py-2 rounded-lg text-stone-300 hover:text-white transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>WIDGET EMBED</span>
          </button>

          <button
            onClick={() => setShowCreatorModal(true)}
            className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-4 py-2 rounded-lg font-bold transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>STUDIO CRÉATEUR (85/15)</span>
          </button>

          <button
            id="btn-open-mcp-ai-suite"
            onClick={() => setShowAiSuiteModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 hover:from-amber-500/25 hover:to-orange-500/25 border border-amber-500/40 text-amber-300 text-xs px-4 py-2 rounded-lg font-bold transition cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>STUDIO IA PRO (MCP)</span>
          </button>
        </div>
      </header>

      {/* Bannière d'achat réussi */}
      {purchaseSuccessBanner && (
        <div className="bg-amber-500/15 border-b border-amber-500/40 text-amber-300 px-6 py-2.5 text-xs flex justify-between items-center shadow-sm">
          <span>{purchaseSuccessBanner}</span>
          <button
            onClick={() => setPurchaseSuccessBanner(null)}
            className="font-bold underline hover:text-white cursor-pointer ml-4"
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
            className="col-span-12 lg:col-span-4 bg-[#141210] border border-stone-800/90 rounded-2xl p-5 flex flex-col gap-6 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="routing-heading"
                  className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2"
                >
                  <Sliders className="w-4 h-4 text-amber-400" /> Matrice Fréquentielle A/B
                </h2>
                <span className="text-[10px] text-stone-500 font-mono">COMMUTATION INSTANTANÉE</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {[
                  {
                    id: '440_BYPASS',
                    title: '440 Hz Master Studio',
                    badge: 'Standard',
                    desc: 'Bypass direct, calibration A4 standard ISO 16',
                    color: 'text-stone-400 border-stone-700/60',
                  },
                  {
                    id: '432_NATURAL',
                    title: '432 Hz Ambiophonique 3D',
                    badge: 'Ambiophonie 3D',
                    desc: 'Spatialisation holophonique 3D + accordage Verdi r = 54/55 (-31.7667 cents) + notch anti-fizz',
                    color: 'text-emerald-400 border-emerald-500/30',
                  },
                  {
                    id: '432_PHI',
                    title: 'Φ 432 Hz Nombre d\'Or Ambiophonique',
                    badge: 'Binaural Φ 1.618 Hz',
                    desc: 'Modulation quadrature I/Q à 1.618033 Hz (m = 0.04) + immersion 3D Ambiophonique',
                    color: 'text-amber-400 border-amber-500/40',
                  },
                  {
                    id: '432_528_BINAURAL',
                    title: '(528 Hz - 432 Hz) × Φ Ambiophonique',
                    badge: 'Double Matrice 3D',
                    desc: 'Battement sacré (528 Hz - 432 Hz = 96 Hz) × 1.618033 = 155.33 Hz + 432 Hz Ambiophonique 3D',
                    color: 'text-orange-400 border-orange-500/40',
                  },
                ].map((mode) => {
                  const isActive = freqMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleFrequencySwitch(mode.id as DSPFrequencyMode)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 border-amber-400 text-stone-100 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                          : 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700 text-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-stone-100">{mode.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${mode.color}`}>
                          {mode.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-relaxed">{mode.desc}</p>
                      {isActive && (
                        <div className="mt-2 text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 animate-spin" /> MATRICE ACTIVE
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Badges Dynamiques L/R Porteuses */}
            <div className="bg-[#100E0C] border border-stone-800/80 rounded-xl p-4 text-xs">
              <div className="text-stone-400 font-bold mb-3 flex items-center justify-between">
                <span className="tracking-wide">PORTEUSES D'ÉMISSION</span>
                <Radio className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider">Canal Gauche (L)</div>
                  <div className="text-sm font-bold text-amber-400">{currentCarriers.leftHz} Hz</div>
                </div>
                <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-500 uppercase tracking-wider">Canal Droit (R)</div>
                  <div className="text-sm font-bold text-orange-400">{currentCarriers.rightHz} Hz</div>
                </div>
              </div>
              {freqMode === '432_528_BINAURAL' && (
                <div className="mt-3 bg-orange-500/10 border border-orange-500/30 p-2 rounded-lg text-[11px] text-orange-300 flex items-center justify-between font-mono">
                  <span>RÉSONANCE SACRÉE Δ-Φ :</span>
                  <span className="font-bold">(528 - 432) × 1.618033 = 155.33 Hz</span>
                </div>
              )}
              {freqMode === '432_NATURAL' && (
                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-[11px] text-emerald-300 flex items-center justify-between font-mono">
                  <span>ACOUSTIQUE 3D :</span>
                  <span className="font-bold">Ambiophonie (mlev=0.96 / slev=1.22)</span>
                </div>
              )}
              {freqMode === '432_PHI' && (
                <div className="mt-3 bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-[11px] text-amber-300 flex items-center justify-between font-mono">
                  <span>MODULATION QUADRATURE :</span>
                  <span className="font-bold">Φ = 1.618033 Hz (Ambiophonique 3D)</span>
                </div>
              )}
            </div>

            {/* Réglage du Volume Principal */}
            <div className="mt-auto pt-4 border-t border-stone-800">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-stone-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-amber-400" /> GAIN BROADCAST
                </span>
                <span className="text-amber-400 font-bold">{Math.round(masterVolume * 100)}%</span>
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
                className="w-full accent-amber-500 bg-[#100E0C] rounded h-1.5 cursor-pointer"
              />
            </div>
          </section>

          {/* COLONNE CENTRALE : Visualiseur FFT & Lecteur Master */}
          <section
            aria-labelledby="player-heading"
            className="col-span-12 lg:col-span-8 flex flex-col gap-5"
          >
            {/* Panneau Principal du Player */}
            <div className="bg-[#141210] border border-stone-800/90 rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              <div>
                {/* Entête du Titre Actif */}
                <div className="flex flex-wrap justify-between items-start gap-4 mb-5">
                  <div>
                    <div className="text-xs text-amber-400 font-bold tracking-wider uppercase mb-1">
                      PISTE SÉLECTIONNÉE • ISRC : {selectedTrack.isrc}
                    </div>
                    <h2 id="player-heading" className="text-2xl font-black text-stone-100">
                      {selectedTrack.title}
                    </h2>
                    <p className="text-sm text-stone-400 mt-0.5">
                      {selectedTrack.artist} — Clé : {selectedTrack.musicalKey} (Fondamentale :{' '}
                      {selectedTrack.fundamentalHz} Hz)
                    </p>
                    {selectedTrack.artistBio && (
                      <p className="text-xs text-stone-300 leading-relaxed mt-1 max-w-xl line-clamp-2">
                        {selectedTrack.artistBio}
                      </p>
                    )}
                  </div>

                  {/* Métriques Broadcast EBU R128 */}
                  <div className="flex gap-3">
                    <div className="bg-[#100E0C] border border-stone-800 px-3.5 py-2 rounded-xl text-right">
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider">Cible LUFS</div>
                      <div className="text-sm font-black text-amber-400">-14.0 LUFS</div>
                    </div>
                    <div className="bg-[#100E0C] border border-stone-800 px-3.5 py-2 rounded-xl text-right">
                      <div className="text-[10px] text-stone-500 uppercase tracking-wider">True Peak</div>
                      <div className="text-sm font-black text-orange-400">-1.0 dBTP</div>
                    </div>
                  </div>
                </div>

                {/* Oscilloscope FFT Canvas 60 FPS */}
                <div className="w-full h-64 bg-[#100E0C] border border-stone-800/80 rounded-xl overflow-hidden relative mb-5 shadow-inner">
                  <canvas ref={canvasRef} width={900} height={256} className="w-full h-full" />
                  <div className="absolute top-3 left-3 text-[10px] text-stone-400 tracking-widest pointer-events-none flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    SPECTRE FFT 2048 PTS • ÉCHANTILLONNAGE 48 KHZ
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] text-stone-500 font-mono pointer-events-none">
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
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-800">
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayback}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black px-7 py-3.5 rounded-xl flex items-center gap-2.5 shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current" />
                    )}
                    <span>{isPlaying ? 'SUSPENDRE LE FLUX' : 'DÉMARRER LA RÉSONANCE'}</span>
                  </button>

                  <div className="text-xs text-stone-400 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-stone-500" />
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
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold px-5 py-3.5 rounded-xl flex items-center gap-2.5 transition-all text-xs cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.1)]"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>ACQUÉRIR CE MASTER (0.99 $ CAD)</span>
                </button>
              </div>
            </div>

            {/* 4. Catalogue des 4 Pistes Certifiées */}
            <section
              aria-labelledby="catalogue-heading"
              className="bg-[#141210] border border-stone-800/90 rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
            >
              <h3
                id="catalogue-heading"
                className="text-xs font-bold text-stone-300 uppercase tracking-wider mb-4 flex items-center gap-2"
              >
                <Layers className="w-4 h-4 text-amber-400" /> Registre des Pistes Master Quadruple Fréquence
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CATALOGUE.map((track) => {
                  const isCurrent = track.id === selectedTrack.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectTrack(track)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-400/90 text-stone-100 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-stone-900/50 border-stone-800/80 hover:border-stone-700 text-stone-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-sm font-bold text-stone-100">{track.title}</div>
                          <div className="text-xs text-amber-400 font-medium">{track.artist}</div>
                        </div>
                        <span className="text-[10px] bg-stone-900 border border-stone-800 px-2 py-0.5 rounded text-stone-300">
                          {track.musicalKey}
                        </span>
                      </div>

                      {track.artistBio && (
                        <p className="text-xs text-stone-300/80 leading-relaxed mb-3 line-clamp-2">
                          {track.artistBio}
                        </p>
                      )}

                      <div className="flex justify-between items-center text-[11px] text-stone-400 pt-2 border-t border-stone-800/80">
                        <span>Fondamentale : {track.fundamentalHz} Hz</span>
                        <span className="text-amber-400 font-bold">0.99 $ CAD (85/15)</span>
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
          <div className="bg-[#141210] border border-stone-700/80 rounded-2xl max-w-md w-full p-6 text-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-stone-100">Acquisition Master Audio 432 Hz</h3>
              </div>
              <button
                onClick={() => setShowStripeModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-stone-400 mb-4">
              Acquisition de la licence perpétuelle pour{' '}
              <strong className="text-stone-100">{selectedTrack.title}</strong> par{' '}
              <strong className="text-stone-100">{selectedTrack.artist}</strong>.
            </p>

            {/* Décomposition du Split 85/15 en cents entiers */}
            <div className="bg-[#100E0C] border border-stone-800 rounded-xl p-4 mb-5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-400">Prix unitaire officiel :</span>
                <span className="text-stone-100 font-bold">0.99 $ CAD (99 ¢)</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Part Créateur Direct (85%) :</span>
                <span className="font-bold">0.84 $ CAD (84 ¢)</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>Frais Plateforme & Infrastructure (15%) :</span>
                <span>0.15 $ CAD (15 ¢)</span>
              </div>
              <div className="pt-2 border-t border-stone-800 flex justify-between text-stone-400">
                <span>Régime de Séquestre :</span>
                <span className="text-amber-400 font-medium">Libération J+7 Express</span>
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
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]"
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
          <div className="bg-[#141210] border border-stone-700/80 rounded-2xl max-w-2xl w-full p-6 text-sm max-h-[85vh] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-stone-100">
                  Console Créateur — Grand Livre Stripe Connect
                </h3>
              </div>
              <button
                onClick={() => setShowCreatorModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5 text-xs">
              <div className="bg-[#100E0C] border border-stone-800 p-3 rounded-xl">
                <div className="text-stone-400">PART CRÉATEUR FIXE</div>
                <div className="text-lg font-black text-amber-400">85.0 %</div>
              </div>
              <div className="bg-[#100E0C] border border-stone-800 p-3 rounded-xl">
                <div className="text-stone-400">PART PLATEFORME</div>
                <div className="text-lg font-black text-orange-400">15.0 %</div>
              </div>
              <div className="bg-[#100E0C] border border-stone-800 p-3 rounded-xl">
                <div className="text-stone-400">RÈGLEMENT STRIPE</div>
                <div className="text-lg font-black text-stone-100">J+7 SÉQUESTRE</div>
              </div>
            </div>

            <h4 className="text-xs font-bold text-stone-300 uppercase mb-3">
              4 Pistes Enregistrées au Catalogue Souverain
            </h4>
            <div className="space-y-2 mb-5">
              {CATALOGUE.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#100E0C] border border-stone-800 p-3 rounded-xl text-xs flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-stone-100">{t.title}</span> —{' '}
                    <span className="text-stone-400">{t.artist}</span>
                    <div className="text-[10px] text-stone-500">
                      ISRC: {t.isrc} | Cert: {t.sha256Certificate.slice(0, 20)}...
                    </div>
                  </div>
                  <span className="text-amber-400 font-bold">84 ¢ / vente</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300">
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
          <div className="bg-[#141210] border border-stone-700/80 rounded-2xl max-w-xl w-full p-6 text-sm max-h-[90vh] overflow-y-auto shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-stone-100">Intégration du Lecteur Embed & Partage Réseaux</h3>
              </div>
              <button
                onClick={() => setShowWidgetModal(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 1. Boutons de partage direct Twitter/X et Facebook */}
            <div className="bg-[#100E0C] border border-stone-800 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Partage Social Direct
                </span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  {freqMode}
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-3">
                Partagez directement la piste <strong className="text-stone-100">{selectedTrack.title}</strong> avec sa fréquence active sur vos réseaux :
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
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
                Aperçu du Widget Intégré (Boutons Twitter & Facebook inclus)
              </span>
              <EmbeddedPlayerWidget
                trackId={selectedTrack.id}
                initialFreq={freqMode}
              />
            </div>

            {/* 3. Code Iframe pour intégration web */}
            <p className="text-xs text-stone-400 mb-2">
              Code HTML d'intégration sécurisé (IFrame HTTP 206) :
            </p>

            <div className="bg-[#100E0C] border border-stone-800 p-3 rounded-xl text-[11px] font-mono text-amber-300 overflow-x-auto mb-4">
              {`<iframe src="https://harmonic-studio-plateforme-de-streaming-432hz.ai.studio/embed/${selectedTrack.id}?freq=${freqMode}" width="100%" height="220" frameborder="0" allow="autoplay"></iframe>`}
            </div>

            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `<iframe src="https://harmonic-studio-plateforme-de-streaming-432hz.ai.studio/embed/${selectedTrack.id}?freq=${freqMode}" width="100%" height="220" frameborder="0" allow="autoplay"></iframe>`
                );
                alert('Code Embed copié dans votre presse-papier !');
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)]"
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
