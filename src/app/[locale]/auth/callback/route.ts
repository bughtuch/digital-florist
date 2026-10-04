// /[locale]/auth/callback
//
// Exchanges a Supabase PKCE code for a session after email magic-link sign-in.
// `next` param is validated to only allow same-locale relative paths.
// No external redirects — any suspect `next` value falls back to /${locale}/vault.

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type Params = { params: Promise<{ locale: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const { locale } = await params;
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const nextRaw = searchParams.get('next');

  // Validate `next` — only accept relative paths under /${locale}/
  const safeNext = (() => {
    if (!nextRaw) return `/${locale}/vault`;
    // Must start with the correct locale prefix, no protocol, no double-slash
    if (
      nextRaw.startsWith(`/${locale}/`) &&
      !nextRaw.startsWith('//') &&
      !nextRaw.includes('://')
    ) {
      return nextRaw;
    }
    return `/${locale}/vault`;
  })();

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, request.url));
    }
  }

  // Code missing or exchange failed — redirect to vault (unauthenticated)
  return NextResponse.redirect(new URL(`/${locale}/vault`, request.url));
}
