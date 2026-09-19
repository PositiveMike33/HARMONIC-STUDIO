import React, { useState } from 'react';
import { X, Code2, Copy, Check } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';
import { SocialShareBar } from './SocialShareBar';
import { EmbeddedPlayerWidget } from './EmbeddedPlayerWidget';

interface EmbeddedWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbeddedWidgetModal: React.FC<EmbeddedWidgetModalProps> = ({ isOpen, onClose }) => {
  const { currentTrack, activeFrequency } = useAudioStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://harmonic-studio-plateforme-de-streaming-432hz.ai.studio';
  const embedCode = `<iframe 
  src="${origin}/embed/${currentTrack.id}?freq=${activeFrequency}" 
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
      <div className="bg-[#141210] border border-amber-950/40 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-mono">
                Widget Embarqué 432 Hz
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Partagez directement vos morceaux avec fréquence active sur les réseaux sociaux.
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
          {/* Partage Social Direct (Twitter / X et Facebook) */}
          <div className="bg-black/50 border border-stone-800 rounded-xl p-3.5 space-y-2">
            <label className="text-xs font-mono text-neutral-300 font-bold block">
              Partage Réseaux Sociaux (Piste active & Fréquence)
            </label>
            <p className="text-[11px] text-gray-400">
              Partagez instantanément le lien vers <strong className="text-white">{currentTrack.title}</strong> avec la matrice active :
            </p>
            <SocialShareBar
              trackTitle={currentTrack.title}
              trackArtist={currentTrack.artist}
              trackId={currentTrack.id}
              freqMode={activeFrequency}
            />
          </div>

          {/* Code Iframe */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-neutral-300 block">
              Code HTML d'intégration sécurisé (IFrame HTTP 206)
            </label>
            <div className="relative">
              <pre className="bg-black/90 border border-stone-800 rounded-xl p-3.5 text-[11px] font-mono text-amber-300 overflow-x-auto select-all">
                {embedCode}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>
          </div>

          {/* Mini Preview Interactive avec boutons de partage intégrés */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wide block">
              Aperçu interactif du Widget
            </span>
            <EmbeddedPlayerWidget
              trackId={currentTrack.id}
              initialFreq={activeFrequency}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
