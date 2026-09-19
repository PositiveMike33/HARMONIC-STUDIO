import React, { useState } from 'react';
import { Twitter, Facebook, Link2, Check } from 'lucide-react';

export interface SocialShareBarProps {
  trackTitle: string;
  trackArtist: string;
  trackId: string;
  freqMode: string;
  className?: string;
  compact?: boolean;
}

export const FREQ_LABELS: Record<string, string> = {
  '440_BYPASS': '440 Hz Master Studio',
  '432_NATURAL': '432 Hz Verdi Naturel',
  '432_PHI': "Φ 432 Hz Nombre d'Or",
  '432_528_BINAURAL': 'Φ 432 Hz + 528 Hz Binaural',
  '440': '440 Hz Master Studio',
  '432': '432 Hz Verdi Naturel',
  'phi': "Φ 432 Hz Nombre d'Or",
  'binaural': 'Φ 432 Hz + 528 Hz Binaural',
};

export function getShareUrls(trackTitle: string, trackArtist: string, trackId: string, freqMode: string) {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://harmonic-studio-plateforme-de-streaming-432hz.ai.studio';

  const freqLabel = FREQ_LABELS[freqMode] || freqMode;
  const shareUrl = `${origin}/embed/${encodeURIComponent(trackId)}?freq=${encodeURIComponent(freqMode)}`;
  const directTrackUrl = `${origin}/?track=${encodeURIComponent(trackId)}&freq=${encodeURIComponent(freqMode)}`;

  const tweetText = `Écoutez "${trackTitle}" de ${trackArtist} en calibration acoustique ${freqLabel} sur Harmonic Studio 432Hz 🎵`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;

  return {
    shareUrl,
    directTrackUrl,
    freqLabel,
    tweetText,
    twitterUrl,
    facebookUrl,
  };
}

export const SocialShareBar: React.FC<SocialShareBarProps> = ({
  trackTitle,
  trackArtist,
  trackId,
  freqMode,
  className = '',
  compact = false,
}) => {
  const [copied, setCopied] = useState(false);

  const { shareUrl, twitterUrl, facebookUrl, freqLabel } = getShareUrls(
    trackTitle,
    trackArtist,
    trackId,
    freqMode
  );

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {/* Bouton Twitter / X */}
        <a
          id="widget-share-twitter-compact"
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Partager ${trackTitle} (${freqLabel}) sur X (Twitter)`}
          aria-label="Partager sur Twitter / X"
          className="p-1.5 rounded-lg bg-black/60 hover:bg-[#1DA1F2]/20 border border-white/10 hover:border-[#1DA1F2]/50 text-gray-300 hover:text-[#1DA1F2] transition-all flex items-center justify-center cursor-pointer"
        >
          <Twitter className="w-3.5 h-3.5 fill-current" />
        </a>

        {/* Bouton Facebook */}
        <a
          id="widget-share-facebook-compact"
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Partager ${trackTitle} (${freqLabel}) sur Facebook`}
          aria-label="Partager sur Facebook"
          className="p-1.5 rounded-lg bg-black/60 hover:bg-[#1877F2]/20 border border-white/10 hover:border-[#1877F2]/50 text-gray-300 hover:text-[#1877F2] transition-all flex items-center justify-center cursor-pointer"
        >
          <Facebook className="w-3.5 h-3.5 fill-current" />
        </a>

        {/* Copier le lien avec fréquence */}
        <button
          id="widget-copy-link-compact"
          onClick={handleCopyLink}
          title="Copier le lien avec fréquence active"
          aria-label="Copier le lien avec fréquence active"
          className="p-1.5 rounded-lg bg-black/60 hover:bg-[#00FF9D]/20 border border-white/10 hover:border-[#00FF9D]/50 text-gray-300 hover:text-[#00FF9D] transition-all flex items-center justify-center cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#00FF9D]" /> : <Link2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Bouton Twitter / X avec label */}
      <a
        id="widget-share-twitter"
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/40 text-[#1DA1F2] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
      >
        <Twitter className="w-3.5 h-3.5 fill-current" />
        <span>Partager sur X</span>
      </a>

      {/* Bouton Facebook avec label */}
      <a
        id="widget-share-facebook"
        href={facebookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
      >
        <Facebook className="w-3.5 h-3.5 fill-current" />
        <span>Partager sur Facebook</span>
      </a>

      {/* Copier le lien avec fréquence active */}
      <button
        id="widget-copy-link"
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 bg-black/50 hover:bg-white/10 border border-white/10 hover:border-[#00FF9D]/40 text-gray-300 hover:text-[#00FF9D] px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#00FF9D]" />
            <span className="text-[#00FF9D] font-bold">Lien copié !</span>
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            <span>Copier le lien ({freqLabel})</span>
          </>
        )}
      </button>
    </div>
  );
};
