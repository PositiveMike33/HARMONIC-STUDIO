/**
 * Database schema specification for Harmonic Studio 432Hz
 * Supports PostgreSQL with Drizzle ORM paradigms.
 */

export interface DbUser {
  id: string;
  email: string;
  role: 'admin' | 'creator' | 'listener';
  stripeCustomerId?: string;
  stripeConnectedAccountId?: string;
  createdAt: Date;
}

export interface DbTrack {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  durationSeconds: number;
  pitchShiftCents: number;
  integratedLufs: number;
  truePeakDbtp: number;
  bitrateKbps: number;
  priceCad: number;
  audioPath: string;
  spectralFingerprint: string;
  detectedTuningHz: number;
  createdAt: Date;
}

export interface DbPurchase {
  id: string;
  userId: string;
  trackId: string;
  amountCad: number;
  creatorPayoutCad: number;
  platformFeeCad: number;
  stripePaymentIntentId: string;
  createdAt: Date;
}

export interface DbSubscription {
  id: string;
  userId: string;
  planId: 'pass_frequentiel_unlimited';
  status: 'active' | 'canceled' | 'past_due';
  stripeSubscriptionId: string;
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface DbAcpJob {
  id: string;
  sessionId: string;
  sourceUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  progressPercent: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
