/**
 * HARMONIC STUDIO - Stripe Connect 85/15 Transfer Engine & Billing Controller
 * AoT Invariant 3: Integer-only cents arithmetic to eliminate IEEE-754 rounding errors.
 * Split Scheme: 85% Creator / 15% Platform.
 */

export interface TrackCheckoutParams {
  trackId: string;
  trackTitle: string;
  creatorStripeAccountId: string;
  buyerUserId: string;
  originUrl?: string;
  priceCad?: number;
}

export interface SplitCalculation {
  totalAmountCents: number;
  creatorSplitCents: number;
  platformFeeCents: number;
  creatorPercentage: string;
  platformPercentage: string;
}

/**
 * Computes exact integer cents split:
 * For 0.99 CAD (99 cents):
 * Creator Split = floor(99 * 0.85) = 84 cents
 * Platform Fee  = 99 - 84 = 15 cents
 */
export function calculateSplitCents(priceCad = 0.99): SplitCalculation {
  const totalAmountCents = Math.round(priceCad * 100);
  const creatorSplitCents = Math.floor(totalAmountCents * 0.85);
  const platformFeeCents = totalAmountCents - creatorSplitCents;

  return {
    totalAmountCents,
    creatorSplitCents,
    platformFeeCents,
    creatorPercentage: '85%',
    platformPercentage: '15%',
  };
}

/**
 * Generates an idempotent Stripe Checkout payload for single track purchases
 */
export function createTrackCheckoutPayload(params: TrackCheckoutParams) {
  const split = calculateSplitCents(params.priceCad || 0.99);

  return {
    payment_method_types: ['card'],
    mode: 'payment',
    client_reference_id: params.buyerUserId,
    line_items: [
      {
        price_data: {
          currency: 'cad',
          product_data: {
            name: `${params.trackTitle} (Master Audio 432Hz / EBU R128)`,
            metadata: {
              trackId: params.trackId,
              standard: 'EBU_R128_LUFS_14',
            },
          },
          unit_amount: split.totalAmountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: split.platformFeeCents,
      transfer_data: {
        destination: params.creatorStripeAccountId,
      },
      metadata: {
        trackId: params.trackId,
        buyerUserId: params.buyerUserId,
        splitScheme: '85_CREATOR_15_PLATFORM',
        creatorSplitCents: String(split.creatorSplitCents),
        platformFeeCents: String(split.platformFeeCents),
      },
    },
    success_url: `${params.originUrl || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.originUrl || ''}/cancel`,
  };
}

/**
 * Monthly Unlimited Pass billing parameters (9.99 CAD = 999 cents)
 */
export const UNLIMITED_PASS_SPECS = {
  priceCad: 9.99,
  priceCents: 999,
  currency: 'cad',
  interval: 'month',
  planName: 'Pass Fréquentiel Illimité 432Hz & Φ',
} as const;
