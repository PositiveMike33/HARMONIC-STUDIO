import React from 'react';
import { Radio } from 'lucide-react';

interface TopNotificationBarProps {
  onOpenStudioModal?: () => void;
}

export const TopNotificationBar: React.FC<TopNotificationBarProps> = ({ onOpenStudioModal }) => {
  return (
    <div
      id="top-notification-bar"
      className="w-full bg-[#050909] text-amber-500/90 text-xs border-b border-neutral-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 font-mono tracking-tight select-none"
    >
      <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
        <span className="text-neutral-300 font-semibold uppercase tracking-wider text-[11px]">
          PROJET THIRTY3 AUDIO ACTIF —
        </span>
        <span className="text-neutral-400 text-[11px] truncate">
          Moteur acoustique 432Hz, ondes de phase Phi 1.618033, lecteur Range 206 et marketplace créateurs avec splitting Stripe Connect 85/15.
        </span>
      </div>

      <button
        id="btn-header-studio-badge"
        onClick={onOpenStudioModal}
        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-bold text-[11px] px-2.5 py-1 rounded shadow transition-all cursor-pointer shrink-0"
      >
        <Radio className="w-3.5 h-3.5 text-black animate-spin" style={{ animationDuration: '8s' }} />
        <span>Harmonic 432Hz & Stripe</span>
        <span className="bg-black/20 text-[9px] px-1 py-0.2 rounded font-mono uppercase tracking-wide">
          STUDIO & STREAMING
        </span>
      </button>
    </div>
  );
};
