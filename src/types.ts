export type HarmonicFrequency = '440' | '432' | 'phi' | 'binaural';

export interface HarmonicProfile {
  id: HarmonicFrequency;
  name: string;
  subtitle: string;
  tag: string;
  description: string;
  tuningHz: number;
  pitchShiftCents: number;
  phiModulation: boolean;
  binauralCarrierHz?: number;
  binauralDeltaHz?: number;
  color: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  pitchShiftCents: number;
  lufs: number;
  truePeakDbtp: number;
  bitrateKbps: number;
  priceCad: number;
  unlocked: boolean;
  creatorStripeId: string;
  originalTuningHz: number;
  coverGradientFrom?: string;
  coverGradientTo?: string;
  audioUrl: string;
  spectralFingerprint?: string;
}

export interface UserSession {
  userId: string;
  email: string;
  isAdmin: boolean;
  hasSubscription: boolean;
  purchasedTrackIds: string[];
}

export interface ColibriAnalysisResult {
  trackId: string;
  detectedFundamentalHz: number;
  tuningDeviationCents: number;
  isStandard440: boolean;
  isAlready432: boolean;
  confidence: number;
  fftPeaks: Array<{ freq: number; magDb: number }>;
  processingTimeMs: number;
}

export interface AcpSessionEvent {
  id: string;
  sessionId: string;
  method: 'initialize' | 'session/new' | 'session/prompt' | 'session/cancel' | 'status_update';
  params?: any;
  result?: any;
  timestamp: number;
}

export interface StripeTransaction {
  id: string;
  trackId?: string;
  type: 'single_purchase' | 'subscription';
  amountCad: number;
  creatorAmountCad: number;
  platformFeeCad: number;
  creatorStripeAccount: string;
  status: 'succeeded' | 'pending';
  createdAt: string;
}
