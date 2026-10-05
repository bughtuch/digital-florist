// src/lib/fulfillment/ensure-reveal-token.ts
//
// Server-only. Never import in client components.
//
// ensureRevealTokenForGift(giftId)
// ─────────────────────────────────
// Returns the raw reveal token for a paid Gift, creating the DB record on
// first call and reproducing the same token on every subsequent call.
//
// Token scheme: hmac_v1
//   raw_token  = HMAC-SHA256(REVEAL_TOKEN_SECRET, "v1:" + giftId) → base64url
//   token_hash = SHA-256(raw_token) → hex  (only this is stored)
//
// Safety guarantees:
//   - Gift must be paid with an edition_number before a token is issued.
//   - Revoked tokens are never reactivated.
//   - Raw token is never written to the database, logs, or external services.
//   - Safe to call concurrently: unique constraint on (gift_id) prevents duplicate rows.

import { createAdminClient } from '@/lib/supabase/admin';
import { deriveHmacRevealToken, hashRevealToken } from '@/lib/reveal/tokens';

export type EnsureRevealTokenResult =
  | { ok: true; rawToken: string }
  | { ok: false; reason: string };

export async function ensureRevealTokenForGift(
  giftId: string,
): Promise<EnsureRevealTokenResult> {
  const supabase = createAdminClient();

  // ── 1. Verify gift is paid with an edition ──────────────────────────────
  const { data: gift, error: giftError } = await supabase
    .from('gifts')
    .select('id, status, edition_number')
    .eq('id', giftId)
    .maybeSingle();

  if (giftError) {
    return { ok: false, reason: `Gift lookup failed: ${giftError.message}` };
  }
  if (!gift) {
    return { ok: false, reason: 'Gift not found.' };
  }
  if (gift.status !== 'paid') {
    return { ok: false, reason: `Gift is not paid (status: ${gift.status}).` };
  }
  if (!gift.edition_number) {
    return { ok: false, reason: 'Gift has no edition_number allocated.' };
  }

  // ── 2. Derive the hmac_v1 token ──────────────────────────────────────────
  // Throws if REVEAL_TOKEN_SECRET is missing/too short — let it propagate.
  const { rawToken, tokenHash } = deriveHmacRevealToken(giftId);

  // ── 3. Check for an existing token row ──────────────────────────────────
  const { data: existing, error: fetchError } = await supabase
    .from('reveal_tokens')
    .select('id, token_hash, token_scheme, revoked_at')
    .eq('gift_id', giftId)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, reason: `Token lookup failed: ${fetchError.message}` };
  }

  if (existing) {
    // Revoked tokens are never reactivated, regardless of scheme.
    if (existing.revoked_at !== null) {
      return {
        ok: false,
        reason: 'Reveal token has been revoked. Manual admin action required.',
      };
    }

    if (existing.token_scheme === 'hmac_v1') {
      // Verify the stored hash matches what we'd derive (secret consistency check).
      if (existing.token_hash !== tokenHash) {
        return {
          ok: false,
          reason:
            'Stored token hash does not match derived token. ' +
            'REVEAL_TOKEN_SECRET may have rotated. Manual admin action required.',
        };
      }
      // All good — return the reproduced raw token.
      return { ok: true, rawToken };
    }

    if (existing.token_scheme === 'random_v1') {
      // Legacy random token: cannot reproduce the raw token from the hash.
      // Revoke the old row and create a new hmac_v1 token so idempotent delivery works.
      // In production this path should never be reached (Stripe wasn't active pre-Build 09).
      const { error: revokeError } = await supabase
        .from('reveal_tokens')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (revokeError) {
        return {
          ok: false,
          reason: `Failed to revoke legacy random_v1 token: ${revokeError.message}`,
        };
      }
      // Fall through to insert new hmac_v1 token.
    }
  }

  // ── 4. Insert new hmac_v1 token row ─────────────────────────────────────
  const { error: insertError } = await supabase.from('reveal_tokens').insert({
    gift_id: giftId,
    token_hash: tokenHash,
    token_scheme: 'hmac_v1',
  });

  if (insertError) {
    // Unique constraint violation means a concurrent call already inserted.
    // Re-fetch and verify.
    if (insertError.code === '23505') {
      const { data: concurrent } = await supabase
        .from('reveal_tokens')
        .select('token_hash, token_scheme, revoked_at')
        .eq('gift_id', giftId)
        .maybeSingle();

      if (
        concurrent?.token_scheme === 'hmac_v1' &&
        concurrent.token_hash === tokenHash &&
        concurrent.revoked_at === null
      ) {
        return { ok: true, rawToken };
      }
      return {
        ok: false,
        reason: 'Concurrent token creation conflict. Retry.',
      };
    }
    return { ok: false, reason: `Token insert failed: ${insertError.message}` };
  }

  return { ok: true, rawToken };
}

/**
 * Reproduces the raw hmac_v1 reveal token for a gift without a DB write.
 * Used when we know the token already exists and just need the raw value.
 * Only valid when token_scheme = 'hmac_v1'.
 */
export function reproduceHmacRevealToken(giftId: string): string {
  const { rawToken } = deriveHmacRevealToken(giftId);
  return rawToken;
}

/**
 * Builds the full Reveal URL for a given locale and raw token.
 * Uses NEXT_PUBLIC_SITE_URL as the base.
 */
export function buildRevealUrl(locale: string, rawToken: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  return `${base}/${locale}/reveal/${rawToken}`;
}

// Suppress unused-import warning — hashRevealToken is used by tests via re-export.
export { hashRevealToken };
