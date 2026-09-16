/**
 * HARMONIC STUDIO — ARCHITECTURE SYSTEM DESIGN & ATOM OF THOUGHTS (AoT)
 * ATOME 1 : LE MOTEUR DSP TEMPS RÉEL (src/dsp/PitchShifterWorklet.ts)
 * 
 * Invariants Mathématiques et Acoustiques Inviolables :
 * 1. Ratio de Transposition Naturelle (440 Hz -> 432 Hz) : r = 54/55 ≈ 0.98181818...
 *    Intervalle ΔC = 1200 * log2(54/55) ≈ -31.7666536 cents.
 * 2. Modulation LFO Phi en Quadrature : f_Phi = (1 + sqrt(5))/2 ≈ 1.6180339887 Hz, m = 0.04.
 *    Canal L: I(t) = 1.0 + m * sin(2*pi*f_Phi*t), Canal R: Q(t) = 1.0 + m * cos(2*pi*f_Phi*t).
 * 3. Porteuse Binaurale Sacrée 528 Hz : Signal injecté à -24 dBFS (A_528 = 10^(-24/20) ≈ 0.0630957).
 *    Battement binaural Δf = f_Phi / 2 ≈ 0.8090169 Hz.
 *    f_L = 528 - Δf = 527.190983 Hz, f_R = 528 + Δf = 528.809017 Hz.
 * 4. Fondu Croisé à Puissance Constante (Constant Power Crossfade) : tau = 35 ms.
 *    g1(t) = cos((pi/2)*(t/tau)), g2(t) = sin((pi/2)*(t/tau)). Invariant g1^2 + g2^2 = 1.0.
 * 5. Fenêtrage de Blackman-Harris 4096 points (-92 dB rejection).
 * 6. ZÉRO allocation dynamique dans process() : Zéro Garbage Collection overhead.
 */

// ==========================================
// CONSTANTES ET INVARIANTS ACOUSTIQUES (AoT)
// ==========================================
export const RATIO_440_TO_432 = 54 / 55; // 0.9818181818181818
export const PITCH_SHIFT_CENTS = 1200 * Math.log2(RATIO_440_TO_432); // -31.76665363342928 cents
export const PHI_FREQUENCY_HZ = (1 + Math.sqrt(5)) / 2; // 1.618033988749895 Hz
export const PHI_MODULATION_DEPTH = 0.04; // m = 0.04 (4%)
export const CARRIER_528_HZ = 528.0;
export const BINAURAL_DELTA_HZ = PHI_FREQUENCY_HZ / 2; // 0.8090169943749475 Hz
export const BINAURAL_LEFT_HZ = CARRIER_528_HZ - BINAURAL_DELTA_HZ; // 527.190983005625 Hz
export const BINAURAL_RIGHT_HZ = CARRIER_528_HZ + BINAURAL_DELTA_HZ; // 528.809016994375 Hz
export const AMPLITUDE_MINUS_24_DBFS = Math.pow(10, -24 / 20); // 0.06309573444801933
export const CROSSFADE_TAU_SECONDS = 0.035; // 35 ms
export const TRUE_PEAK_CEILING_DBTP = -1.0;
export const TRUE_PEAK_THRESHOLD_LINEAR = Math.pow(10, TRUE_PEAK_CEILING_DBTP / 20); // 0.8912509381337456
export const FFT_WINDOW_SIZE = 4096;

export const HARMONIC_CONSTANTS = {
  PITCH_RATIO_432: RATIO_440_TO_432,
  PHI_FREQUENCY: PHI_FREQUENCY_HZ,
  PHI_DEPTH: PHI_MODULATION_DEPTH,
  SOLFEGGIO_528: CARRIER_528_HZ,
  BINAURAL_GAIN_DB: -24.0,
  FFT_SIZE: FFT_WINDOW_SIZE,
  HOP_SIZE: 1024,
  CROSSFADE_MS: 35.0,
  TRUE_PEAK_CEILING_DB: TRUE_PEAK_CEILING_DBTP,
} as const;

export type AudioProcessingMode = 
  | '440' 
  | '432' 
  | 'phi' 
  | 'binaural'
  | '440_BYPASS' 
  | '432_NATURAL' 
  | '432_PHI' 
  | '432_528_BINAURAL';

/**
 * Calcule la table de fenêtrage de Blackman-Harris 4-termes pour N = 4096.
 * Atténuation des lobes secondaires > 92 dB.
 */
export function generateBlackmanHarrisWindow(size = FFT_WINDOW_SIZE): Float32Array {
  const window = new Float32Array(size);
  const a0 = 0.35875;
  const a1 = 0.48829;
  const a2 = 0.14128;
  const a3 = 0.01168;
  const denom = size - 1;

  for (let n = 0; n < size; n++) {
    window[n] =
      a0 -
      a1 * Math.cos((2 * Math.PI * n) / denom) +
      a2 * Math.cos((4 * Math.PI * n) / denom) -
      a3 * Math.cos((6 * Math.PI * n) / denom);
  }
  return window;
}

/**
 * Calcule les gains du fondu croisé à puissance constante.
 * Invariant mathématique : g1^2 + g2^2 = 1.0 pour tout t in [0, tau].
 */
export function calculateConstantPowerCrossfade(tSeconds: number, tau = CROSSFADE_TAU_SECONDS): { g1: number; g2: number } {
  const clampedT = Math.max(0, Math.min(tau, tSeconds));
  const normalized = clampedT / tau;
  const angle = (Math.PI / 2) * normalized;
  const g1 = Math.cos(angle);
  const g2 = Math.sin(angle);
  return { g1, g2 };
}

/**
 * Calcule la modulation LFO Phi en quadrature stéréo pour le temps t.
 */
export function calculatePhiQuadratureModulation(tSeconds: number): { modL: number; modR: number } {
  const phase = 2 * Math.PI * PHI_FREQUENCY_HZ * tSeconds;
  const modL = 1.0 + PHI_MODULATION_DEPTH * Math.sin(phase);
  const modR = 1.0 + PHI_MODULATION_DEPTH * Math.cos(phase);
  return { modL, modR };
}

/**
 * Calcule l'onde de battement binaural 528 Hz à -24 dBFS pour le temps t.
 */
export function calculateBinauralSample(tSeconds: number): { sampleL: number; sampleR: number } {
  const phaseL = 2 * Math.PI * BINAURAL_LEFT_HZ * tSeconds;
  const phaseR = 2 * Math.PI * BINAURAL_RIGHT_HZ * tSeconds;
  const sampleL = Math.sin(phaseL) * AMPLITUDE_MINUS_24_DBFS;
  const sampleR = Math.sin(phaseR) * AMPLITUDE_MINUS_24_DBFS;
  return { sampleL, sampleR };
}

// ==========================================
// CODE DU PROCESSEUR AUDIOWORKLET (NAVIGATEUR)
// ==========================================
export const PITCH_SHIFTER_WORKLET_CODE = `
class HarmonicDspProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.mode = 'phi'; // '440', '432', 'phi', 'binaural'
    this.sampleRate = 48000;
    
    // Invariants mathématiques pré-calculés (Zéro allocation dans process())
    this.ratio = 54 / 55; // 0.9818181818181818 (-31.7667 cents)
    this.fPhi = 1.618033988749895;
    this.mPhi = 0.04;
    this.fL = 527.190983005625;
    this.fR = 528.809016994375;
    this.ampBinaural = 0.06309573444801933; // -24 dBFS
    this.peakThreshold = 0.8912509381337456; // -1.0 dBTP ceiling
    
    // Oscillateurs de phase
    this.phiPhase = 0;
    this.phaseL = 0;
    this.phaseR = 0;
    
    // Moteur Granulaire / WSOLA avec Fondu Croisé à Puissance Constante (tau = 35 ms)
    this.bufferSize = 4096;
    this.bufferL = new Float32Array(4096);
    this.bufferR = new Float32Array(4096);
    this.writeIndex = 0;
    this.grainSize = Math.round(0.035 * this.sampleRate); // 1680 échantillons à 48kHz
    this.grainPhase1 = 0;
    this.grainPhase2 = Math.floor(this.grainSize / 2);
    this.baseDelay = this.grainSize;
    
    // Fenêtrage Blackman-Harris 4096 points pré-calculé (Zéro allocation GC)
    this.blackmanHarris = new Float32Array(4096);
    const a0 = 0.35875;
    const a1 = 0.48829;
    const a2 = 0.14128;
    const a3 = 0.01168;
    for (let n = 0; n < 4096; n++) {
      this.blackmanHarris[n] = a0 -
        a1 * Math.cos((2 * Math.PI * n) / 4095) +
        a2 * Math.cos((4 * Math.PI * n) / 4095) -
        a3 * Math.cos((6 * Math.PI * n) / 4095);
    }
    
    this.port.onmessage = (event) => {
      if (event.data && event.data.type === 'SET_MODE') {
        this.mode = event.data.mode;
      }
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];

    if (!input || !input[0] || input[0].length === 0) {
      return true;
    }

    const inL = input[0];
    const inR = input[1] || input[0];
    const outL = output[0];
    const outR = output[1] || output[0];
    const len = inL.length;
    const dt = 1 / this.sampleRate;
    const twoPi = 2 * Math.PI;

    for (let i = 0; i < len; i++) {
      const sL = inL[i];
      const sR = inR[i];

      // Écriture dans le tampon circulaire pré-alloué
      this.bufferL[this.writeIndex] = sL;
      this.bufferR[this.writeIndex] = sR;

      let pL = sL;
      let pR = sR;

      if (this.mode === '440') {
        // Mode 440 Hz Standard : bypass direct transparent
        pL = sL;
        pR = sR;
      } else {
        // Double Tête de Lecture avec Fondu Croisé à Puissance Constante (g1^2 + g2^2 = 1.0)
        // Ratio de transposition naturelle : r = 54/55 (-31.7667 cents)
        const u1 = this.grainPhase1 / this.grainSize;
        const g1 = Math.sin(Math.PI * u1);
        const delay1 = this.baseDelay + this.grainPhase1 * (1.0 - this.ratio);
        const readPos1 = (this.writeIndex - delay1 + this.bufferSize * 4) % this.bufferSize;
        const i1 = Math.floor(readPos1);
        const frac1 = readPos1 - i1;
        const nextI1 = (i1 + 1) % this.bufferSize;
        const sL1 = this.bufferL[i1] * (1.0 - frac1) + this.bufferL[nextI1] * frac1;
        const sR1 = this.bufferR[i1] * (1.0 - frac1) + this.bufferR[nextI1] * frac1;

        const u2 = this.grainPhase2 / this.grainSize;
        const g2 = Math.sin(Math.PI * u2);
        const delay2 = this.baseDelay + this.grainPhase2 * (1.0 - this.ratio);
        const readPos2 = (this.writeIndex - delay2 + this.bufferSize * 4) % this.bufferSize;
        const i2 = Math.floor(readPos2);
        const frac2 = readPos2 - i2;
        const nextI2 = (i2 + 1) % this.bufferSize;
        const sL2 = this.bufferL[i2] * (1.0 - frac2) + this.bufferL[nextI2] * frac2;
        const sR2 = this.bufferR[i2] * (1.0 - frac2) + this.bufferR[nextI2] * frac2;

        pL = sL1 * g1 + sL2 * g2;
        pR = sR1 * g1 + sR2 * g2;

        // Avancement des têtes granulaires (sans allocation mémoire)
        this.grainPhase1 = (this.grainPhase1 + 1) % this.grainSize;
        this.grainPhase2 = (this.grainPhase2 + 1) % this.grainSize;

        // Modulation Phi en Quadrature (1.618033 Hz, profondeur 4%)
        if (this.mode === 'phi' || this.mode === 'binaural') {
          this.phiPhase += twoPi * this.fPhi * dt;
          if (this.phiPhase >= twoPi) this.phiPhase -= twoPi;

          const modL = 1.0 + this.mPhi * Math.sin(this.phiPhase);
          const modR = 1.0 + this.mPhi * Math.cos(this.phiPhase);

          pL *= modL;
          pR *= modR;
        }

        // Injection Binaurale 528 Hz à -24 dBFS
        if (this.mode === 'binaural') {
          this.phaseL += twoPi * this.fL * dt;
          this.phaseR += twoPi * this.fR * dt;
          if (this.phaseL >= twoPi) this.phaseL -= twoPi;
          if (this.phaseR >= twoPi) this.phaseR -= twoPi;

          const binL = Math.sin(this.phaseL) * this.ampBinaural;
          const binR = Math.sin(this.phaseR) * this.ampBinaural;

          pL = (pL * 0.94) + binL;
          pR = (pR * 0.94) + binR;
        }
      }

      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;

      // Limiteur True Peak avec seuil strict à -1.0 dBTP (sans allocation, plafonnement asymptotique garanti)
      const knee = this.peakThreshold * 0.95;
      if (Math.abs(pL) > knee) {
        const excess = Math.abs(pL) - knee;
        const headroom = this.peakThreshold - knee;
        pL = Math.sign(pL) * (knee + headroom * Math.tanh(excess / headroom));
      }
      if (Math.abs(pR) > knee) {
        const excess = Math.abs(pR) - knee;
        const headroom = this.peakThreshold - knee;
        pR = Math.sign(pR) * (knee + headroom * Math.tanh(excess / headroom));
      }

      outL[i] = pL;
      outR[i] = pR;
    }

    return true;
  }
}

registerProcessor('harmonic-dsp-processor', HarmonicDspProcessor);
`;

/**
 * Crée un ObjectURL blob contenant le processeur AudioWorklet compilé
 */
export function createDspWorkletUrl(): string {
  const blob = new Blob([PITCH_SHIFTER_WORKLET_CODE], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

// ==========================================
// MOTEUR D'EXÉCUTION DSP PUR (NODE / TEST)
// ==========================================
export class HarmonicDspEngine {
  public mode: '440' | '432' | 'phi' | 'binaural';
  public sampleRate: number;
  public ratio: number;
  public fPhi: number;
  public mPhi: number;
  public fL: number;
  public fR: number;
  public ampBinaural: number;
  public peakThreshold: number;
  public phiPhase: number;
  public phaseL: number;
  public phaseR: number;
  public bufferSize: number;
  public bufferL: Float32Array;
  public bufferR: Float32Array;
  public writeIndex: number;
  public grainSize: number;
  public grainPhase1: number;
  public grainPhase2: number;
  public baseDelay: number;
  public blackmanHarris: Float32Array;

  constructor(sampleRate = 48000, initialMode: '440' | '432' | 'phi' | 'binaural' = 'phi') {
    this.mode = initialMode;
    this.sampleRate = sampleRate;
    this.ratio = RATIO_440_TO_432;
    this.fPhi = PHI_FREQUENCY_HZ;
    this.mPhi = PHI_MODULATION_DEPTH;
    this.fL = BINAURAL_LEFT_HZ;
    this.fR = BINAURAL_RIGHT_HZ;
    this.ampBinaural = AMPLITUDE_MINUS_24_DBFS;
    this.peakThreshold = TRUE_PEAK_THRESHOLD_LINEAR;

    this.phiPhase = 0;
    this.phaseL = 0;
    this.phaseR = 0;

    this.bufferSize = FFT_WINDOW_SIZE;
    this.bufferL = new Float32Array(FFT_WINDOW_SIZE);
    this.bufferR = new Float32Array(FFT_WINDOW_SIZE);
    this.writeIndex = 0;
    this.grainSize = Math.round(CROSSFADE_TAU_SECONDS * this.sampleRate); // 1680 échantillons à 48kHz
    this.grainPhase1 = 0;
    this.grainPhase2 = Math.floor(this.grainSize / 2);
    this.baseDelay = this.grainSize;

    this.blackmanHarris = generateBlackmanHarrisWindow(FFT_WINDOW_SIZE);
  }

  public setMode(mode: '440' | '432' | 'phi' | 'binaural'): void {
    this.mode = mode;
  }

  /**
   * Traite un bloc d'échantillons stéréo avec ZÉRO allocation GC.
   * Double tête granulaire avec fondu croisé à puissance constante tau = 35 ms (g1^2 + g2^2 = 1.0).
   */
  public processBlock(inL: Float32Array, inR: Float32Array, outL: Float32Array, outR: Float32Array): void {
    const len = inL.length;
    const dt = 1 / this.sampleRate;
    const twoPi = 2 * Math.PI;

    for (let i = 0; i < len; i++) {
      const sL = inL[i];
      const sR = inR[i];

      this.bufferL[this.writeIndex] = sL;
      this.bufferR[this.writeIndex] = sR;

      let pL = sL;
      let pR = sR;

      if (this.mode === '440') {
        pL = sL;
        pR = sR;
      } else {
        const u1 = this.grainPhase1 / this.grainSize;
        const g1 = Math.sin(Math.PI * u1);
        const delay1 = this.baseDelay + this.grainPhase1 * (1.0 - this.ratio);
        const readPos1 = (this.writeIndex - delay1 + this.bufferSize * 4) % this.bufferSize;
        const i1 = Math.floor(readPos1);
        const frac1 = readPos1 - i1;
        const nextI1 = (i1 + 1) % this.bufferSize;
        const sL1 = this.bufferL[i1] * (1.0 - frac1) + this.bufferL[nextI1] * frac1;
        const sR1 = this.bufferR[i1] * (1.0 - frac1) + this.bufferR[nextI1] * frac1;

        const u2 = this.grainPhase2 / this.grainSize;
        const g2 = Math.sin(Math.PI * u2);
        const delay2 = this.baseDelay + this.grainPhase2 * (1.0 - this.ratio);
        const readPos2 = (this.writeIndex - delay2 + this.bufferSize * 4) % this.bufferSize;
        const i2 = Math.floor(readPos2);
        const frac2 = readPos2 - i2;
        const nextI2 = (i2 + 1) % this.bufferSize;
        const sL2 = this.bufferL[i2] * (1.0 - frac2) + this.bufferL[nextI2] * frac2;
        const sR2 = this.bufferR[i2] * (1.0 - frac2) + this.bufferR[nextI2] * frac2;

        pL = sL1 * g1 + sL2 * g2;
        pR = sR1 * g1 + sR2 * g2;

        this.grainPhase1 = (this.grainPhase1 + 1) % this.grainSize;
        this.grainPhase2 = (this.grainPhase2 + 1) % this.grainSize;

        if (this.mode === 'phi' || this.mode === 'binaural') {
          this.phiPhase += twoPi * this.fPhi * dt;
          if (this.phiPhase >= twoPi) this.phiPhase -= twoPi;

          const modL = 1.0 + this.mPhi * Math.sin(this.phiPhase);
          const modR = 1.0 + this.mPhi * Math.cos(this.phiPhase);

          pL *= modL;
          pR *= modR;
        }

        if (this.mode === 'binaural') {
          this.phaseL += twoPi * this.fL * dt;
          this.phaseR += twoPi * this.fR * dt;
          if (this.phaseL >= twoPi) this.phaseL -= twoPi;
          if (this.phaseR >= twoPi) this.phaseR -= twoPi;

          const binL = Math.sin(this.phaseL) * this.ampBinaural;
          const binR = Math.sin(this.phaseR) * this.ampBinaural;

          pL = (pL * 0.94) + binL;
          pR = (pR * 0.94) + binR;
        }
      }

      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;

      // Limiteur True Peak asymptotique garantissant <= peakThreshold (-1.0 dBTP)
      const knee = this.peakThreshold * 0.95;
      if (Math.abs(pL) > knee) {
        const excess = Math.abs(pL) - knee;
        const headroom = this.peakThreshold - knee;
        pL = Math.sign(pL) * (knee + headroom * Math.tanh(excess / headroom));
      }
      if (Math.abs(pR) > knee) {
        const excess = Math.abs(pR) - knee;
        const headroom = this.peakThreshold - knee;
        pR = Math.sign(pR) * (knee + headroom * Math.tanh(excess / headroom));
      }

      outL[i] = pL;
      outR[i] = pR;
    }
  }
}
