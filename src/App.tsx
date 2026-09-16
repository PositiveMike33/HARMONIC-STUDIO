import React, { useState } from 'react';
import { TopNotificationBar } from './components/TopNotificationBar';
import { MainHeaderBox } from './components/MainHeaderBox';
import { AdminSessionBanner } from './components/AdminSessionBanner';
import { HarmonicPlayer } from './components/HarmonicPlayer';
import { TrackCatalogue } from './components/TrackCatalogue';
import { CreatorStudioModal } from './components/CreatorStudioModal';
import { EmbeddedWidgetModal } from './components/EmbeddedWidgetModal';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { useAudioStore } from './client/store/useAudioStore';
import { Track } from './types';

export default function App() {
  const { activeTab, setActiveTab } = useAudioStore();

  // Modals state
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'subscription';
    track?: Track;
  }>({
    isOpen: false,
    type: 'single',
  });

  const handleOpenCheckout = (type: 'single' | 'subscription', track?: Track) => {
    setCheckoutModal({
      isOpen: true,
      type,
      track,
    });
  };

  const handleCloseCheckout = () => {
    setCheckoutModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-[#070b0c] text-neutral-100 font-sans flex flex-col selection:bg-[#00FF9D]/30 selection:text-[#00FF9D]">
      {/* 1. Bandeau supérieur d'information */}
      <TopNotificationBar onOpenStudioModal={() => setIsCreatorModalOpen(true)} />

      {/* 2. Conteneur principal fluide et centré */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1">
        {/* En-tête principal avec badges et onglets */}
        <MainHeaderBox />

        {/* 3. Vue Lecteur & Catalogue (Page d'accueil par défaut) */}
        {activeTab === 'player' && (
          <main className="space-y-6 animate-in fade-in duration-200">
            {/* Bannière Admin Session / Déblocage */}
            <AdminSessionBanner />

            {/* Lecteur Principal avec Visualiseur Spectral et Sélection Fréquentielle */}
            <HarmonicPlayer />

            {/* Catalogue des Pistes et Cases Master */}
            <TrackCatalogue onOpenCheckout={handleOpenCheckout} />
          </main>
        )}

        {/* 4. Onglet Espace Créateur */}
        {activeTab === 'creator' && (
          <main className="space-y-6 animate-in fade-in duration-200">
            <AdminSessionBanner />
            <div className="bg-[#0B1313] border border-[#00FF9D]/30 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <span className="text-[#00FF9D]">⚡</span> Espace Créateur & Partage Stripe Connect 85/15
                  </h2>
                  <p className="text-neutral-400 text-xs md:text-sm mt-1">
                    Déposez vos morceaux, gérez vos encaissements instantanés et auditez vos analyses fréquentielles Colibri DSP.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsCreatorModalOpen(true)}
                    className="bg-[#00FF9D] hover:bg-[#00e68d] text-black font-semibold text-xs md:text-sm px-4 py-2.5 rounded-xl shadow-[0_0_15px_rgba(0,255,157,0.3)] transition-all cursor-pointer"
                  >
                    Ouvrir la Console Dédiée
                  </button>
                  <button
                    onClick={() => setActiveTab('player')}
                    className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs md:text-sm px-4 py-2.5 rounded-xl border border-neutral-700 transition-all cursor-pointer"
                  >
                    Retour au Lecteur
                  </button>
                </div>
              </div>

              {/* Raccourci vers le Catalogue pour insérer les MP3 */}
              <div className="mt-6">
                <TrackCatalogue onOpenCheckout={handleOpenCheckout} />
              </div>
            </div>
          </main>
        )}

        {/* 5. Onglet Widget Embarqué */}
        {activeTab === 'widget' && (
          <main className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-[#0B1313] border border-[#00FF9D]/30 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-mono text-white">
                    Générateur de Widget Embarqué 432Hz
                  </h2>
                  <p className="text-neutral-400 text-xs md:text-sm mt-1">
                    Intégrez le lecteur Harmonic Studio directement dans votre site web ou application externe.
                  </p>
                </div>
                <button
                  onClick={() => setIsWidgetModalOpen(true)}
                  className="bg-[#00FF9D] text-black font-semibold text-xs px-4 py-2 rounded-xl"
                >
                  Configurer le Widget
                </button>
              </div>

              {/* Lecteur actuel */}
              <HarmonicPlayer />
            </div>
          </main>
        )}
      </div>

      {/* Footer minimaliste et élégant */}
      <footer className="border-t border-neutral-800/80 bg-[#050809] py-4 px-6 text-center text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Harmonic Studio — Moteur Acoustique 432 Hz & Φ 1.618033</span>
          <span className="text-[#00FF9D]/80">EBU R128 (-14 LUFS / -1 dBTP) • Split Artistes 85/15</span>
        </div>
      </footer>

      {/* Modales Interactives */}
      <CreatorStudioModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
      />

      <EmbeddedWidgetModal
        isOpen={isWidgetModalOpen}
        onClose={() => setIsWidgetModalOpen(false)}
      />

      <StripeCheckoutModal
        isOpen={checkoutModal.isOpen}
        type={checkoutModal.type}
        track={checkoutModal.track}
        onClose={handleCloseCheckout}
      />
    </div>
  );
}
