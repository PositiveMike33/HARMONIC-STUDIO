/**
 * HARMONIC STUDIO — ARCHITECTURE SYSTEM DESIGN & ATOM OF THOUGHTS (AoT)
 * ATOME 3 : PERSISTANCE & MONÉTISATION STRIPE CONNECT (src/db/schema.ts)
 * 
 * Schéma PostgreSQL ACID conforme Drizzle ORM
 * Invariants :
 * - Ventilation Stripe Connect 85/15 en cents entiers (Zéro imprécision virgule flottante)
 * - Idempotence absolue via table stripe_processed_events
 */

// Interfaces Déterministes ACID PostgreSQL
export interface DbUser {
  id: string;
  email: string;
  role: 'admin' | 'creator' | 'listener';
  stripeCustomerId?: string;
  stripeConnectedAccountId?: string;
  createdAt: string;
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
  priceCadCents: number; // Toujours stocké en cents entiers (ex: 99 pour 0.99$ CAD)
  audioPath: string;
  spectralFingerprint: string;
  detectedTuningHz: number;
  isAlready432: boolean;
  unlockedByDefault: boolean;
  createdAt: string;
}

export interface DbPurchase {
  id: string;
  userId: string;
  userEmail: string;
  trackId: string;
  amountCents: number;
  creatorPayoutCents: number; // 85% en cents entiers
  platformFeeCents: number; // 15% en cents entiers
  stripePaymentIntentId: string;
  stripeCheckoutSessionId?: string;
  createdAt: string;
}

export interface DbSubscription {
  id: string;
  userId: string;
  userEmail: string;
  planId: 'pass_frequentiel_unlimited';
  status: 'active' | 'canceled' | 'past_due';
  stripeSubscriptionId: string;
  currentPeriodEnd: string;
  createdAt: string;
}

export interface DbStripeProcessedEvent {
  id: string; // stripe event id (ex: evt_123456)
  eventType: string;
  processedAt: string;
  idempotencyKey?: string;
  payloadSummary?: string;
}

export interface DbAcpJob {
  id: string;
  sessionId: string;
  sourceUrl?: string;
  targetTuningHz: 432 | 440;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  progressPercent: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// Définitions SQL / Drizzle ORM Schema Objects
export const usersTable = {
  name: 'users',
  columns: {
    id: 'varchar(64) PRIMARY KEY',
    email: 'varchar(255) UNIQUE NOT NULL',
    role: 'varchar(32) NOT NULL DEFAULT "listener"',
    stripeCustomerId: 'varchar(128)',
    stripeConnectedAccountId: 'varchar(128)',
    createdAt: 'timestamp with time zone NOT NULL DEFAULT NOW()',
  },
};

export const tracksTable = {
  name: 'tracks',
  columns: {
    id: 'varchar(64) PRIMARY KEY',
    title: 'varchar(255) NOT NULL',
    artist: 'varchar(255) NOT NULL',
    artistId: 'varchar(64) NOT NULL',
    durationSeconds: 'real NOT NULL',
    pitchShiftCents: 'real NOT NULL DEFAULT -31.7667',
    integratedLufs: 'real NOT NULL DEFAULT -14.0',
    truePeakDbtp: 'real NOT NULL DEFAULT -1.0',
    bitrateKbps: 'integer NOT NULL DEFAULT 320',
    priceCadCents: 'integer NOT NULL DEFAULT 99',
    audioPath: 'text NOT NULL',
    spectralFingerprint: 'varchar(128) NOT NULL',
    detectedTuningHz: 'real NOT NULL DEFAULT 440.0',
    isAlready432: 'boolean NOT NULL DEFAULT false',
    unlockedByDefault: 'boolean NOT NULL DEFAULT true',
    createdAt: 'timestamp with time zone NOT NULL DEFAULT NOW()',
  },
};

export const purchasesTable = {
  name: 'purchases',
  columns: {
    id: 'varchar(64) PRIMARY KEY',
    userId: 'varchar(64) NOT NULL',
    userEmail: 'varchar(255) NOT NULL',
    trackId: 'varchar(64) NOT NULL REFERENCES tracks(id)',
    amountCents: 'integer NOT NULL',
    creatorPayoutCents: 'integer NOT NULL',
    platformFeeCents: 'integer NOT NULL',
    stripePaymentIntentId: 'varchar(128) NOT NULL',
    stripeCheckoutSessionId: 'varchar(128)',
    createdAt: 'timestamp with time zone NOT NULL DEFAULT NOW()',
  },
};

export const subscriptionsTable = {
  name: 'subscriptions',
  columns: {
    id: 'varchar(64) PRIMARY KEY',
    userId: 'varchar(64) NOT NULL',
    userEmail: 'varchar(255) NOT NULL',
    planId: 'varchar(64) NOT NULL DEFAULT "pass_frequentiel_unlimited"',
    status: 'varchar(32) NOT NULL DEFAULT "active"',
    stripeSubscriptionId: 'varchar(128) NOT NULL',
    currentPeriodEnd: 'timestamp with time zone NOT NULL',
    createdAt: 'timestamp with time zone NOT NULL DEFAULT NOW()',
  },
};

export const stripeProcessedEventsTable = {
  name: 'stripe_processed_events',
  columns: {
    id: 'varchar(128) PRIMARY KEY', // Stripe Event ID for absolute idempotence
    eventType: 'varchar(64) NOT NULL',
    processedAt: 'timestamp with time zone NOT NULL DEFAULT NOW()',
    idempotencyKey: 'varchar(128)',
    payloadSummary: 'text',
  },
};

export const acpJobsTable = {
  name: 'acp_jobs',
  columns: {
    id: 'varchar(64) PRIMARY KEY',
    sessionId: 'varchar(64) NOT NULL',
    sourceUrl: 'text',
    targetTuningHz: 'integer NOT NULL DEFAULT 432',
    status: 'varchar(32) NOT NULL DEFAULT "pending"',
    progressPercent: 'integer NOT NULL DEFAULT 0',
    metadata: 'jsonb',
    createdAt: 'timestamp with time zone NOT NULL DEFAULT NOW()',
  },
};
