/**
 * HARMONIC STUDIO - PostgreSQL Schema via Drizzle ORM Specification
 * Comprehensive modeling of Users, Creators, Tracks, Purchases, Subscriptions, and Idempotent Webhook Events.
 */

export interface DbUserRecord {
  id: string;
  email: string;
  role: 'LISTENER' | 'CREATOR' | 'ADMIN_CREATOR';
  createdAt: Date;
  updatedAt: Date;
}

export interface DbArtistRecord {
  id: string;
  userId: string;
  artistName: string;
  stripeAccountId: string;
  stripeAccountReady: boolean;
  payoutPercentage: number; // 85% default
  bio?: string;
  createdAt: Date;
}

export interface DbTrackRecord {
  id: string;
  artistId: string;
  title: string;
  durationSeconds: number;
  originalPitchHz: number;
  isCertified432: boolean;
  masterFileKey: string;
  priceCentsCad: number; // 99 default for 0.99 CAD
  lufsTarget: number; // -14.0 LUFS
  truePeakDbtpLimit: number; // -1.0 dBTP
  createdAt: Date;
}

export interface DbPurchaseRecord {
  id: string;
  userId: string;
  trackId: string;
  stripePaymentIntentId: string;
  amountCentsCad: number;
  creatorSplitCentsCad: number; // 84 cents
  platformFeeCentsCad: number; // 15 cents
  createdAt: Date;
}

export interface DbSubscriptionRecord {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';
  currentPeriodEnd: Date;
  createdAt: Date;
}

export interface DbStripeProcessedEvent {
  eventId: string;
  eventType: string;
  processedAt: Date;
}
