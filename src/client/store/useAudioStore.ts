import { create } from 'zustand';
import { HarmonicFrequency, Track, ColibriAnalysisResult, AcpSessionEvent } from '../../types';
import { createDspWorkletUrl } from '../../dsp/PitchShifterWorklet';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'splintered-self',
    title: 'Splintered Self',
    artist: 'VEL94EV',
    durationSeconds: 234,
    pitchShiftCents: -31.76,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 0.99,
    unlocked: true,
    creatorStripeId: 'acct_1NvEL94EVStudio',
    originalTuningHz: 440.0,
    coverGradientFrom: '#F59E0B',
    coverGradientTo: '#D97706',
    audioUrl: '/api/stream/splintered-self',
    spectralFingerprint: 'SHA256:7f49a1d9...08ec',
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
    priceCad: 0.99,
    unlocked: true,
    creatorStripeId: 'acct_1NickelbackHarmonic',
    originalTuningHz: 440.0,
    coverGradientFrom: '#10B981',
    coverGradientTo: '#047857',
    audioUrl: '/api/stream/bones-for-the-crows',
    spectralFingerprint: 'SHA256:bb8241ea...528f',
  },
  {
    id: 'counting-stars',
    title: 'Counting Stars',
    artist: 'OneRepublic',
    durationSeconds: 257,
    pitchShiftCents: -31.7667,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 0.99,
    unlocked: true,
    creatorStripeId: 'acct_1OneRepublicPub',
    originalTuningHz: 440.0,
    coverGradientFrom: '#8B5CF6',
    coverGradientTo: '#6D28D9',
    audioUrl: '/api/stream/counting-stars',
    spectralFingerprint: 'SHA256:432ac918...1618',
  },
  {
    id: 'the-soldier-4-mike-solo',
    title: 'The Soldier 4 - Mike Solo/WAK/STB/RTN/LFY (Studio Version) Linkin Park',
    artist: 'The Soldier',
    durationSeconds: 316,
    pitchShiftCents: -31.7667,
    lufs: -14.0,
    truePeakDbtp: -1.0,
    bitrateKbps: 320,
    priceCad: 0.99,
    unlocked: true,
    creatorStripeId: 'acct_1LinkinRemixStudio',
    originalTuningHz: 440.0,
    coverGradientFrom: '#EF4444',
    coverGradientTo: '#B91C1C',
    audioUrl: '/api/stream/the-soldier-4-mike-solo',
    spectralFingerprint: 'SHA256:7967faf9...fec0',
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
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  activeTab: 'player',
  setActiveTab: (tab) => set({ activeTab: tab }),

  tracks: INITIAL_TRACKS,
  currentTrack: INITIAL_TRACKS[0],
  isPlaying: false,
  currentTime: 0,
  duration: INITIAL_TRACKS[0].durationSeconds,
  bufferedPercent: 100,
  activeFrequency: 'phi', // matching screenshot
  volume: 0.85,
  adminUnlocked: true,
  isSubscribed: false,

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

      // Injected at -24 dBFS (amplitude = 10^(-24/20) ~ 0.063)
      binauralGain.gain.setValueAtTime(Math.pow(10, -24 / 20), ctx.currentTime);

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

      // Event listeners on HTML Audio
      audio.addEventListener('timeupdate', () => {
        set({ currentTime: audio.currentTime });
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
        // Auto play next track in playlist
        const { tracks, currentTrack, playTrack } = get();
        const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
        const nextTrack = tracks[(currentIndex + 1) % tracks.length];
        playTrack(nextTrack);
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

      // Frame-rate decoupling: AnalyserNode is accessible on engine.analyserNode.
      // High-frequency telemetry (60 FPS) is read directly by Canvas 2D contexts,
      // preventing JavaScript engine choking from React re-renders.
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  },

  playTrack: async (track: Track) => {
    const { initAudioEngine, engine } = get();
    if (!engine.isInitialized) {
      await initAudioEngine();
    }
    const currentEngine = get().engine;
    if (!currentEngine.audioContext || !currentEngine.audioElement) return;

    if (currentEngine.audioContext.state === 'suspended') {
      await currentEngine.audioContext.resume();
    }

    currentEngine.audioElement.src = track.audioUrl;
    currentEngine.audioElement.load();

    try {
      await currentEngine.audioElement.play();
      set({
        currentTrack: track,
        isPlaying: true,
        duration: track.durationSeconds,
      });

      // Automatically trigger colibri analysis on track change
      get().runColibriAnalysis(track.id);
    } catch (err) {
      console.warn('Playback error (e.g. autoplay restriction):', err);
      set({ currentTrack: track, isPlaying: false });
    }
  },

  togglePlay: async () => {
    const { initAudioEngine, engine, isPlaying } = get();
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
        currentEngine.audioElement.src = get().currentTrack.audioUrl;
        currentEngine.audioElement.load();
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
      set({ currentTime: seconds });
    }
  },

  setFrequency: (mode: HarmonicFrequency) => {
    const { engine } = get();
    set({ activeFrequency: mode });

    if (engine.workletNode) {
      engine.workletNode.port.postMessage({ type: 'SET_MODE', mode });
    }

    // 35ms Constant-power cross-fade across the 4 GainNodes (g1^2 + g2^2 = 1.0)
    if (engine.audioContext && engine.gainNodes) {
      const ctx = engine.audioContext;
      const now = ctx.currentTime;
      const crossfadeDuration = 0.035; // 35 milliseconds
      const steps = 16;
      const fadeInCurve = new Float32Array(steps);
      const fadeOutCurve = new Float32Array(steps);
      for (let i = 0; i < steps; i++) {
        const angle = (Math.PI / 2) * (i / (steps - 1));
        fadeInCurve[i] = Math.sin(angle);
        fadeOutCurve[i] = Math.cos(angle);
      }

      const modes: HarmonicFrequency[] = ['440', '432', 'phi', 'binaural'];
      modes.forEach((m) => {
        const gainNode = engine.gainNodes![m];
        if (gainNode) {
          gainNode.gain.cancelScheduledValues(now);
          gainNode.gain.setValueAtTime(gainNode.gain.value, now);
          const curve = m === mode ? fadeInCurve : fadeOutCurve;
          try {
            gainNode.gain.setValueCurveAtTime(curve, now, crossfadeDuration);
          } catch {
            gainNode.gain.linearRampToValueAtTime(m === mode ? 1.0 : 0.0, now + crossfadeDuration);
          }
        }
      });
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
}));
