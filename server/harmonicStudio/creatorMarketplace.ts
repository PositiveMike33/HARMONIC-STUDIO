import crypto from 'crypto';
import {
  CreatorProfile,
  HarmonicTrack,
  RightsAttestation,
  StreamEntitlementRecord,
  TrackAccessType,
  EscrowPayoutRecord,
  HarmonicTuningMode,
  EmbedWidgetConfig,
} from './types';
import { harmonicEngine } from './harmonicEngine';

/**
 * Gestionnaire de Marché & Monétisation Créateurs Originaux THIRTY3
 */
export class CreatorMarketplace {
  private creators = new Map<string, CreatorProfile>();
  private tracks = new Map<string, HarmonicTrack>();
  private attestations = new Map<string, RightsAttestation>();
  private entitlements = new Map<string, StreamEntitlementRecord>();
  private escrowLedger = new Map<string, EscrowPayoutRecord>();
  private activeSubscriptions = new Map<string, { user_email: string; plan_id: string; expires_at: string; is_active: boolean }>();
  private entitlementsBySessionId = new Map<string, StreamEntitlementRecord>();

  constructor() {
    this.seedInitialCatalog();
  }

  /**
   * Initialise les titres de référence et profils de créateurs initiaux
   */
  private seedInitialCatalog(): void {
    // 1. Profil Créateur Original : VEL94EV
    const velCreator: CreatorProfile = {
      id: 'creator_vel94ev',
      email: 'contact@vel94ev.music',
      display_name: 'VEL94EV',
      stripe_connect_account_id: 'acct_1OvXm3VEL94EV001',
      stripe_onboarding_status: 'active',
      payout_percentage: 85,
      created_at: new Date().toISOString(),
      escrow_hold_days: 7,
    };
    this.creators.set(velCreator.id, velCreator);

    // Attestation pour Splintered Self
    const attestationVel: RightsAttestation = {
      attestation_id: 'att_vel_splintered_001',
      creator_id: velCreator.id,
      track_title: 'Splintered Self',
      artist_name: 'VEL94EV',
      isrc_code: 'CA-V94-24-00101',
      has_exclusive_master_rights: true,
      agreed_to_terms: true,
      legal_full_name: 'Valentin E. Laroche',
      signature_timestamp: new Date().toISOString(),
    };
    this.attestations.set(attestationVel.attestation_id, attestationVel);

    // Titre 1 : VEL94EV - Splintered Self (Oeuvre originale autorisée)
    const trackVel: HarmonicTrack = {
      id: 'splintered_self_phi_432',
      creator_id: velCreator.id,
      title: 'Splintered Self',
      artist: 'VEL94EV',
      original_format: 'wav',
      original_sample_rate: 48000,
      tuning_mode: 'phi_432hz',
      duration_seconds: 234,
      acoustic_specs: harmonicEngine.computeAcousticSpecs('phi_432hz'),
      rights_attestation_id: attestationVel.attestation_id,
      isrc_code: 'CA-V94-24-00101',
      is_verified: true,
      status: 'ready_for_sale',
      prices: {
        stream_pass_48h_cents: 99,   // $0.99 CAD
        lifetime_title_cents: 299,    // $2.99 CAD
      },
      storage_key: 'masters/vel94ev/splintered_self_phi_432.mp3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.tracks.set(trackVel.id, trackVel);

    // Profil Sandbox Démo (pour les titres protégés sous licence de recherche / test)
    const demoCreator: CreatorProfile = {
      id: 'creator_demo_sandbox',
      email: 'demo-sandbox@thirty3.app',
      display_name: 'Thirty3 Lab Research (Demo Mode)',
      stripe_connect_account_id: 'acct_1OvDemoSandbox000',
      stripe_onboarding_status: 'restricted',
      payout_percentage: 85,
      created_at: new Date().toISOString(),
      escrow_hold_days: 7,
    };
    this.creators.set(demoCreator.id, demoCreator);

    // Titre 2 : Bones For The Crows (Demo Sandbox Mode)
    this.tracks.set('bone_crows_phi_432', {
      id: 'bone_crows_phi_432',
      creator_id: demoCreator.id,
      title: 'Bones For The Crows',
      artist: 'Nickelback',
      original_format: 'flac',
      original_sample_rate: 44100,
      tuning_mode: 'phi_432hz',
      duration_seconds: 242,
      acoustic_specs: harmonicEngine.computeAcousticSpecs('phi_432hz'),
      rights_attestation_id: 'att_demo_sandbox_001',
      is_verified: false, // Flagged: restricted to test mode / demo
      status: 'ready_for_sale',
      prices: {
        stream_pass_48h_cents: 99,
        lifetime_title_cents: 299,
      },
      storage_key: 'demo/bones_for_the_crows_phi_432.mp3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Titre 3 : Counting Stars (Demo Sandbox Mode)
    this.tracks.set('counting_stars_phi_432', {
      id: 'counting_stars_phi_432',
      creator_id: demoCreator.id,
      title: 'Counting Stars',
      artist: 'OneRepublic',
      original_format: 'wav',
      original_sample_rate: 44100,
      tuning_mode: 'phi_432hz',
      duration_seconds: 257,
      acoustic_specs: harmonicEngine.computeAcousticSpecs('phi_432hz'),
      rights_attestation_id: 'att_demo_sandbox_002',
      is_verified: false, // Flagged: restricted to test mode / demo
      status: 'ready_for_sale',
      prices: {
        stream_pass_48h_cents: 99,
        lifetime_title_cents: 299,
      },
      storage_key: 'demo/counting_stars_phi_432.mp3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Titre 4 : The Soldier 4 - Mike Solo/WAK/STB/RTN/LFY (Studio Version) Linkin Park
    this.tracks.set('the_soldier_mike_solo', {
      id: 'the_soldier_mike_solo',
      creator_id: demoCreator.id,
      title: 'The Soldier 4 - Mike Solo/WAK/STB/RTN/LFY (Studio Version) Linkin Park',
      artist: 'The Soldier',
      original_format: 'mp3',
      original_sample_rate: 44100,
      tuning_mode: 'phi_432hz',
      duration_seconds: 317,
      acoustic_specs: harmonicEngine.computeAcousticSpecs('phi_432hz'),
      rights_attestation_id: 'att_demo_sandbox_003',
      is_verified: true,
      status: 'ready_for_sale',
      prices: {
        stream_pass_48h_cents: 99,
        lifetime_title_cents: 299,
      },
      storage_key: 'demo/the_soldier_4_mike_solo_phi_432.mp3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Titre 5 : Michael GG - Never Let Go (Thirty3 & E Made It)
    this.tracks.set('never_let_go', {
      id: 'never_let_go',
      creator_id: velCreator.id,
      title: 'Never Let Go',
      artist: 'Michael GG (Thirty3 & E Made It)',
      original_format: 'mp3',
      original_sample_rate: 44100,
      tuning_mode: 'phi_432hz',
      duration_seconds: 172,
      acoustic_specs: harmonicEngine.computeAcousticSpecs('phi_432hz'),
      rights_attestation_id: 'att_michael_gg_001',
      is_verified: true,
      status: 'ready_for_sale',
      prices: {
        stream_pass_48h_cents: 99,
        lifetime_title_cents: 299,
      },
      storage_key: 'masters/michaelgg/never_let_go_phi_432.mp3',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // --- Gestion des Créateurs & Stripe Connect Express ---

  public registerCreator(profile: Omit<CreatorProfile, 'id' | 'created_at' | 'escrow_hold_days' | 'stripe_onboarding_status'>): CreatorProfile {
    const creatorId = `creator_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const newProfile: CreatorProfile = {
      ...profile,
      id: creatorId,
      stripe_connect_account_id: profile.stripe_connect_account_id || `acct_express_${crypto.randomBytes(6).toString('hex')}`,
      stripe_onboarding_status: profile.stripe_connect_account_id ? 'active' : 'pending',
      payout_percentage: profile.payout_percentage || 85,
      created_at: new Date().toISOString(),
      escrow_hold_days: 7,
    };
    this.creators.set(creatorId, newProfile);
    return newProfile;
  }

  public getCreator(creatorId: string): CreatorProfile | undefined {
    return this.creators.get(creatorId);
  }

  public generateStripeConnectOnboardingLink(creatorId: string, returnUrl: string): { url: string; accountId: string } {
    const creator = this.creators.get(creatorId);
    if (!creator) {
      throw new Error(`Créateur introuvable : ${creatorId}`);
    }
    const accountId = creator.stripe_connect_account_id || `acct_express_${crypto.randomBytes(6).toString('hex')}`;
    creator.stripe_connect_account_id = accountId;

    const mockStripeConnectUrl = `https://connect.stripe.com/express/onboarding/${accountId}?return_url=${encodeURIComponent(returnUrl)}`;
    return { url: mockStripeConnectUrl, accountId };
  }

  // --- Gestion du Catalogue & Upload Sécurisé avec Attestation de Droits ---

  public registerTrack(params: {
    creator_id: string;
    title: string;
    artist: string;
    original_format: 'wav' | 'flac' | 'mp3' | 'aiff';
    tuning_mode?: HarmonicTuningMode;
    isrc_code?: string;
    prices?: { stream_pass_48h_cents?: number; lifetime_title_cents?: number };
    attestation: {
      has_exclusive_master_rights: boolean;
      agreed_to_terms: boolean;
      legal_full_name: string;
    };
  }): { track: HarmonicTrack; attestation: RightsAttestation } {
    const creator = this.creators.get(params.creator_id);
    if (!creator) {
      throw new Error(`Créateur introuvable : ${params.creator_id}`);
    }

    // Validation ISRC
    const isrcCheck = harmonicEngine.validateIsrc(params.isrc_code);
    if (!isrcCheck.valid) {
      throw new Error(isrcCheck.reason || 'Code ISRC invalide.');
    }

    // Validation formelle de l'attestation de droits
    const attestationValidation = harmonicEngine.validateAttestation({
      creator_id: params.creator_id,
      track_title: params.title,
      has_exclusive_master_rights: params.attestation.has_exclusive_master_rights,
      agreed_to_terms: params.attestation.agreed_to_terms,
      legal_full_name: params.attestation.legal_full_name,
    });
    if (!attestationValidation.valid) {
      throw new Error(attestationValidation.error);
    }

    const attestationId = `att_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const rightsAttestation: RightsAttestation = {
      attestation_id: attestationId,
      creator_id: params.creator_id,
      track_title: params.title,
      artist_name: params.artist,
      isrc_code: isrcCheck.normalized || params.isrc_code,
      has_exclusive_master_rights: params.attestation.has_exclusive_master_rights,
      agreed_to_terms: params.attestation.agreed_to_terms,
      legal_full_name: params.attestation.legal_full_name,
      signature_timestamp: new Date().toISOString(),
    };
    this.attestations.set(attestationId, rightsAttestation);

    const tuningMode = params.tuning_mode || 'phi_432hz';
    const trackId = `track_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newTrack: HarmonicTrack = {
      id: trackId,
      creator_id: params.creator_id,
      title: params.title,
      artist: params.artist,
      original_format: params.original_format,
      original_sample_rate: 44100,
      tuning_mode: tuningMode,
      duration_seconds: 210,
      acoustic_specs: harmonicEngine.computeAcousticSpecs(tuningMode),
      rights_attestation_id: attestationId,
      isrc_code: isrcCheck.normalized || params.isrc_code,
      is_verified: true,
      status: 'ready_for_sale',
      prices: {
        stream_pass_48h_cents: params.prices?.stream_pass_48h_cents || 99,
        lifetime_title_cents: params.prices?.lifetime_title_cents || 299,
      },
      storage_key: `masters/${params.creator_id}/${trackId}_${tuningMode}.mp3`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.tracks.set(trackId, newTrack);
    return { track: newTrack, attestation: rightsAttestation };
  }

  public getTrack(trackId: string): HarmonicTrack | undefined {
    if (!trackId) return undefined;
    const direct = this.tracks.get(trackId);
    if (direct) return direct;
    
    // Normalisation des identifiants et alias kebab-case / snake-case
    const norm = trackId.toLowerCase().replace(/[-_]/g, '');
    if (norm.includes('splintered') || norm.includes('vel94ev')) return this.tracks.get('splintered_self_phi_432');
    if (norm.includes('bone') || norm.includes('nickelback')) return this.tracks.get('bone_crows_phi_432');
    if (norm.includes('counting') || norm.includes('onerepublic')) return this.tracks.get('counting_stars_phi_432');
    if (norm.includes('soldier') || norm.includes('linkin') || norm.includes('mikesolo')) return this.tracks.get('the_soldier_mike_solo');
    if (norm.includes('neverletgo') || norm.includes('michaelgg')) return this.tracks.get('never_let_go');

    return undefined;
  }

  public getAllTracks(): HarmonicTrack[] {
    const unique = new Map<string, HarmonicTrack>();
    for (const track of this.tracks.values()) {
      unique.set(track.id, track);
    }
    return Array.from(unique.values());
  }

  // --- Monétisation & Partage de Revenus (Stripe Connect Split Billing) ---

  public calculateRevenueSplit(amountCents: number, payoutPercentage: number = 85): {
    gross_cents: number;
    platform_fee_cents: number;
    creator_net_cents: number;
  } {
    const creatorNet = Math.round((amountCents * payoutPercentage) / 100);
    const platformFee = amountCents - creatorNet;
    return {
      gross_cents: amountCents,
      platform_fee_cents: platformFee,
      creator_net_cents: creatorNet,
    };
  }

  // --- Délivrance & Vérification des Droits d'Écoute (Option A & B) ---

  public grantEntitlement(params: {
    userEmail: string;
    trackId: string;
    accessType: TrackAccessType;
    stripeSessionId: string;
  }): StreamEntitlementRecord {
    const key = `${params.userEmail.toLowerCase()}:${params.trackId}`;
    let expiresAt: string | null = null;

    if (params.accessType === 'stream_pass_48h') {
      expiresAt = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    }

    const entitlement: StreamEntitlementRecord = {
      id: `ent_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      user_email: params.userEmail.toLowerCase(),
      track_id: params.trackId,
      access_type: params.accessType,
      stripe_session_id: params.stripeSessionId,
      granted_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_active: true,
    };

    this.entitlements.set(key, entitlement);
    if (params.stripeSessionId) {
      this.entitlementsBySessionId.set(params.stripeSessionId, entitlement);
    }
    return entitlement;
  }

  public grantSubscription(userEmail: string, planId: string, durationDays: number = 30): void {
    const expiresAt = new Date(Date.now() + durationDays * 24 * 3600 * 1000).toISOString();
    this.activeSubscriptions.set(userEmail.toLowerCase(), {
      user_email: userEmail.toLowerCase(),
      plan_id: planId,
      expires_at: expiresAt,
      is_active: true,
    });
  }

  public revokeSubscription(userEmail: string): void {
    const sub = this.activeSubscriptions.get(userEmail.toLowerCase());
    if (sub) {
      sub.is_active = false;
    }
  }

  public checkStreamingAccess(identifier: string, trackId: string): {
    allowed: boolean;
    reason?: string;
    accessType?: TrackAccessType;
    expiresAt?: string | null;
    userEmail?: string;
  } {
    if (!identifier) {
      return { allowed: false, reason: 'Identifiant ou session d\'accès manquant.' };
    }

    const normalized = identifier.toLowerCase().trim();
    const resolvedTrack = this.getTrack(trackId);
    const canonicalTrackId = resolvedTrack ? resolvedTrack.id : trackId;

    // 0. ADMIN / SUPER ADMIN BYPASS PERMANENT (Zéro Paywall pour les tests)
    const adminIdentifiers = [
      'th3thirty3@gmail.com',
      'mikegauthierguillet@gmail.com',
      'admin@thirty3.app',
      'admin',
      'admin_vip_token',
      'super_admin',
      'auditeur.thirty3@gmail.com',
    ];
    if (
      adminIdentifiers.includes(normalized) ||
      normalized === 'admin' ||
      normalized.startsWith('admin_') ||
      normalized.startsWith('adm_')
    ) {
      return {
        allowed: true,
        accessType: 'lifetime_title',
        expiresAt: null,
        userEmail: normalized,
      };
    }

    // 1. Vérifier si l'identifiant est directement un stripe_session_id
    const sessionEntitlement = this.entitlementsBySessionId.get(identifier);
    if (sessionEntitlement && sessionEntitlement.is_active) {
      const entTrackId = sessionEntitlement.track_id;
      if (entTrackId === trackId || entTrackId === canonicalTrackId) {
        if (sessionEntitlement.access_type === 'lifetime_title') {
          return {
            allowed: true,
            accessType: 'lifetime_title',
            expiresAt: null,
            userEmail: sessionEntitlement.user_email,
          };
        }
        if (sessionEntitlement.access_type === 'stream_pass_48h') {
          if (sessionEntitlement.expires_at && new Date(sessionEntitlement.expires_at).getTime() > Date.now()) {
            return {
              allowed: true,
              accessType: 'stream_pass_48h',
              expiresAt: sessionEntitlement.expires_at,
              userEmail: sessionEntitlement.user_email,
            };
          }
          return { allowed: false, reason: 'Le pass temporaire de 48 heures a expiré.' };
        }
      }
    }

    // 2. Vérifier abonnement global actif (Option B)
    const subscription = this.activeSubscriptions.get(normalized);
    if (subscription && subscription.is_active) {
      if (new Date(subscription.expires_at).getTime() > Date.now()) {
        return {
          allowed: true,
          accessType: 'subscription_catalogue',
          expiresAt: subscription.expires_at,
          userEmail: normalized,
        };
      }
    }

    // 3. Vérifier entitlement unitaire (Option A: pass 48h ou lifetime)
    const key = `${normalized}:${canonicalTrackId}`;
    const entitlement = this.entitlements.get(key) || this.entitlements.get(`${normalized}:${trackId}`);
    if (!entitlement || !entitlement.is_active) {
      return { allowed: false, reason: 'Aucun droit d\'accès actif trouvé pour ce titre.' };
    }

    if (entitlement.access_type === 'lifetime_title') {
      return { allowed: true, accessType: 'lifetime_title', expiresAt: null, userEmail: entitlement.user_email };
    }

    if (entitlement.access_type === 'stream_pass_48h') {
      if (entitlement.expires_at && new Date(entitlement.expires_at).getTime() > Date.now()) {
        return { allowed: true, accessType: 'stream_pass_48h', expiresAt: entitlement.expires_at, userEmail: entitlement.user_email };
      }
      return { allowed: false, reason: 'Le pass temporaire de 48 heures a expiré.' };
    }

    return { allowed: false, reason: 'Accès non autorisé.' };
  }

  // --- Grand Livre Séquestre (Escrow Ledger J+7) ---

  public recordEscrowPayment(params: {
    creator_id: string;
    stripe_transfer_id: string;
    gross_amount_cents: number;
    platform_fee_cents: number;
    creator_net_cents: number;
    currency?: string;
  }): EscrowPayoutRecord {
    const escrowId = `esc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const createdAt = new Date();
    const availableOn = new Date(createdAt.getTime() + 7 * 24 * 3600 * 1000);

    const record: EscrowPayoutRecord = {
      id: escrowId,
      creator_id: params.creator_id,
      stripe_transfer_id: params.stripe_transfer_id,
      gross_amount_cents: params.gross_amount_cents,
      platform_fee_cents: params.platform_fee_cents,
      creator_net_cents: params.creator_net_cents,
      currency: params.currency || 'cad',
      created_at: createdAt.toISOString(),
      available_on: availableOn.toISOString(),
      status: 'in_escrow',
    };

    this.escrowLedger.set(escrowId, record);
    return record;
  }

  public getCreatorEscrowBalance(creatorId: string): {
    total_in_escrow_cents: number;
    available_cents: number;
    records: EscrowPayoutRecord[];
  } {
    const now = Date.now();
    let inEscrow = 0;
    let available = 0;
    const records: EscrowPayoutRecord[] = [];

    for (const record of this.escrowLedger.values()) {
      if (record.creator_id === creatorId) {
        if (new Date(record.available_on).getTime() <= now) {
          record.status = 'released';
          available += record.creator_net_cents;
        } else {
          inEscrow += record.creator_net_cents;
        }
        records.push(record);
      }
    }

    return {
      total_in_escrow_cents: inEscrow,
      available_cents: available,
      records,
    };
  }

  public releaseMatureEscrow(creatorId?: string): { released_count: number; released_cents: number } {
    const now = Date.now();
    let count = 0;
    let cents = 0;
    for (const record of this.escrowLedger.values()) {
      if (!creatorId || record.creator_id === creatorId) {
        if (record.status === 'in_escrow' && new Date(record.available_on).getTime() <= now) {
          record.status = 'released';
          count++;
          cents += record.creator_net_cents;
        }
      }
    }
    return { released_count: count, released_cents: cents };
  }

  // --- Widget Lecteur Embarqué (Stratégie 3) ---

  public getEmbedWidgetConfig(trackId: string, checkoutBaseUrl: string = 'https://thirty3.app/checkout'): EmbedWidgetConfig {
    const track = this.getTrack(trackId);
    if (!track) {
      throw new Error(`Piste introuvable pour widget : ${trackId}`);
    }

    return {
      track_id: track.id,
      title: track.title,
      artist: track.artist,
      preview_duration_seconds: 30,
      standard_frequency_hz: 440.0,
      harmonic_frequency_hz: track.acoustic_specs.base_frequency_hz,
      phi_carrier_ratio: 1.618033,
      preview_stream_url: `/api/media/stream/${track.id}/preview`,
      checkout_url: `${checkoutBaseUrl}?track_id=${track.id}&access_type=stream_pass_48h`,
      embed_iframe_code: `<iframe src="https://embed.thirty3.app/player/${track.id}" width="100%" height="180" frameborder="0" allow="autoplay"></iframe>`,
    };
  }

  public reset(): void {
    this.creators.clear();
    this.tracks.clear();
    this.attestations.clear();
    this.entitlements.clear();
    this.entitlementsBySessionId.clear();
    this.escrowLedger.clear();
    this.activeSubscriptions.clear();
    this.seedInitialCatalog();
  }
}

export const creatorMarketplace = new CreatorMarketplace();
