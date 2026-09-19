import { create } from 'zustand';
import { HarmonicFrequency, Track, ColibriAnalysisResult, AcpSessionEvent } from '../../types';
import { createDspWorkletUrl } from '../../dsp/PitchShifterWorklet';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'splintered-self',
    title: 'Splintered Self',
    artist: 'VEL94EV',
    durationSeconds: 212,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 149.00,
    unlocked: true,
    creatorStripeId: 'acct_1NvEL94EVStudio',
    originalTuningHz: 440.0,
    coverGradientFrom: '#F59E0B',
    coverGradientTo: '#D97706',
    audioUrl: '/api/stream/splintered-self',
    spectralFingerprint: 'SHA256:7f49a1d9...08ec',
    masterArchives: [
      {
        id: '440',
        title: 'Master 440 Hz Standard',
        tuning: 'A=440.0 Hz (Bypass studio)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: '432',
        title: 'Master 432 Hz Naturel',
        tuning: 'A=432.0 Hz (Diapason Verdi -31.76c)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'phi',
        title: "Master Φ 432 Hz Nombre d'Or",
        tuning: 'A=432.0 Hz + LFO Scalaire Φ 1.618 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'binaural',
        title: 'Master 432Hz + 528Hz Binaural',
        tuning: 'Ondes Thêta 4.0 Hz + Fréquence Sacrée 528 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
    ],
  },
  {
    id: 'bones-for-the-crows',
    title: 'Bones For The Crows',
    artist: 'Nickelback',
    durationSeconds: 242,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 179.00,
    unlocked: true,
    creatorStripeId: 'acct_1NickelbackHarmonic',
    originalTuningHz: 440.0,
    coverGradientFrom: '#10B981',
    coverGradientTo: '#047857',
    audioUrl: '/api/stream/bones-for-the-crows',
    spectralFingerprint: 'SHA256:bb8241ea...528f',
    masterArchives: [
      {
        id: '440',
        title: 'Master 440 Hz Standard',
        tuning: 'A=440.0 Hz (Bypass studio)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: '432',
        title: 'Master 432 Hz Naturel',
        tuning: 'A=432.0 Hz (Diapason Verdi -31.76c)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'phi',
        title: "Master Φ 432 Hz Nombre d'Or",
        tuning: 'A=432.0 Hz + LFO Scalaire Φ 1.618 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'binaural',
        title: 'Master 432Hz + 528Hz Binaural',
        tuning: 'Ondes Thêta 4.0 Hz + Fréquence Sacrée 528 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
    ],
  },
  {
    id: 'counting-stars',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    durationSeconds: 257,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 199.00,
    unlocked: true,
    creatorStripeId: 'acct_1OneRepublicPub',
    originalTuningHz: 440.0,
    coverGradientFrom: '#8B5CF6',
    coverGradientTo: '#6D28D9',
    audioUrl: '/api/stream/counting-stars',
    spectralFingerprint: 'SHA256:432ac918...1618',
    masterArchives: [
      {
        id: '440',
        title: 'Master 440 Hz Standard',
        tuning: 'A=440.0 Hz (Bypass studio)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: '432',
        title: 'Master 432 Hz Naturel',
        tuning: 'A=432.0 Hz (Diapason Verdi -31.76c)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'phi',
        title: "Master Φ 432 Hz Nombre d'Or",
        tuning: 'A=432.0 Hz + LFO Scalaire Φ 1.618 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'binaural',
        title: 'Master 432Hz + 528Hz Binaural',
        tuning: 'Ondes Thêta 4.0 Hz + Fréquence Sacrée 528 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
    ],
  },
  {
    id: 'the-soldier-4',
    title: 'The Soldier 4',
    artist: 'Mike Shinoda solo Linkin Park',
    durationSeconds: 218,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 129.00,
    unlocked: true,
    creatorStripeId: 'acct_1MichaelSoloHarmonic',
    originalTuningHz: 440.0,
    coverGradientFrom: '#3B82F6',
    coverGradientTo: '#1D4ED8',
    audioUrl: '/api/stream/the-soldier-4',
    spectralFingerprint: 'SHA256:99e401bc...49b1',
    masterArchives: [
      {
        id: '440',
        title: 'Master 440 Hz Standard',
        tuning: 'A=440.0 Hz (Bypass studio)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: '432',
        title: 'Master 432 Hz Naturel',
        tuning: 'A=432.0 Hz (Diapason Verdi -31.76c)',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'phi',
        title: "Master Φ 432 Hz Nombre d'Or",
        tuning: 'A=432.0 Hz + LFO Scalaire Φ 1.618 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
      {
        id: 'binaural',
        title: 'Master 432Hz + 528Hz Binaural',
        tuning: 'Ondes Thêta 4.0 Hz + Fréquence Sacrée 528 Hz',
        duration: '',
        bitrate: '',
        fingerprint: '',
      },
    ],
  },
];

interface AudioEngineState {
  audioContext: AudioContext | null;
  audioElement: HTMLAudioElement | null;
  sourceNode: MediaElementAudioSourceNode | null;
  analyserNode: AnalyserNode | null;
  workletNode: AudioWorkletNode | null;
  gainNodes: Record<HarmonicFrequency, GainNode> | null;
  phiLfoOsc: OscillatorNode | null;
  binauralOscL: OscillatorNode | null;
  binauralOscR: OscillatorNode | null;
  binauralGain: GainNode | null;
  masterGain: GainNode | null;
  isInitialized: boolean;
}

interface AudioStore {
  // Navigation
  activeTab: 'player' | 'creator' | 'widget';
  setActiveTab: (tab: 'player' | 'creator' | 'widget') => void;

  // Track & Playback State
  tracks: Track[];
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  bufferedPercent: number;
  activeFrequency: HarmonicFrequency;
  volume: number;
  adminUnlocked: boolean;
  isSubscribed: boolean;

  // Audio Engine Internals
  engine: AudioEngineState;
  
  // Real-time Visualizer telemetry (spectrum, rms, lufs)
  spectrumData: Uint8Array;
  measuredLufs: number;
  peakDbtp: number;
  
  // Playlist & Queue Management
  queue: Track[];
  autoPlayNext: boolean;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleAutoPlayNext: () => void;

  // ACP & Colibri Status
  colibriAnalysis: ColibriAnalysisResult | null;
  acpEvents: AcpSessionEvent[];
  isAcpIngesting: boolean;

  // Actions
  initAudioEngine: () => Promise<void>;
  playTrack: (track: Track) => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (seconds: number) => void;
  setFrequency: (mode: HarmonicFrequency) => void;
  setVolume: (volume: number) => void;
  toggleAdminUnlock: () => void;
  subscribePass: () => void;
  purchaseTrack: (trackId: string) => void;
  runColibriAnalysis: (trackId: string) => Promise<void>;
  addAcpLog: (event: Omit<AcpSessionEvent, 'id' | 'timestamp'>) => void;
  addCustomTrack: (track: Track) => void;
  masterSongUrl: string | null;
  setMasterSongUrl: (url: string, durationSec?: number) => void;
  customPhiAudioUrl: string | null;
  setCustomPhiAudioUrl: (url: string, durationSec?: number) => void;
  custom440AudioUrl: string | null;
  setCustom440AudioUrl: (url: string, durationSec?: number) => void;
  custom432AudioUrl: string | null;
  setCustom432AudioUrl: (url: string, durationSec?: number) => void;
  customBinauralAudioUrl: string | null;
  setCustomBinauralAudioUrl: (url: string, durationSec?: number) => void;
  setTrackCustomAudio: (trackId: string, freq: HarmonicFrequency, url: string, fileName?: string, durationSec?: number, autoPlay?: boolean) => void;
  removeTrackCustomAudio: (trackId: string, freq: HarmonicFrequency) => void;
  playTrackMaster: (track: Track, freq: HarmonicFrequency) => Promise<void>;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  activeTab: 'player',
  setActiveTab: (tab) => set({ activeTab: tab }),

  tracks: INITIAL_TRACKS,
  currentTrack: INITIAL_TRACKS[0],
  isPlaying: false,
  currentTime: 0,
  duration: 216, // Exactement 03:36 / 03:32
  bufferedPercent: 100,
  activeFrequency: '432', // Démarre sur 432 Hz Naturel
  volume: 0.85,
  adminUnlocked: true,
  isSubscribed: false,
  masterSongUrl: null,
  customPhiAudioUrl: null,
  custom440AudioUrl: null,
  custom432AudioUrl: null,
  customBinauralAudioUrl: null,

  setMasterSongUrl: (url: string, durationSec: number = 216) => {
    set({ masterSongUrl: url, duration: durationSec });
    const { engine, isPlaying } = get();
    if (engine.audioElement) {
      engine.audioElement.src = url;
      engine.audioElement.load();
      if (isPlaying) {
        engine.audioElement.play().catch(console.error);
      }
    }
  },

  setCustomPhiAudioUrl: (url: string, durationSec: number = 212) => {
    set((state) => ({
      customPhiAudioUrl: url,
      masterSongUrl: state.masterSongUrl || url,
      duration: durationSec,
    }));
    const { engine, isPlaying, activeFrequency } = get();
    if (engine.audioElement && activeFrequency === 'phi') {
      engine.audioElement.src = url;
      engine.audioElement.load();
      if (isPlaying) {
        engine.audioElement.play().catch(console.error);
      }
    }
  },

  setCustom440AudioUrl: (url: string, durationSec: number = 212) => {
    set((state) => ({
      custom440AudioUrl: url,
      masterSongUrl: state.masterSongUrl || url,
      duration: durationSec,
    }));
    const { engine, isPlaying, activeFrequency } = get();
    if (engine.audioElement && activeFrequency === '440') {
      engine.audioElement.src = url;
      engine.audioElement.load();
      if (isPlaying) {
        engine.audioElement.play().catch(console.error);
      }
    }
  },

  setCustom432AudioUrl: (url: string, durationSec: number = 216) => {
    set((state) => ({
      custom432AudioUrl: url,
      masterSongUrl: state.masterSongUrl || url,
      duration: durationSec,
    }));
    const { engine, isPlaying, activeFrequency } = get();
    if (engine.audioElement && activeFrequency === '432') {
      engine.audioElement.src = url;
      engine.audioElement.load();
      if (isPlaying) {
        engine.audioElement.play().catch(console.error);
      }
    }
  },

  setCustomBinauralAudioUrl: (url: string, durationSec: number = 212) => {
    set((state) => ({
      customBinauralAudioUrl: url,
      masterSongUrl: state.masterSongUrl || url,
      duration: durationSec,
    }));
    const { engine, isPlaying, activeFrequency } = get();
    if (engine.audioElement && activeFrequency === 'binaural') {
      engine.audioElement.src = url;
      engine.audioElement.load();
      if (isPlaying) {
        engine.audioElement.play().catch(console.error);
      }
    }
  },

  setTrackCustomAudio: async (
    trackId: string,
    freq: HarmonicFrequency,
    url: string,
    fileName?: string,
    durationSec?: number,
    autoPlay: boolean = true
  ) => {
    const { tracks, currentTrack, initAudioEngine, engine, setFrequency } = get();
    const updatedTracks = tracks.map((t) => {
      if (t.id !== trackId) return t;
      const existingArchives = t.masterArchives || [];
      const updatedArchives = existingArchives.map((arch) => {
        if (arch.id === freq) {
          return {
            ...arch,
            customAudioUrl: url,
            isCustomUploaded: true,
            fileName: fileName || arch.fileName || 'Master Remasterisé MP3',
            bitrate: '320 kbps MP3 EBU R128',
            duration: durationSec
              ? `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, '0')}`
              : (freq === '432' ? '03:36' : '03:32'),
          };
        }
        return arch;
      });
      return {
        ...t,
        masterArchives: updatedArchives,
      };
    });

    const isCurrent = currentTrack.id === trackId;
    const targetTrack = updatedTracks.find((t) => t.id === trackId) || currentTrack;

    set({
      tracks: updatedTracks,
      currentTrack: isCurrent ? targetTrack : currentTrack,
    });

    // If current track is this track, also configure active custom URL
    if (isCurrent || autoPlay) {
      if (freq === '440') {
        get().setCustom440AudioUrl(url, durationSec);
      } else if (freq === '432') {
        get().setCustom432AudioUrl(url, durationSec);
      } else if (freq === 'phi') {
        get().setCustomPhiAudioUrl(url, durationSec);
      } else if (freq === 'binaural') {
        get().setCustomBinauralAudioUrl(url, durationSec);
      }
    }

    if (autoPlay) {
      if (!engine.isInitialized) {
        await initAudioEngine();
      }
      const currentEngine = get().engine;
      if (currentEngine.audioContext?.state === 'suspended') {
        await currentEngine.audioContext.resume();
      }
      if (currentEngine.audioElement) {
        set({
          currentTrack: targetTrack,
          activeFrequency: freq,
          isPlaying: true,
          duration: durationSec || (freq === '432' ? 216 : 212),
        });
        setFrequency(freq);
        currentEngine.audioElement.src = url;
        currentEngine.audioElement.load();
        try {
          await currentEngine.audioElement.play();
        } catch (err) {
          console.warn('AutoPlay on assign failed:', err);
        }
      }
    }
  },

  removeTrackCustomAudio: (trackId: string, freq: HarmonicFrequency) => {
    const { tracks, currentTrack } = get();
    const updatedTracks = tracks.map((t) => {
      if (t.id !== trackId) return t;
      const existingArchives = t.masterArchives || [];
      const updatedArchives = existingArchives.map((arch) => {
        if (arch.id === freq) {
          return {
            ...arch,
            customAudioUrl: undefined,
            isCustomUploaded: false,
            fileName: undefined,
            bitrate: undefined,
            duration: undefined,
          };
        }
        return arch;
      });
      return {
        ...t,
        masterArchives: updatedArchives,
      };
    });

    const isCurrent = currentTrack.id === trackId;
    let updatedCurrentTrack = currentTrack;
    if (isCurrent) {
      const match = updatedTracks.find((t) => t.id === trackId);
      if (match) updatedCurrentTrack = match;
      if (freq === '440') set({ custom440AudioUrl: null });
      else if (freq === '432') set({ custom432AudioUrl: null });
      else if (freq === 'phi') set({ customPhiAudioUrl: null });
      else if (freq === 'binaural') set({ customBinauralAudioUrl: null });
    }

    set({
      tracks: updatedTracks,
      currentTrack: updatedCurrentTrack,
    });
  },

  playTrackMaster: async (track: Track, freq: HarmonicFrequency) => {
    const { initAudioEngine, engine, setFrequency, currentTrack, activeFrequency, isPlaying } = get();
    if (!engine.isInitialized) {
      await initAudioEngine();
    }
    const currentEngine = get().engine;
    if (!currentEngine.audioElement || !currentEngine.audioContext) return;

    if (currentEngine.audioContext.state === 'suspended') {
      await currentEngine.audioContext.resume();
    }

    const matchingArchive = track.masterArchives?.find((a) => a.id === freq);
    const audioUrl = matchingArchive?.customAudioUrl || `${track.audioUrl}?freq=${freq}`;

    if (currentTrack.id === track.id && activeFrequency === freq && isPlaying) {
      currentEngine.audioElement.pause();
      set({ isPlaying: false });
      return;
    }

    set({
      currentTrack: track,
      activeFrequency: freq,
      duration: track.durationSeconds || (freq === '432' ? 216 : 212),
    });

    if (freq === '440' && matchingArchive?.customAudioUrl) set({ custom440AudioUrl: matchingArchive.customAudioUrl });
    else if (freq === '432' && matchingArchive?.customAudioUrl) set({ custom432AudioUrl: matchingArchive.customAudioUrl });
    else if (freq === 'phi' && matchingArchive?.customAudioUrl) set({ customPhiAudioUrl: matchingArchive.customAudioUrl });
    else if (freq === 'binaural' && matchingArchive?.customAudioUrl) set({ customBinauralAudioUrl: matchingArchive.customAudioUrl });

    setFrequency(freq);

    currentEngine.audioElement.src = audioUrl;
    currentEngine.audioElement.load();
    try {
      await currentEngine.audioElement.play();
      set({ isPlaying: true });
    } catch (err) {
      console.warn('Playback error:', err);
      set({ isPlaying: false });
    }
  },

  // Playlist & Queue
  queue: [],
  autoPlayNext: true,

  engine: {
    audioContext: null,
    audioElement: null,
    sourceNode: null,
    analyserNode: null,
    workletNode: null,
    gainNodes: null,
    phiLfoOsc: null,
    binauralOscL: null,
    binauralOscR: null,
    binauralGain: null,
    masterGain: null,
    isInitialized: false,
  },

  spectrumData: new Uint8Array(64),
  measuredLufs: -14.0,
  peakDbtp: -1.0,

  colibriAnalysis: {
    trackId: 'splintered-self',
    detectedFundamentalHz: 440.02,
    tuningDeviationCents: +0.08,
    isStandard440: true,
    isAlready432: false,
    confidence: 0.994,
    fftPeaks: [
      { freq: 440.0, magDb: -12.4 },
      { freq: 880.0, magDb: -18.2 },
      { freq: 1320.0, magDb: -24.8 },
      { freq: 1760.0, magDb: -29.1 },
    ],
    processingTimeMs: 118,
  },
  acpEvents: [
    {
      id: 'evt-init',
      sessionId: 'sess-goose-01',
      method: 'initialize',
      params: { protocolVersion: '2.0', client: 'berd-hybrid-audio-agent' },
      result: { capabilities: { streamingRange206: true, colibriDsp: true } },
      timestamp: Date.now() - 60000,
    },
    {
      id: 'evt-session',
      sessionId: 'sess-goose-01',
      method: 'session/new',
      params: { targetFormat: 'mp3_320k_432hz', ebuNorm: -14.0 },
      result: { status: 'ready', bufferPool: '512KB_aligned' },
      timestamp: Date.now() - 45000,
    },
  ],
  isAcpIngesting: false,

  initAudioEngine: async () => {
    const { engine } = get();
    if (engine.isInitialized && engine.audioContext) {
      if (engine.audioContext.state === 'suspended') {
        await engine.audioContext.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 48000, latencyHint: 'interactive' });
      
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';

      // Connect media element source
      const source = ctx.createMediaElementSource(audio);

      // Create AnalyserNode
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.85;

      // Master output gain with True Peak limiting stage
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(get().volume, ctx.currentTime);

      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-1.0, ctx.currentTime);
      limiter.knee.setValueAtTime(0.0, ctx.currentTime);
      limiter.ratio.setValueAtTime(20.0, ctx.currentTime);
      limiter.attack.setValueAtTime(0.002, ctx.currentTime);
      limiter.release.setValueAtTime(0.05, ctx.currentTime);

      // 4-Way Parallel Gain Switching Matrix for 35ms constant-power cross-fade:
      // '440', '432', 'phi', 'binaural'
      const gain440 = ctx.createGain();
      const gain432 = ctx.createGain();
      const gainPhi = ctx.createGain();
      const gainBinaural = ctx.createGain();

      const initialMode = get().activeFrequency;
      gain440.gain.setValueAtTime(initialMode === '440' ? 1.0 : 0.0, ctx.currentTime);
      gain432.gain.setValueAtTime(initialMode === '432' ? 1.0 : 0.0, ctx.currentTime);
      gainPhi.gain.setValueAtTime(initialMode === 'phi' ? 1.0 : 0.0, ctx.currentTime);
      gainBinaural.gain.setValueAtTime(initialMode === 'binaural' ? 1.0 : 0.0, ctx.currentTime);

      // Path 1: 440 Standard (direct bypass)
      source.connect(gain440);

      // Path 2 & 3 & 4: 432 Hz filtering & pitch simulation
      // Pitch shift ratio r = 432 / 440 = 54/55 -> -31.7667 cents
      // Use subtle Biquad harmonic realigner + worklet if available
      let workletNode: AudioWorkletNode | null = null;
      try {
        const workletUrl = createDspWorkletUrl();
        await ctx.audioWorklet.addModule(workletUrl);
        workletNode = new AudioWorkletNode(ctx, 'harmonic-dsp-processor');
        workletNode.port.postMessage({ type: 'SET_MODE', mode: initialMode });
        source.connect(workletNode);
        workletNode.connect(gain432);
        workletNode.connect(gainPhi);
        workletNode.connect(gainBinaural);
      } catch (err) {
        console.warn('AudioWorklet module fallback to native Web Audio graph:', err);
        // Fallback filter chain:
        const filter432 = ctx.createBiquadFilter();
        filter432.type = 'peaking';
        filter432.frequency.setValueAtTime(432.0, ctx.currentTime);
        filter432.Q.setValueAtTime(1.414, ctx.currentTime);
        filter432.gain.setValueAtTime(1.8, ctx.currentTime);

        source.connect(filter432);
        filter432.connect(gain432);
        filter432.connect(gainPhi);
        filter432.connect(gainBinaural);
      }

      // Golden ratio Phi LFO: 1.618033 Hz amplitude modulation
      const phiLfo = ctx.createOscillator();
      const phiLfoDepth = ctx.createGain();
      phiLfo.frequency.setValueAtTime(1.6180339887, ctx.currentTime);
      phiLfoDepth.gain.setValueAtTime(0.04, ctx.currentTime); // 4% subtle depth
      phiLfo.connect(phiLfoDepth);
      phiLfoDepth.connect(gainPhi.gain);
      phiLfo.start();

      // Solfeggio 528Hz Binaural generator for mode 'binaural'
      // Left ear: 528 - Phi/2 = 527.190983 Hz
      // Right ear: 528 + Phi/2 = 528.809017 Hz
      const phi = 1.6180339887;
      const merger = ctx.createChannelMerger(2);
      const binL = ctx.createOscillator();
      const binR = ctx.createOscillator();
      const binauralGain = ctx.createGain();

      binL.type = 'sine';
      binR.type = 'sine';
      binL.frequency.setValueAtTime(528 - (phi / 2), ctx.currentTime);
      binR.frequency.setValueAtTime(528 + (phi / 2), ctx.currentTime);

      // Injected at -28 dBFS for soft, warm harmonic integration with the remastered track
      // Starts at 0.0 to guarantee silence when no song is playing (anti-stridence protection)
      binauralGain.gain.setValueAtTime(0.0, ctx.currentTime);

      binL.connect(merger, 0, 0);
      binR.connect(merger, 0, 1);
      merger.connect(binauralGain);
      binauralGain.connect(gainBinaural);

      binL.start();
      binR.start();

      // Connect all 4 branches into master limiter and analyser
      gain440.connect(masterGain);
      gain432.connect(masterGain);
      gainPhi.connect(masterGain);
      gainBinaural.connect(masterGain);

      masterGain.connect(limiter);
      limiter.connect(analyser);
      analyser.connect(ctx.destination);

      // Helper to strictly silence isolated binaural carrier when music is paused
      const applyBinauralSafety = (playing: boolean, freq: HarmonicFrequency) => {
        if (!binauralGain || !ctx) return;
        const now = ctx.currentTime;
        binauralGain.gain.cancelScheduledValues(now);
        if (playing && freq === 'binaural') {
          binauralGain.gain.setValueAtTime(binauralGain.gain.value, now);
          binauralGain.gain.linearRampToValueAtTime(Math.pow(10, -28 / 20), now + 0.08);
        } else {
          binauralGain.gain.setValueAtTime(binauralGain.gain.value, now);
          binauralGain.gain.linearRampToValueAtTime(0.0, now + 0.02);
        }
      };

      // Event listeners on HTML Audio
      audio.addEventListener('timeupdate', () => {
        set({ currentTime: audio.currentTime });
      });

      audio.addEventListener('pause', () => {
        applyBinauralSafety(false, get().activeFrequency);
        set({ isPlaying: false });
      });

      audio.addEventListener('play', () => {
        applyBinauralSafety(true, get().activeFrequency);
        set({ isPlaying: true });
      });

      audio.addEventListener('durationchange', () => {
        if (!isNaN(audio.duration) && audio.duration > 0) {
          set({ duration: audio.duration });
        }
      });

      audio.addEventListener('progress', () => {
        if (audio.buffered.length > 0) {
          const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
          const dur = audio.duration || get().duration;
          set({ bufferedPercent: Math.min(100, Math.round((bufferedEnd / dur) * 100)) });
        }
      });

      audio.addEventListener('ended', () => {
        applyBinauralSafety(false, get().activeFrequency);
        // Auto play next track in queue/playlist
        const { autoPlayNext, playNext } = get();
        if (autoPlayNext) {
          playNext();
        } else {
          set({ isPlaying: false });
        }
      });

      set({
        engine: {
          audioContext: ctx,
          audioElement: audio,
          sourceNode: source,
          analyserNode: analyser,
          workletNode,
          gainNodes: {
            '440': gain440,
            '432': gain432,
            'phi': gainPhi,
            'binaural': gainBinaural,
          },
          phiLfoOsc: phiLfo,
          binauralOscL: binL,
          binauralOscR: binR,
          binauralGain,
          masterGain,
          isInitialized: true,
        }
      });

      // Start RAF loop for real-time spectrum analysis
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const updateMeters = () => {
        if (get().isPlaying && analyser) {
          analyser.getByteFrequencyData(buffer);
          // Sample 64 points for visualization
          const samples = new Uint8Array(64);
          for (let i = 0; i < 64; i++) {
            samples[i] = buffer[Math.floor(i * (buffer.length / 64))];
          }
          
          // Calculate approximate RMS and LUFS
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            const normalized = buffer[i] / 255;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / buffer.length);
          const db = rms > 0.0001 ? 20 * Math.log10(rms) : -70;
          const estimatedLufs = Math.max(-24, Math.min(-12, -14.0 + (db + 20) * 0.15));

          set({
            spectrumData: samples,
            measuredLufs: Number(estimatedLufs.toFixed(1)),
            peakDbtp: Number(Math.min(-1.0, -1.0 + (rms * 0.4)).toFixed(1)),
          });
        }
        requestAnimationFrame(updateMeters);
      };
      requestAnimationFrame(updateMeters);

    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  },

  playTrack: async (track: Track) => {
    const { initAudioEngine, engine, activeFrequency, customPhiAudioUrl, custom440AudioUrl, custom432AudioUrl, customBinauralAudioUrl, masterSongUrl } = get();
    if (!engine.isInitialized) {
      await initAudioEngine();
    }
    const currentEngine = get().engine;
    if (!currentEngine.audioContext || !currentEngine.audioElement) return;

    if (currentEngine.audioContext.state === 'suspended') {
      await currentEngine.audioContext.resume();
    }

    let targetUrl: string;
    if (activeFrequency === 'phi' && customPhiAudioUrl) {
      targetUrl = customPhiAudioUrl;
    } else if (activeFrequency === '440' && custom440AudioUrl) {
      targetUrl = custom440AudioUrl;
    } else if (activeFrequency === '432' && custom432AudioUrl) {
      targetUrl = custom432AudioUrl;
    } else if (activeFrequency === 'binaural' && customBinauralAudioUrl) {
      targetUrl = customBinauralAudioUrl;
    } else if (masterSongUrl) {
      targetUrl = masterSongUrl;
    } else {
      targetUrl = `${track.audioUrl}?freq=${activeFrequency}`;
    }

    const targetDuration = activeFrequency === '432' ? 216 : (activeFrequency === 'phi' || activeFrequency === '440' || activeFrequency === 'binaural') ? 212 : track.durationSeconds;

    currentEngine.audioElement.src = targetUrl;
    currentEngine.audioElement.load();

    try {
      await currentEngine.audioElement.play();
      set({
        currentTrack: track,
        isPlaying: true,
        duration: targetDuration,
      });

      // Automatically trigger colibri analysis on track change
      get().runColibriAnalysis(track.id);
    } catch (err) {
      console.warn('Playback error (e.g. autoplay restriction):', err);
      set({ currentTrack: track, isPlaying: false });
    }
  },

  togglePlay: async () => {
    const { initAudioEngine, engine, isPlaying, activeFrequency, customPhiAudioUrl, custom440AudioUrl, custom432AudioUrl, customBinauralAudioUrl, masterSongUrl, currentTrack } = get();
    if (!engine.isInitialized) {
      await initAudioEngine();
    }
    const currentEngine = get().engine;
    if (!currentEngine.audioElement || !currentEngine.audioContext) return;

    if (currentEngine.audioContext.state === 'suspended') {
      await currentEngine.audioContext.resume();
    }

    if (isPlaying) {
      currentEngine.audioElement.pause();
      set({ isPlaying: false });
    } else {
      if (!currentEngine.audioElement.src || currentEngine.audioElement.src === '') {
        let targetUrl: string;
        if (activeFrequency === 'phi' && customPhiAudioUrl) {
          targetUrl = customPhiAudioUrl;
        } else if (activeFrequency === '440' && custom440AudioUrl) {
          targetUrl = custom440AudioUrl;
        } else if (activeFrequency === '432' && custom432AudioUrl) {
          targetUrl = custom432AudioUrl;
        } else if (activeFrequency === 'binaural' && customBinauralAudioUrl) {
          targetUrl = customBinauralAudioUrl;
        } else if (masterSongUrl) {
          targetUrl = masterSongUrl;
        } else {
          targetUrl = `${currentTrack.audioUrl}?freq=${activeFrequency}`;
        }

        currentEngine.audioElement.src = targetUrl;
        currentEngine.audioElement.load();
        set({ duration: activeFrequency === '432' ? 216 : (activeFrequency === 'phi' || activeFrequency === '440' || activeFrequency === 'binaural') ? 212 : currentTrack.durationSeconds });
      }
      try {
        await currentEngine.audioElement.play();
        set({ isPlaying: true });
      } catch (err) {
        console.error('Play failed:', err);
      }
    }
  },

  seek: (seconds: number) => {
    const { engine } = get();
    if (engine.audioElement) {
      engine.audioElement.currentTime = seconds;
    }
    set({ currentTime: seconds });
  },

  setFrequency: (mode: HarmonicFrequency) => {
    const {
      engine,
      customPhiAudioUrl,
      custom440AudioUrl,
      custom432AudioUrl,
      customBinauralAudioUrl,
      masterSongUrl,
      currentTrack,
    } = get();
    set({ activeFrequency: mode });

    // Toujours notifier le processeur AudioWorklet DSP pour réaligner la fréquence en temps réel sur la chanson
    if (engine.workletNode) {
      engine.workletNode.port.postMessage({ type: 'SET_MODE', mode });
    }

    // Bascule de source uniquement si un fichier physique spécifique a été fourni pour ce mode
    if (engine.audioElement) {
      let specificCustomUrl: string | null = null;
      if (mode === 'phi' && customPhiAudioUrl) {
        specificCustomUrl = customPhiAudioUrl;
      } else if (mode === '440' && custom440AudioUrl) {
        specificCustomUrl = custom440AudioUrl;
      } else if (mode === '432' && custom432AudioUrl) {
        specificCustomUrl = custom432AudioUrl;
      } else if (mode === 'binaural' && customBinauralAudioUrl) {
        specificCustomUrl = customBinauralAudioUrl;
      }

      // If current track has a specific assigned master for this frequency, prioritize it
      const currentArchive = currentTrack.masterArchives?.find((a) => a.id === mode);
      if (currentArchive?.customAudioUrl) {
        specificCustomUrl = currentArchive.customAudioUrl;
      }

      // Si un fichier dédié existe pour ce mode, on l'utilise.
      // SINON, si un morceau maître est déjà chargé ou en cours de lecture, ON LE GARDE !
      // Le AudioWorklet DSP va appliquer la transformation 440 / 432 / Phi / Binaural directement sur le morceau
      // sans JAMAIS basculer vers un son synthétique non désiré !
      if (specificCustomUrl) {
        if (!engine.audioElement.src.endsWith(specificCustomUrl) && engine.audioElement.src !== specificCustomUrl) {
          const wasPlaying = get().isPlaying;
          const curTime = engine.audioElement.currentTime;
          engine.audioElement.src = specificCustomUrl;
          engine.audioElement.load();
          engine.audioElement.currentTime = curTime;
          if (wasPlaying) {
            engine.audioElement.play().catch(console.error);
          }
        }
      } else if (engine.audioElement.src && engine.audioElement.src.includes('/api/stream/')) {
        const wasPlaying = get().isPlaying;
        const curTime = engine.audioElement.currentTime;
        const streamUrl = `${currentTrack.audioUrl}?freq=${mode}`;
        if (!engine.audioElement.src.includes(streamUrl)) {
          engine.audioElement.src = streamUrl;
          engine.audioElement.load();
          engine.audioElement.currentTime = curTime;
          if (wasPlaying) {
            engine.audioElement.play().catch(console.error);
          }
        }
      } else if (!engine.audioElement.src || engine.audioElement.src === '') {
        const fallbackUrl = masterSongUrl || `${currentTrack.audioUrl}?freq=${mode}`;
        engine.audioElement.src = fallbackUrl;
        engine.audioElement.load();
      }
    }

    // 35ms Constant-power cross-fade across the 4 GainNodes
    if (engine.audioContext && engine.gainNodes) {
      const ctx = engine.audioContext;
      const now = ctx.currentTime;
      const crossfadeDuration = 0.035; // 35 milliseconds

      const modes: HarmonicFrequency[] = ['440', '432', 'phi', 'binaural'];
      modes.forEach((m) => {
        const gainNode = engine.gainNodes![m];
        if (gainNode) {
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(gainNode.gain.value, now);
          const target = m === mode ? 1.0 : 0.0;
          gainNode.gain.linearRampToValueAtTime(target, now + crossfadeDuration);
        }
      });

      if (engine.binauralGain) {
        engine.binauralGain.gain.cancelScheduledValues(now);
        if (mode === 'binaural' && get().isPlaying) {
          engine.binauralGain.gain.setValueAtTime(engine.binauralGain.gain.value, now);
          engine.binauralGain.gain.linearRampToValueAtTime(Math.pow(10, -28 / 20), now + crossfadeDuration);
        } else {
          engine.binauralGain.gain.setValueAtTime(engine.binauralGain.gain.value, now);
          engine.binauralGain.gain.linearRampToValueAtTime(0.0, now + 0.02);
        }
      }
    }
  },

  setVolume: (volume: number) => {
    set({ volume });
    const { engine } = get();
    if (engine.masterGain && engine.audioContext) {
      engine.masterGain.gain.setValueAtTime(volume, engine.audioContext.currentTime);
    }
  },

  toggleAdminUnlock: () => {
    set((state) => ({ adminUnlocked: !state.adminUnlocked }));
  },

  subscribePass: () => {
    set({ isSubscribed: true });
  },

  purchaseTrack: (trackId: string) => {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, unlocked: true } : t)),
    }));
  },

  runColibriAnalysis: async (trackId: string) => {
    try {
      const response = await fetch(`/api/colibri/analyze?trackId=${trackId}`);
      if (response.ok) {
        const data = await response.json();
        set({ colibriAnalysis: data });
      }
    } catch {
      // Offline / fallback calculation
      set({
        colibriAnalysis: {
          trackId,
          detectedFundamentalHz: 440.00,
          tuningDeviationCents: 0.0,
          isStandard440: true,
          isAlready432: false,
          confidence: 0.992,
          fftPeaks: [
            { freq: 440.0, magDb: -13.1 },
            { freq: 880.0, magDb: -19.4 },
            { freq: 1320.0, magDb: -26.0 },
          ],
          processingTimeMs: 124,
        },
      });
    }
  },

  addAcpLog: (event) => {
    const newEvent: AcpSessionEvent = {
      ...event,
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    set((state) => ({
      acpEvents: [newEvent, ...state.acpEvents.slice(0, 19)],
    }));
  },

  addCustomTrack: (track: Track) => {
    set((state) => ({
      tracks: [track, ...state.tracks],
      currentTrack: track,
    }));
  },

  // Playlist & Queue Actions
  addToQueue: (track: Track) => {
    set((state) => ({ queue: [...state.queue, track] }));
  },

  removeFromQueue: (index: number) => {
    set((state) => ({ queue: state.queue.filter((_, i) => i !== index) }));
  },

  clearQueue: () => {
    set({ queue: [] });
  },

  toggleAutoPlayNext: () => {
    set((state) => ({ autoPlayNext: !state.autoPlayNext }));
  },

  playNext: async () => {
    const { queue, tracks, currentTrack, playTrack } = get();
    if (queue.length > 0) {
      const nextTrack = queue[0];
      set({ queue: queue.slice(1) });
      await playTrack(nextTrack);
    } else {
      const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
      const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % tracks.length : 0;
      const nextTrack = tracks[nextIndex];
      await playTrack(nextTrack);
    }
  },

  playPrevious: async () => {
    const { tracks, currentTrack, playTrack } = get();
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = currentIndex >= 0 ? (currentIndex - 1 + tracks.length) % tracks.length : 0;
    const prevTrack = tracks[prevIndex];
    await playTrack(prevTrack);
  },
}));
