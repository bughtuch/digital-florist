// /[locale]/claim/[token]
//
// Secure claim flow — allows the recipient of a paid Bloom to keep it in their Vault.
//
// Flow:
//   Unauthenticated → sign-in form (magic link OTP to their email)
//   Authenticated + email match → claim_bloom_to_vault() → redirect to vault entry
//   Authenticated + wrong email → error state with sign-out option
//   Token not found / already claimed → informational state

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { hashRevealToken, DEV_TOKEN_PREFIX } from '@/lib/reveal/tokens';
import ClaimSignInClient from '@/components/claim/ClaimSignInClient';
import SignOutButton from '@/components/auth/SignOutButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DIGITAL FLORIST',
  robots: 'noindex, nofollow, noarchive',
};

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

export default async function ClaimPage({ params }: Props) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: 'claim' });

  // Dev preview tokens have no claimable gift — redirect to gallery
  if (token.startsWith(DEV_TOKEN_PREFIX)) {
    if (process.env.NODE_ENV === 'production') notFound();
    redirect(`/${locale}/gallery`);
  }

  const tokenHash = hashRevealToken(token);

  // Check auth state
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-df-black px-6">
        <ClaimSignInClient locale={locale} token={token} />
        <div className="mt-12">
          <Link
            href={`/${locale}/gallery`}
            className="text-[9px] tracking-[0.18em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
          >
            {t('back')}
          </Link>
        </div>
      </div>
    );
  }

  // ── Authenticated — attempt to claim ──────────────────────────────────────
  const { data, error: rpcError } = await supabase.rpc('claim_bloom_to_vault', {
    p_token_hash: tokenHash,
  });

  if (rpcError) {
    return (
      <ClaimStaticPage
        locale={locale}
        heading={t('notFound')}
        t={t}
      />
    );
  }

  const result = data as { ok?: boolean; entry_id?: string; error?: string } | null;

  // ── Success → redirect to vault entry ─────────────────────────────────────
  if (result?.ok && result.entry_id) {
    redirect(`/${locale}/vault/${result.entry_id}`);
  }

  // ── Wrong email ───────────────────────────────────────────────────────────
  if (result?.error === 'wrong_email') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-df-black px-6">
        <div className="mx-auto max-w-[480px] text-center">
          <p className="mb-8 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
            DIGITAL FLORIST
          </p>
          <h1 className="font-display text-[clamp(1.5rem,4vw,2.5rem)] font-light leading-[1.1] tracking-[0.02em] text-df-text mb-6">
            {t('wrongEmail')}
          </h1>
          <p className="text-[12px] leading-[1.9] tracking-[0.05em] text-df-muted mb-10">
            {t('wrongEmailBody')}
          </p>
          <SignOutButton
            locale={locale}
            label={t('signOut')}
            className="text-[9px] tracking-[0.18em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
          />
        </div>
      </div>
    );
  }

  // ── Already claimed ───────────────────────────────────────────────────────
  if (result?.error === 'already_claimed') {
    return (
      <ClaimStaticPage
        locale={locale}
        heading={t('alreadyClaimed')}
        body={t('alreadyClaimedBody')}
        t={t}
      />
    );
  }

  // ── Fallback (not_found, gift_not_ready, etc.) ────────────────────────────
  return (
    <ClaimStaticPage
      locale={locale}
      heading={t('notFound')}
      t={t}
    />
  );
}

// ── Shared static layout ────────────────────────────────────────────────────

type StaticProps = {
  locale: string;
  heading: string;
  body?: string;
  t: Awaited<ReturnType<typeof getTranslations<'claim'>>>;
};

function ClaimStaticPage({ locale, heading, body, t }: StaticProps) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-df-black px-6">
      <div className="mx-auto max-w-[440px] text-center">
        <p className="mb-8 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
          DIGITAL FLORIST
        </p>
        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-light leading-[1.08] tracking-[0.02em] text-df-text mb-8">
          {heading}
        </h1>
        {body && (
          <p className="text-[12px] leading-[1.9] tracking-[0.06em] text-df-muted mb-16">
            {body}
          </p>
        )}
        <Link
          href={`/${locale}/gallery`}
          className="text-[9px] tracking-[0.18em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
        >
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
