import React from 'react';
import { Crown, Check } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';

export const AdminSessionBanner: React.FC = () => {
  const { adminUnlocked, toggleAdminUnlock } = useAudioStore();

  return (
    <div
      id="admin-session-banner"
      className="w-full bg-[#241A08] border border-[#D97706]/50 rounded-xl px-4 py-3 shadow-[0_4px_20px_rgba(217,119,6,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
    >
      <div className="flex items-start md:items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-[#3D2808] border border-[#D97706]/60 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
          <Crown className="w-5 h-5" />
        </div>

        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm md:text-base font-bold text-amber-300 tracking-wide uppercase font-mono">
              SESSION ADMIN / CRÉATEUR: DÉBLOCAGE INTÉGRAL ACTIF
            </h2>
            <span
              id="badge-zero-payment"
              className="bg-[#00FF9D]/15 text-[#00FF9D] border border-[#00FF9D]/40 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
            >
              Zéro Paiement Requis
            </span>
          </div>
          <p className="text-neutral-400 text-xs leading-normal">
            Accès illimité permanent à tous les morceaux 432Hz / Φ, streaming studio Range 206 sans coupure et comparaison instantanée des 4 fréquences.
          </p>
        </div>
      </div>

      <button
        id="btn-toggle-admin-unlock"
        onClick={toggleAdminUnlock}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-medium font-mono border transition-all cursor-pointer shrink-0 ${
          adminUnlocked
            ? 'border-[#D97706] text-amber-300 bg-[#362207]/80 hover:bg-[#452b09] shadow-[0_0_12px_rgba(217,119,6,0.3)]'
            : 'border-neutral-700 text-neutral-400 bg-neutral-900 hover:text-white'
        }`}
      >
        <Check className="w-4 h-4 text-[#00FF9D]" />
        <span>{adminUnlocked ? '✓ Déblocage Admin Actif' : 'Déverrouiller Admin'}</span>
      </button>
    </div>
  );
};
