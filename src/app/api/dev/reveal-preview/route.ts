// GET /api/dev/reveal-preview?slug=[bloom_slug]&locale=[locale]
//
// Development-only route that generates a signed preview reveal token.
// Returns a URL you can open to preview the reveal experience.
//
// SAFETY:
//   - Returns 404 immediately in production (NODE_ENV === 'production').
//   - Requires REVEAL_DEV_SECRET to be set in .env.local.
//   - The token is HMAC-signed — cannot be forged without the secret.
//   - The reveal page also checks NODE_ENV before accepting dev tokens.
//   - This route compiles to production builds but is completely inert there.
//
// USAGE (development only):
//   GET http://localhost:3000/api/dev/reveal-preview
//   GET http://localhost:3000/api/dev/reveal-preview?slug=black-calla&locale=en
//   GET http://localhost:3000/api/dev/reveal-preview?slug=paper-camellia&locale=ja

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { generateDevPreviewToken } from '@/lib/reveal/tokens';

export async function GET(req: NextRequest) {
  // ── Block in production — hard stop ────────────────────────────────────
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  // ── Require dev secret ──────────────────────────────────────────────────
  const devSecret = process.env.REVEAL_DEV_SECRET;
  if (!devSecret) {
    return NextResponse.json(
      {
        error: 'REVEAL_DEV_SECRET is not set.',
        hint: 'Add REVEAL_DEV_SECRET=any-random-string to .env.local and restart the dev server.',
      },
      { status: 500 },
    );
  }

  const slug = req.nextUrl.searchParams.get('slug') ?? 'black-calla';
  const locale = req.nextUrl.searchParams.get('locale') ?? 'en';

  // ── Fetch bloom display data (public client — bloom data is public) ─────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  let bloomTitle = `Preview Bloom (${slug})`;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: { getAll: () => [], setAll: () => {} },
      });
      const { data: bloom } = await supabase
        .from('blooms')
        .select('title')
        .eq('slug', slug)
        .maybeSingle();
      if (bloom?.title) bloomTitle = bloom.title;
    } catch {
      // Non-fatal — use fallback title
    }
  }

  // ── Generate signed dev preview token ──────────────────────────────────
  const token = generateDevPreviewToken(
    {
      slug,
      senderName: 'Amara',
      message:
        'Found this and thought of you.\n\nSome things are better kept private — this is one of them.',
      ts: Date.now(),
    },
    devSecret,
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const url = `${siteUrl}/${locale}/reveal/${token}`;

  return NextResponse.json({
    url,
    bloom: bloomTitle,
    locale,
    note: 'Dev preview only. Invalid in production. Open the URL to preview the reveal experience.',
  });
}
