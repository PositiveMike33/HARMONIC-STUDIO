import React, { useState, useEffect } from 'react';
import { TopNotificationBar } from './components/TopNotificationBar';
import { MainHeaderBox } from './components/MainHeaderBox';
import { AdminSessionBanner } from './components/AdminSessionBanner';
import { TrackCatalogue } from './components/TrackCatalogue';
import { HarmonicPlayer } from './components/HarmonicPlayer';
import { CreatorStudioModal } from './components/CreatorStudioModal';
import { EmbeddedWidgetModal } from './components/EmbeddedWidgetModal';
import { StripeCheckoutModal } from './components/StripeCheckoutModal';
import { useAudioStore } from './client/store/useAudioStore';
import { Track } from './types';

export default function App() {
  const { activeTab, setActiveTab, initAudioEngine } = useAudioStore();

  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'subscription';
    track?: Track;
  }>({
    isOpen: false,
    type: 'subscription',
  });

  // Handle first user interaction to unlock Web Audio context
  useEffect(() => {
    const handleFirstTouch = () => {
      initAudioEngine();
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('keydown', handleFirstTouch);
    };
    window.addEventListener('click', handleFirstTouch, { once: true });
    window.addEventListener('keydown', handleFirstTouch, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstTouch);
      window.removeEventListener('keydown', handleFirstTouch);
    };
  }, [initAudioEngine]);

  const handleOpenCheckout = (type: 'single' | 'subscription', track?: Track) => {
    setCheckoutModal({
      isOpen: true,
      type,
      track,
    });
  };

  return (
    <div className="min-h-screen bg-[#070C0C] text-neutral-100 flex flex-col font-sans selection:bg-[#00FF9D]/30 selection:text-[#00FF9D]">
      {/* 1. Top Full-Width Notification Bar */}
      <TopNotificationBar onOpenStudioModal={() => setActiveTab('creator')} />

      {/* 2. Main Studio Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 md:py-6 space-y-4">
        {/* Main Header Box */}
        <MainHeaderBox />

        {/* Session Admin Banner */}
        <AdminSessionBanner />

        {/* 2-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Harmonic Active Catalogue */}
          <div className="lg:col-span-7 space-y-4">
            <TrackCatalogue onOpenCheckout={handleOpenCheckout} />
          </div>

          {/* Right Column: Harmonic Player & 4-Frequency Selector */}
          <div className="lg:col-span-5">
            <HarmonicPlayer />
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="w-full border-t border-neutral-900 bg-[#050808] py-4 text-center text-xs font-mono text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>THIRTY3 AUDIO • Diapason 432 Hz & Ratio d'Or Φ = 1.618033</span>
          <span>EBU R128 (-14.0 LUFS) • RFC 7233 Range 206 • Stripe Connect 85/15</span>
        </div>
      </footer>

      {/* Modals */}
      <CreatorStudioModal
        isOpen={activeTab === 'creator'}
        onClose={() => setActiveTab('player')}
      />

      <EmbeddedWidgetModal
        isOpen={activeTab === 'widget'}
        onClose={() => setActiveTab('player')}
      />

      <StripeCheckoutModal
        isOpen={checkoutModal.isOpen}
        type={checkoutModal.type}
        track={checkoutModal.track}
        onClose={() => setCheckoutModal({ isOpen: false, type: 'subscription' })}
      />
    </div>
  );
}
