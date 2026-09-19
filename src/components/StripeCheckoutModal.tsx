import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAudioStore } from '../client/store/useAudioStore';
import { Track } from '../types';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  type: 'single' | 'subscription';
  track?: Track;
  onClose: () => void;
}

export const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({
  isOpen,
  type,
  track,
  onClose,
}) => {
  const { subscribePass, purchaseTrack } = useAudioStore();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (!isOpen) return null;

  const isSubscription = type === 'subscription';
  const amount = isSubscription ? 9.99 : track ? track.priceCad : 0.99;
  const creatorPayout = isSubscription ? 0 : Number((amount * 0.85).toFixed(2));
  const platformFee = isSubscription ? 0 : Number((amount * 0.15).toFixed(2));

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isSubscription
        ? '/api/stripe/checkout-subscription'
        : '/api/stripe/checkout-single';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: track?.id || 'splintered-self',
          userId: 'usr_guest_demo',
        }),
      });

      if (res.ok) {
        if (isSubscription) {
          subscribePass();
        } else if (track) {
          purchaseTrack(track.id);
        }
      }
    } catch {
      // Local simulated success
      if (isSubscription) subscribePass();
      else if (track) purchaseTrack(track.id);
    }

    setLoading(false);
    setCompleted(true);
    setTimeout(() => {
      setCompleted(false);
      onClose();
    }, 1500);
  };

  return (
    <div
      id="stripe-checkout-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[#141210] border border-amber-950/40 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                {isSubscription ? 'Stripe Billing • Pass Illimité' : 'Stripe Connect • Coffret 4 Remasters'}
              </h2>
              <p className="text-xs text-neutral-400 font-sans">
                Passerelle de paiement sécurisée SSL 256 bits
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

        {/* Modal Body */}
        {completed ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <h3 className="text-lg font-bold text-white font-mono">Paiement validé !</h3>
            <p className="text-xs text-neutral-400">
              {isSubscription
                ? 'Votre Pass Fréquentiel Illimité est désormais actif sur tout le catalogue.'
                : `Le coffret des 4 versions master de "${track?.title}" (440Hz, 432Hz, Φ, 528Hz) est débloqué avec succès.`}
            </p>
          </div>
        ) : (
          <form onSubmit={handleCheckout} className="p-5 space-y-4">
            {/* Summary Box */}
            <div className="bg-[#100E0C] border border-stone-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-300 font-medium">
                  {isSubscription
                    ? 'Pass Fréquentiel Illimité (Mensuel)'
                    : `Coffret 4 Remasters : ${track?.title}`}
                </span>
                <span className="font-bold text-amber-400 font-mono">
                  {amount.toFixed(2)} $ CAD
                </span>
              </div>

              {!isSubscription && (
                <div className="text-[11px] font-mono bg-black/40 p-2 rounded border border-neutral-800 text-neutral-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Part Artiste (85% Connect) :</span>
                    <span className="text-amber-400 font-semibold">{creatorPayout.toFixed(2)} $ CAD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais Plateforme Thirty3 (15%) :</span>
                    <span className="text-neutral-400">{platformFee.toFixed(2)} $ CAD</span>
                  </div>
                </div>
              )}
            </div>

            {/* Simulated Card Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-neutral-300 block">
                Carte de Crédit (Simulation Stripe Elements)
              </label>
              <div className="bg-black/60 border border-neutral-800 rounded-lg p-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-neutral-400" />
                <span className="text-xs font-mono text-neutral-300 tracking-wider">
                  •••• •••• •••• 4242
                </span>
                <span className="text-[10px] font-mono text-neutral-500 ml-auto">
                  09/28 • CVC 123
                </span>
              </div>
            </div>

            {/* Trust and Guarantee */}
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Conforme EBU R128 • Aucun engagement • Annulation instantanée</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-stone-950 font-bold text-sm py-2.5 rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Validation Stripe en cours...</span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Payer {amount.toFixed(2)} $ CAD</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
