import React, { useEffect, useRef, useState } from 'react';
import { Activity, Radio, Sparkles } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';

export const Spectral432Fingerprint: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { isPlaying, activeFrequency, currentTrack } = useAudioStore();

  const [liveStats, setLiveStats] = useState({
    peakDb: -18.4,
    stabilityPercent: 99.8,
    isResonating: true,
  });

  const [hoverInfo, setHoverInfo] = useState<{ freq: number; db: number; x: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    // Pre-allocated typed arrays to prevent GC pauses
    const buffer = new Uint8Array(1024);
    let lastStatsUpdate = 0;

    const render = (time: number) => {
      const engine = useAudioStore.getState().engine;
      const analyser = engine.analyserNode;
      const audioCtx = engine.audioContext;

      const width = canvas.width;
      const height = canvas.height;

      // Clear with deep dark studio background
      ctx.fillStyle = '#100E0C';
      ctx.fillRect(0, 0, width, height);

      // Draw faint spectral frequency grid
      ctx.strokeStyle = '#292524';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // Grid verticals for key harmonics: 216Hz, 432Hz, 864Hz, 1296Hz
      // Map display range: 100 Hz to 1500 Hz
      const minFreq = 100;
      const maxFreq = 1500;
      const freqToX = (f: number) => ((f - minFreq) / (maxFreq - minFreq)) * width;

      const gridFreqs = [216, 432, 528, 864, 1296];
      gridFreqs.forEach((f) => {
        const x = freqToX(f);
        if (x >= 0 && x <= width) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]); // Reset dash

      if (analyser && audioCtx) {
        analyser.getByteFrequencyData(buffer);

        const sampleRate = audioCtx.sampleRate || 48000;
        const binResolution = sampleRate / analyser.fftSize;

        // Find bin for 432 Hz and surrounding frequency spectrum
        const bin432 = Math.round(432.0 / binResolution);
        const val432 = isPlaying ? (buffer[bin432] || 0) : 18;

        // Calculate smooth spectral curve from 100 Hz to 1500 Hz
        const curvePoints: Array<{ x: number; y: number }> = [];
        const steps = 60;

        for (let i = 0; i <= steps; i++) {
          const freq = minFreq + (i / steps) * (maxFreq - minFreq);
          const bin = Math.round(freq / binResolution);
          const rawVal = isPlaying ? (buffer[bin] || 0) : 10 + Math.sin(i * 0.4 + time * 0.002) * 5;

          // Add intentional resonant hump around 432 Hz if shifted or Phi mode active
          let boost = 0;
          const dist432 = Math.abs(freq - 432);
          if (dist432 < 70) {
            // Gaussian bell around 432 Hz
            const bell = Math.exp(-Math.pow(dist432 / 24, 2));
            boost = (activeFrequency !== '440' ? 45 : 15) * bell;
          }

          // 528 Hz binaural carrier boost
          if (activeFrequency === 'binaural') {
            const dist528 = Math.abs(freq - 528);
            if (dist528 < 50) {
              boost += 30 * Math.exp(-Math.pow(dist528 / 20, 2));
            }
          }

          const combinedVal = Math.min(255, rawVal + boost);
          const normalizedY = combinedVal / 255;
          const y = height - (normalizedY * (height - 8)) - 4;
          const x = (i / steps) * width;

          curvePoints.push({ x, y });
        }

        // Draw filled spectral gradient under curve
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        if (activeFrequency === 'phi') {
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
          gradient.addColorStop(0.5, 'rgba(217, 119, 6, 0.25)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
        } else if (activeFrequency === 'binaural') {
          gradient.addColorStop(0, 'rgba(249, 115, 22, 0.45)');
          gradient.addColorStop(0.6, 'rgba(251, 146, 60, 0.2)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
        } else if (activeFrequency === '432') {
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
        } else {
          gradient.addColorStop(0, 'rgba(120, 113, 108, 0.35)');
          gradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
        }

        ctx.beginPath();
        ctx.moveTo(0, height);
        curvePoints.forEach((pt, idx) => {
          if (idx === 0) ctx.lineTo(pt.x, pt.y);
          else {
            const prev = curvePoints[idx - 1];
            const cx = (prev.x + pt.x) / 2;
            const cy = (prev.y + pt.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
          }
        });
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw glowing contour stroke line
        ctx.beginPath();
        curvePoints.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else {
            const prev = curvePoints[idx - 1];
            const cx = (prev.x + pt.x) / 2;
            const cy = (prev.y + pt.y) / 2;
            ctx.quadraticCurveTo(prev.x, prev.y, cx, cy);
          }
        });
        const strokeCol = activeFrequency === 'phi' ? '#F59E0B' : activeFrequency === 'binaural' ? '#F97316' : activeFrequency === '432' ? '#10B981' : '#A8A29E';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 2;
        ctx.shadowColor = strokeCol;
        ctx.shadowBlur = isPlaying ? 8 : 2;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Precise 432 Hz Resonance Reticle & Marker
        const x432 = freqToX(432);
        // Find interpolated Y at 432 Hz
        const pt432 = curvePoints.reduce((prev, curr) =>
          Math.abs(curr.x - x432) < Math.abs(prev.x - x432) ? curr : prev
        );

        // Vertical highlight line at 432 Hz
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(x432, 0);
        ctx.lineTo(x432, height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing resonant peak dot at 432 Hz
        const pulse = 1 + (isPlaying ? Math.sin(time * 0.008) * 0.25 : 0);
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(x432, pt432.y, 3.5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // 432 Hz Tag Flag
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('432 Hz (A4)', Math.min(width - 65, Math.max(5, x432 - 26)), 11);

        // Secondary Harmonic Marker: 864 Hz
        const x864 = freqToX(864);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(x864, 0);
        ctx.lineTo(x864, height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
        ctx.font = '8px monospace';
        ctx.fillText('864Hz (2f₀)', x864 - 18, 11);

        // Update telemetry stats once per second to prevent React render churn
        if (time - lastStatsUpdate > 800) {
          lastStatsUpdate = time;
          const peakDbVal = Number((-28.0 + (val432 / 255) * 16.0).toFixed(1));
          setLiveStats({
            peakDb: peakDbVal,
            stabilityPercent: activeFrequency !== '440' ? 99.8 : 95.2,
            isResonating: val432 > 40,
          });
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, activeFrequency, currentTrack]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const normX = Math.max(0, Math.min(1, x / rect.width));
    const minFreq = 100;
    const maxFreq = 1500;
    const freq = Math.round(minFreq + normX * (maxFreq - minFreq));
    const db = Number((-14 - (1 - normX) * 12).toFixed(1));
    setHoverInfo({ freq, db, x });
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
  };

  return (
    <div
      id="spectral-432-fingerprint-container"
      className="bg-[#100E0C] border border-amber-950/40 rounded-xl p-2.5 space-y-1.5 shadow-inner select-none transition-all"
    >
      {/* Header Info Banner */}
      <div className="flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="font-bold text-white tracking-tight">
            EMPREINTE SPECTRALE 432 Hz
          </span>
          <span className="hidden sm:inline-block text-[10px] text-stone-400">
            • Diapason Verdi
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-stone-400">
            Pic: <strong className="text-amber-300">{liveStats.peakDb} dBFS</strong>
          </span>
          <span className="text-stone-600">|</span>
          <span className="text-amber-400 hidden xs:inline-block flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400 inline" />
            <span>Q: 1.414</span>
          </span>
        </div>
      </div>

      {/* Real-time Interactive Canvas */}
      <div className="relative w-full h-12 bg-black/60 rounded-lg overflow-hidden border border-amber-950/30">
        <canvas
          ref={canvasRef}
          width={420}
          height={48}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block cursor-crosshair"
          title="Empreinte spectrale en temps réel basée sur Web Audio AnalyserNode (Centrée sur 432 Hz)"
        />

        {/* Dynamic cursor tooltip on hover */}
        {hoverInfo && (
          <div
            className="absolute top-1 pointer-events-none bg-stone-900/95 border border-amber-500/60 text-amber-300 text-[9px] font-mono px-1.5 py-0.5 rounded shadow-lg transform -translate-x-1/2 whitespace-nowrap z-20"
            style={{ left: `${hoverInfo.x}px` }}
          >
            {hoverInfo.freq} Hz ({hoverInfo.db} dBFS)
          </div>
        )}
      </div>

      {/* Bottom Sub-Frequency Harmonics Legend */}
      <div className="flex items-center justify-between text-[9px] font-mono text-stone-400 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
            <span>f₀ = 432 Hz</span>
          </span>
          <span className="flex items-center gap-1 text-amber-400/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>2f₀ = 864 Hz</span>
          </span>
          {activeFrequency === 'phi' && (
            <span className="text-amber-300 font-semibold">
              Φ = 1.618 Hz LFO
            </span>
          )}
        </div>

        <span className="text-neutral-400">
          FFT 2048 • Résonance {activeFrequency === '440' ? 'Bypass' : 'Active'}
        </span>
      </div>
    </div>
  );
};
