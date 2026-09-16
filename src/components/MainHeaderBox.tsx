import React from 'react';
import { Sparkles, Radio, Activity, Code2, Users, Disc } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';

export const MainHeaderBox: React.FC = () => {
  const { activeTab, setActiveTab } = useAudioStore();

  return (
    <header
      id="main-header-box"
      className="w-full bg-[#0B1313] border border-[#00FF9D]/30 rounded-2xl p-5 md:p-6 shadow-[0_0_30px_rgba(0,0,0,0.6)] relative overflow-hidden"
    >
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#00FF9D]/5 blur-3xl pointer-events-none rounded-full" />

      {/* Top Badges Row */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div
          id="badge-acoustic-engine"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#00FF9D]/10 text-[#00FF9D] border border-[#00FF9D]/40 shadow-[0_0_10px_rgba(0,255,157,0.1)]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>THIRTY3 ACOUSTIC ENGINE</span>
        </div>

        <div
          id="badge-golden-ratio"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#06b6d4]/10 text-[#22d3ee] border border-[#06b6d4]/40"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Ratio d'Or Φ = 1.618033</span>
        </div>

        <div
          id="badge-dedicated-port"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#f59e0b]/10 text-[#fbbf24] border border-[#f59e0b]/40"
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Port 3033 Dédié</span>
        </div>
      </div>

      {/* Main Content & Tab Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-[#00FF9D] text-2xl font-mono tracking-tighter select-none animate-pulse">
              ((•))
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
              Harmonic Studio & Plateforme de Streaming 432Hz
            </h1>
          </div>
          <p className="text-neutral-400 text-xs md:text-sm leading-relaxed font-sans">
            Distribution acoustique certifiée EBU R128 (-14 LUFS / True Peak -1.0 dBTP), protection anti-téléchargement HTTP 206 et monétisation Stripe Connect (85 % créateur / 15 % plateforme).
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="tab-btn-player"
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'bg-[#00FF9D] text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]'
                : 'bg-[#111A1A] text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Disc className="w-4 h-4" />
            <span>Lecteur & Catalogue</span>
          </button>

          <button
            id="tab-btn-creator"
            onClick={() => setActiveTab('creator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'creator'
                ? 'bg-[#00FF9D] text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]'
                : 'bg-[#111A1A] text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Espace Créateur (85/15)</span>
          </button>

          <button
            id="tab-btn-widget"
            onClick={() => setActiveTab('widget')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'widget'
                ? 'bg-[#00FF9D] text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]'
                : 'bg-[#111A1A] text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Widget Embarqué</span>
          </button>
        </div>
      </div>
    </header>
  );
};
