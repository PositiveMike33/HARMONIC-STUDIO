import React, { useState } from 'react';
import { X, Code2, Copy, Check, ExternalLink } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';

interface EmbeddedWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbeddedWidgetModal: React.FC<EmbeddedWidgetModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack } = useAudioStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const embedCode = `<iframe 
  src="${window.location.origin}/embed?track=${currentTrack.id}&frequency=phi" 
  width="100%" 
  height="220" 
  frameborder="0" 
  allow="autoplay; encrypted-media" 
  title="Harmonic Studio 432Hz Player"
></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="embedded-widget-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[#0B1313] border border-[#00FF9D]/40 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(0,255,157,0.15)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00FF9D]/10 border border-[#00FF9D]/30 flex items-center justify-center text-[#00FF9D]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-mono">
                Widget Embarqué (Embeddable Player)
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Intégrez le lecteur 432Hz / Φ sans coupure sur vos sites web et portfolios.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-neutral-300 block">
              Code HTML d'intégration sécurisé (IFrame HTTP 206)
            </label>
            <div className="relative">
              <pre className="bg-black/90 border border-neutral-800 rounded-xl p-3.5 text-[11px] font-mono text-[#00FF9D] overflow-x-auto select-all">
                {embedCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 bg-[#00FF9D] hover:bg-[#00e68d] text-black text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Mini Preview */}
          <div className="border border-neutral-800 rounded-xl p-3.5 bg-[#090F12] space-y-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide block">
              Aperçu en direct du Widget
            </span>
            <div className="bg-[#0B1516] border border-[#00FF9D]/40 rounded-lg p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded bg-gradient-to-br from-[#F59E0B] to-[#D97706] flex items-center justify-center font-serif text-black font-bold">
                  Φ
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">{currentTrack.title}</div>
                  <div className="text-[10px] text-neutral-400">432Hz • Onde Φ • 320k</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#00FF9D] bg-[#00FF9D]/10 px-2 py-0.5 rounded border border-[#00FF9D]/30">
                Range 206 Live
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
