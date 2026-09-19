import React from 'react';
import { Sparkles, Radio, Activity, Code2, Users, Disc } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';

export const MainHeaderBox: React.FC = () => {
  const { activeTab, setActiveTab } = useAudioStore();

  return (
    <header
      id="main-header-box"
      className="w-full bg-[#141210] border border-stone-800/90 rounded-2xl p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.6)] relative overflow-hidden"
    >
      {/* Subtle background ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-amber-500/5 blur-3xl pointer-events-none rounded-full" />

      {/* Top Badges Row */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div
          id="badge-acoustic-engine"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>THIRTY3 ACOUSTIC ENGINE</span>
        </div>

        <div
          id="badge-golden-ratio"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-orange-500/10 text-orange-300 border border-orange-500/40"
        >
          <Activity className="w-3.5 h-3.5 text-orange-400" />
          <span>Ratio d'Or Φ = 1.618033</span>
        </div>

        <div
          id="badge-dedicated-port"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/40"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Port 3033 Dédié</span>
        </div>
      </div>

      {/* Main Content & Tab Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 text-2xl font-mono tracking-tighter select-none animate-pulse">
              ((•))
            </span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-stone-100 font-mono">
              Harmonic Studio & Plateforme de Streaming 432Hz
            </h1>
          </div>
          <p id="header-platform-description" className="text-stone-300 text-xs md:text-sm leading-relaxed font-sans">
            Écoutez vos morceaux préférés réaccordés en <span className="text-amber-400 font-medium">432 Hz</span> en direct avec une qualité sonore optimale, et soutenez directement les artistes avec <span className="text-white font-medium">85 % des revenus</span> reversés sans intermédiaire.
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="tab-btn-player"
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'bg-stone-900/80 text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700'
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
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'bg-stone-900/80 text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700'
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
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.35)]'
                : 'bg-stone-900/80 text-stone-300 hover:text-white border border-stone-800 hover:border-stone-700'
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
