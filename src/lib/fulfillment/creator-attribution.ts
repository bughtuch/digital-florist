// src/lib/fulfillment/creator-attribution.ts
//
// Server-only. Creates an immutable commission snapshot for a paid Gift.
// Never trusts browser-provided values.

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Creates a creator attribution for a paid Gift.
 * Idempotent — safe to call multiple times for the same gift_id.
 * Returns the attribution id on success, null if creator is not found/inactive.
 */
export async function createCreatorAttributionForGift(
  giftId: string,
  creatorSlug: string,
): Promise<string | null> {
  const supabase = createAdminClient();

  // 1. Load the gift — canonical amounts only
  const { data: gift, error: giftError } = await supabase
    .from('gifts')
    .select('id, amount_minor, currency, status')
    .eq('id', giftId)
    .maybeSingle();

  if (giftError || !gift) {
    console.error('[attribution] gift not found:', giftId);
    return null;
  }

  if (gift.status !== 'paid') {
    console.error('[attribution] gift not paid, status:', gift.status);
    return null;
  }

  // 2. Load the active creator — canonical commission_bps only
  const { data: creatorRows } = await supabase.rpc('resolve_creator_ref', {
    p_slug: creatorSlug,
  });
  const creatorRef = Array.isArray(creatorRows) ? creatorRows[0] : creatorRows;

  if (!creatorRef || creatorRef.active !== true) {
    console.error('[attribution] creator not found or inactive:', creatorSlug);
    return null;
  }

  // Load commission_bps from creators table (service_role only)
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .select('id, commission_bps, active')
    .eq('id', creatorRef.creator_id)
    .maybeSingle();

  if (creatorError || !creator || !creator.active) {
    return null;
  }

  // 3. Calculate commission — integer arithmetic, floor
  const commissionAmountMinor = Math.floor(
    (gift.amount_minor * creator.commission_bps) / 10000,
  );

  // 4. Insert attribution — idempotent via UNIQUE(gift_id)
  const { data: attribution, error: insertError } = await supabase
    .from('creator_attributions')
    .insert({
      creator_id: creator.id,
      gift_id: giftId,
      commission_bps: creator.commission_bps,
      commission_amount_minor: commissionAmountMinor,
      currency: gift.currency,
      status: 'approved',
    })
    .select('id')
    .single();

  if (insertError) {
    // Unique constraint violation = already exists — idempotent success
    if (insertError.code === '23505') {
      const { data: existing } = await supabase
        .from('creator_attributions')
        .select('id')
        .eq('gift_id', giftId)
        .maybeSingle();
      return existing?.id ?? null;
    }
    console.error('[attribution] insert error:', insertError.message);
    return null;
  }

  return attribution.id;
}
