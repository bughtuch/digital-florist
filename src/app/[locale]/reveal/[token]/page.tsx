// /[locale]/reveal/[token]
//
// The private Bloom reveal experience.
// Accessible only via a valid reveal token — never publicly linked.
//
// Security model:
//   - Token is SHA-256 hashed and looked up in reveal_tokens via admin client.
//   - Raw token never stored; hash stored in DB.
//   - Gift must be status = paid with edition_number set.
//   - Revoked tokens show 404 (no information leakage about revocation reason).
//   - Private fields (emails, Stripe IDs, gift UUID, token hash) never passed to UI.
//   - Page is noindex / nofollow / noarchive.
//
// Dev preview path:
//   - Tokens prefixed 'dev_' are accepted only when NODE_ENV !== 'production'.
//   - Dev tokens are HMAC-signed with REVEAL_DEV_SECRET.
//   - Dev tokens are self-contained — no DB read required.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  hashRevealToken,
  verifyDevPreviewToken,
  DEV_TOKEN_PREFIX,
} from '@/lib/reveal/tokens';
import RevealClient, { type RevealData } from '@/components/reveal/RevealClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your Bloom — DIGITAL FLORIST',
  robots: 'noindex, nofollow, noarchive',
};

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function RevealPage({ params }: Props) {
  const { locale, token } = await params;

  // ── Dev preview path ────────────────────────────────────────────────────
  if (token.startsWith(DEV_TOKEN_PREFIX)) {
    if (process.env.NODE_ENV === 'production') notFound();

    const devSecret = process.env.REVEAL_DEV_SECRET;
    if (!devSecret) {
      throw new Error(
        'REVEAL_DEV_SECRET is not set. Add it to .env.local to use dev preview.',
      );
    }

    const payload = verifyDevPreviewToken(token, devSecret);
    if (!payload) notFound();

    // Fetch bloom display data via public client (bloom data is publicly readable)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });

    const { data: bloom } = await supabase
      .from('blooms')
      .select('title, slug, archive_code, edition_total, still_asset_url, material_note, year, city_id')
      .eq('slug', payload.slug)
      .maybeSingle();

    let cityName = '';
    if (bloom?.city_id) {
      const { data: city } = await supabase
        .from('cities')
        .select('name, code')
        .eq('id', bloom.city_id)
        .maybeSingle();
      cityName = city?.name ?? '';
    }

    const revealData: RevealData = {
      senderName: payload.senderName,
      privateMessage: payload.message,
      bloomTitle: bloom?.title ?? `Preview — ${payload.slug}`,
      cityName,
      cityCode: '',
      archiveCode: bloom?.archive_code ?? '000',
      editionNumber: 19,
      editionTotal: bloom?.edition_total ?? 250,
      materialNote: bloom?.material_note ?? null,
      year: bloom?.year ?? 2026,
      stillAssetUrl: bloom?.still_asset_url ?? null,
      bloomSlug: payload.slug,
      locale,
      claimToken: token,
      isFirstOpen: true,
      isPreview: true,
    };

    return <RevealClient data={revealData} />;
  }

  // ── Production token path ───────────────────────────────────────────────
  const tokenHash = hashRevealToken(token);
  const supabase = createAdminClient();

  // Step 1 — Look up reveal token (admin client bypasses RLS)
  const { data: rt } = await supabase
    .from('reveal_tokens')
    .select('id, gift_id, open_count, revoked_at')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (!rt) notFound();
  if (rt.revoked_at) notFound();

  const isFirstOpen = rt.open_count === 0;

  // Step 2 — Verify gift is paid with an allocated edition
  const { data: gift } = await supabase
    .from('gifts')
    .select('status, edition_number, sender_name, private_message, bloom_id')
    .eq('id', rt.gift_id)
    .maybeSingle();

  if (!gift) notFound();
  if (gift.status !== 'paid' || !gift.edition_number) notFound();

  // Step 3 — Fetch bloom display data
  const { data: bloom } = await supabase
    .from('blooms')
    .select('title, slug, archive_code, edition_total, still_asset_url, material_note, year, city_id')
    .eq('id', gift.bloom_id)
    .maybeSingle();

  if (!bloom) notFound();

  // Step 4 — Fetch city display data
  const { data: city } = await supabase
    .from('cities')
    .select('name, code')
    .eq('id', bloom.city_id)
    .maybeSingle();

  // Step 5 — Track this open (non-blocking, non-fatal)
  // Fire-and-forget: don't await — avoids blocking the render
  supabase
    .rpc('track_reveal_open', { p_token_hash: tokenHash })
    .then(({ error }) => {
      if (error) {
        console.error('[reveal] track_reveal_open error:', error.message);
      }
    });

  // Build display data — private fields intentionally excluded
  const revealData: RevealData = {
    senderName: gift.sender_name,
    privateMessage: gift.private_message,
    bloomTitle: bloom.title,
    cityName: city?.name ?? '',
    cityCode: city?.code ?? '',
    archiveCode: bloom.archive_code,
    editionNumber: gift.edition_number,
    editionTotal: bloom.edition_total,
    materialNote: bloom.material_note ?? null,
    year: bloom.year,
    stillAssetUrl: bloom.still_asset_url ?? null,
    bloomSlug: bloom.slug,
    locale,
    claimToken: token, // raw token passed to claim URL — never logged
    isFirstOpen,
  };

  return <RevealClient data={revealData} />;
}
