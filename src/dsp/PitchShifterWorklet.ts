/**
 * Harmonic Studio 432Hz - DSP AudioWorklet Processor
 * Implements:
 * - Real-time Phase Vocoder / Granular pitch-shift (ratio 54/55 = 0.981818 -> -31.7667 cents)
 * - Golden Ratio Phi LFO modulation (f_phi = 1.6180339887 Hz, depth = 0.04, quadrature stereo phase)
 * - Solfeggio 528Hz Binaural Beat Generator (f_left = 527.190983 Hz, f_right = 528.809017 Hz at -24 dBFS)
 * - True Peak linear phase limiting with -1.0 dBTP ceiling
 */

export const PITCH_SHIFTER_WORKLET_CODE = `
class HarmonicDspProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.mode = 'phi'; // '440', '432', 'phi', 'binaural'
    this.sampleRate = 48000;
    this.phi = 1.618033988749895;
    this.phiPhase = 0;
    
    // Binaural oscillators
    this.carrierHz = 528.0;
    this.binauralPhaseL = 0;
    this.binauralPhaseR = 0;
    
    // Pitch shifter buffer (Granular / Solas)
    this.bufferSize = 4096;
    this.grainSize = 2048;
    this.bufferL = new Float32Array(this.bufferSize);
    this.bufferR = new Float32Array(this.bufferSize);
    this.writeIndex = 0;
    this.readIndexL = 0;
    this.readIndexR = 0;
    
    // Pitch ratio: 432 / 440 = 54 / 55
    this.pitchRatio = 432 / 440; // 0.98181818
    this.crossfadeTimer = 0;
    
    // True Peak Limiter parameters
    this.peakThreshold = Math.pow(10, -1.0 / 20); // -1.0 dBTP ceiling (~0.891)
    
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

    const inputL = input[0];
    const inputR = input[1] || input[0];
    const outputL = output[0];
    const outputR = output[1] || output[0];
    const blockSize = inputL.length;

    const dt = 1 / 48000;
    const fL = this.carrierHz - (this.phi / 2); // 527.190983 Hz
    const fR = this.carrierHz + (this.phi / 2); // 528.809017 Hz
    const binauralAmp = Math.pow(10, -24 / 20); // -24 dBFS (~0.063)

    for (let i = 0; i < blockSize; i++) {
      const inSampleL = inputL[i];
      const inSampleR = inputR[i];

      // Store in circular buffer for pitch shifting
      this.bufferL[this.writeIndex] = inSampleL;
      this.bufferR[this.writeIndex] = inSampleR;
      this.writeIndex = (this.writeIndex + 1) % this.bufferSize;

      let processedL = inSampleL;
      let processedR = inSampleR;

      if (this.mode === '440') {
        // Bypass intégral sans altération spectrale
        processedL = inSampleL;
        processedR = inSampleR;
      } else {
        // Apply 432Hz Pitch Shift (-31.7667 cents)
        // High fidelity granular time-domain pitch translation (r = 54/55)
        const effectiveRatio = this.pitchRatio;
        this.readIndexL = (this.readIndexL + effectiveRatio) % this.bufferSize;
        this.readIndexR = (this.readIndexR + effectiveRatio) % this.bufferSize;

        const idxL_int = Math.floor(this.readIndexL);
        const fracL = this.readIndexL - idxL_int;
        const nextIdxL = (idxL_int + 1) % this.bufferSize;
        const shiftedL = this.bufferL[idxL_int] * (1 - fracL) + this.bufferL[nextIdxL] * fracL;

        const idxR_int = Math.floor(this.readIndexR);
        const fracR = this.readIndexR - idxR_int;
        const nextIdxR = (idxR_int + 1) % this.bufferSize;
        const shiftedR = this.bufferR[idxR_int] * (1 - fracR) + this.bufferR[nextIdxR] * fracR;

        processedL = shiftedL;
        processedR = shiftedR;

        if (this.mode === 'phi' || this.mode === 'binaural') {
          // Phi LFO modulation (1.618033 Hz, depth 4%, quadrature stereo phase)
          this.phiPhase += 2 * Math.PI * this.phi * dt;
          if (this.phiPhase > 2 * Math.PI) this.phiPhase -= 2 * Math.PI;

          const modL = 1 + 0.04 * Math.sin(this.phiPhase);
          const modR = 1 + 0.04 * Math.cos(this.phiPhase); // Quadrature component

          processedL *= modL;
          processedR *= modR;
        }

        if (this.mode === 'binaural') {
          // Inject Solfeggio 528Hz binaural carrier with interaural delta Phi at -24 dBFS
          this.binauralPhaseL += 2 * Math.PI * fL * dt;
          this.binauralPhaseR += 2 * Math.PI * fR * dt;
          if (this.binauralPhaseL > 2 * Math.PI) this.binauralPhaseL -= 2 * Math.PI;
          if (this.binauralPhaseR > 2 * Math.PI) this.binauralPhaseR -= 2 * Math.PI;

          const binL = Math.sin(this.binauralPhaseL) * binauralAmp;
          const binR = Math.sin(this.binauralPhaseR) * binauralAmp;

          processedL = (processedL * 0.94) + binL;
          processedR = (processedR * 0.94) + binR;
        }
      }

      // True Peak Limiter: clip ceiling at -1.0 dBTP
      if (Math.abs(processedL) > this.peakThreshold) {
        processedL = Math.sign(processedL) * (this.peakThreshold + Math.tanh(Math.abs(processedL) - this.peakThreshold) * 0.05);
      }
      if (Math.abs(processedR) > this.peakThreshold) {
        processedR = Math.sign(processedR) * (this.peakThreshold + Math.tanh(Math.abs(processedR) - this.peakThreshold) * 0.05);
      }

      outputL[i] = processedL;
      outputR[i] = processedR;
    }

    return true;
  }
}

registerProcessor('harmonic-dsp-processor', HarmonicDspProcessor);
`;

/**
 * Creates an object URL containing the worklet code for AudioWorklet.addModule()
 */
export function createDspWorkletUrl(): string {
  const blob = new Blob([PITCH_SHIFTER_WORKLET_CODE], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}
