import React from 'react';
import { Sparkles, Radio, Activity, Code2, Users, Disc } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';

export const MainHeaderBox: React.FC = () => {
  const { activeTab, setActiveTab } = useAudioStore();

  return (
    <header
      id="main-header-box"
      className="w-full bg-[#000000] border border-[#D4AF37]/30 rounded-2xl p-5 md:p-6 shadow-[0_0_35px_rgba(0,0,0,0.8)] relative overflow-hidden"
    >
      {/* Subtle luxury ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-purple-900/15 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 left-10 w-80 h-28 bg-[#D4AF37]/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Badges Row */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div
          id="badge-acoustic-engine"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#9333EA]/20 text-[#C084FC] border border-[#A855F7]/40 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FDE047]" />
          <span>THIRTY3 ACOUSTIC ENGINE</span>
        </div>

        <div
          id="badge-golden-ratio"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#D4AF37]/15 text-[#FBBF24] border border-[#D4AF37]/40 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
        >
          <Activity className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Ratio d'Or Φ = 1.618033</span>
        </div>

        <div
          id="badge-dedicated-port"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-800/40"
        >
          <Radio className="w-3.5 h-3.5 text-[#C084FC]" />
          <span>Port 3033 Dédié</span>
        </div>
      </div>

      {/* Main Content & Tab Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-[#D4AF37] text-2xl font-mono tracking-tighter select-none animate-pulse">
              ((•))
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-mono">
              Harmonic Studio & Plateforme de Streaming 432Hz
            </h1>
          </div>
          <p id="header-platform-description" className="text-neutral-300 text-xs md:text-sm leading-relaxed font-sans">
            Écoutez vos morceaux préférés réaccordés en <span className="text-[#D4AF37] font-semibold">432 Hz</span> en direct avec une qualité sonore optimale, et soutenez directement les artistes avec <span className="text-[#FBBF24] font-semibold">85 % des revenus</span> reversés sans intermédiaire.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="tab-btn-player"
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'bg-black text-neutral-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
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
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'bg-black text-neutral-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
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
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-black shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                : 'bg-black text-neutral-300 hover:text-white border border-white/10 hover:border-[#D4AF37]/30'
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

