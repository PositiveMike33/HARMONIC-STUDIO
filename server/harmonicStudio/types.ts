/**
 * Types & Contrats de Données : Harmonic Studio & Monetization Créateurs THIRTY3
 * Conforme au pivot Créateurs Originaux, Stripe Connect Express, et acoustique sacrée (432Hz / Phi / 528Hz).
 */

export type HarmonicTuningMode = 'phi_432hz' | 'phi_528hz_binaural' | 'pure_432hz_verdi' | 'solfeggio_528hz';

export type TrackAccessType = 'stream_pass_48h' | 'lifetime_title' | 'subscription_catalogue';

export interface RightsAttestation {
  attestation_id: string;
  creator_id: string;
  track_title: string;
  artist_name: string;
  isrc_code?: string;
  has_exclusive_master_rights: boolean;
  agreed_to_terms: boolean;
  legal_full_name: string;
  signature_timestamp: string;
  ip_address?: string;
}

export interface AcousticSpecs {
  base_frequency_hz: number;        // e.g. 432.0 or 528.0
  phi_delta_hz: number;              // 1.6180339887 (Nombre d'Or)
  left_carrier_hz: number;           // 431.190983 Hz
  right_carrier_hz: number;          // 432.809017 Hz
  pitch_shift_cents: number;         // -31.7666 cents (pour 440Hz -> 432Hz)
  target_lufs: number;               // -14.0 LUFS (EBU R128 standard)
  true_peak_dbtp: number;            // -1.0 dBTP
  bitrate_kbps: number;              // 320
}

export interface CreatorProfile {
  id: string;
  email: string;
  display_name: string;
  stripe_connect_account_id?: string;
  stripe_onboarding_status: 'pending' | 'active' | 'restricted';
  payout_percentage: number;         // e.g. 85 (85% créateur, 15% plateforme)
  created_at: string;
  escrow_hold_days: number;          // Standard J+7 (7 jours de séquestre probatoire anti-fraude)
}

export interface HarmonicTrack {
  id: string;
  creator_id: string;
  title: string;
  artist: string;
  original_format: 'wav' | 'flac' | 'mp3' | 'aiff';
  original_sample_rate: number;
  tuning_mode: HarmonicTuningMode;
  duration_seconds: number;
  acoustic_specs: AcousticSpecs;
  rights_attestation_id: string;
  isrc_code?: string;
  is_verified: boolean;
  status: 'pending_processing' | 'processed' | 'ready_for_sale' | 'archived';
  prices: {
    stream_pass_48h_cents: number;  // Ex: 99 cents ($0.99 CAD)
    lifetime_title_cents: number;   // Ex: 299 cents ($2.99 CAD)
  };
  storage_key: string;              // Clé privée S3/R2 hermétique
  created_at: string;
  updated_at: string;
}

export interface RemasterJobRequest {
  track_id: string;
  creator_id: string;
  target_tuning: HarmonicTuningMode;
  binaural_phi_enabled?: boolean;
  apply_ebu_r128?: boolean;
}

export interface RemasterJobResponse {
  job_id: string;
  track_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  tuning_applied: HarmonicTuningMode;
  acoustic_specs: AcousticSpecs;
  output_format: string;
  processed_at?: string;
  processing_latency_ms?: number;
  error?: string;
}

export interface StreamEntitlementRecord {
  id: string;
  user_email: string;
  track_id: string;
  access_type: TrackAccessType;
  stripe_session_id: string;
  granted_at: string;
  expires_at: string | null;         // null si lifetime ou subscription active
  is_active: boolean;
}

export interface SignedStreamUrlResponse {
  stream_url: string;
  token: string;
  expires_at_epoch: number;
  ttl_seconds: number;
  track_id: string;
  watermark_hash: string;
}

export interface ConnectCheckoutSessionRequest {
  track_id?: string;
  trackId?: string;
  access_type?: 'stream_pass_48h' | 'lifetime_title' | 'subscription_catalogue';
  customer_email?: string;
  userEmail?: string;
  customer_name?: string;
  success_url?: string;
  cancel_url?: string;
  custom_campaign?: string;
}

export interface ConnectCheckoutSessionResponse {
  session_id: string;
  checkout_url: string;
  url?: string;                     // Alias pour conformité frontend Stripe
  sessionId?: string;               // Alias camelCase
  track_id: string;
  creator_id: string;
  creator_account_id: string;
  amount_cents: number;
  application_fee_cents: number;
  creator_net_cents: number;
  currency: string;
  metadata: Record<string, string>;
}

export interface EscrowPayoutRecord {
  id: string;
  creator_id: string;
  stripe_transfer_id: string;
  gross_amount_cents: number;
  platform_fee_cents: number;
  creator_net_cents: number;
  currency: string;
  created_at: string;
  available_on: string;             // created_at + 7 jours
  status: 'in_escrow' | 'released' | 'disputed';
}

export interface EmbedWidgetConfig {
  track_id: string;
  title: string;
  artist: string;
  preview_duration_seconds: number;
  standard_frequency_hz: number;
  harmonic_frequency_hz: number;
  phi_carrier_ratio: number;
  preview_stream_url: string;
  checkout_url: string;
  embed_iframe_code: string;
}
