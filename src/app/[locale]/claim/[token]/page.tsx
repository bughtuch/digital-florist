// /[locale]/claim/[token]
//
// Placeholder destination for "KEEP IN MY VAULT" CTA.
// The raw reveal token is in the URL — Build 05 will use it to authenticate
// the vault claim and associate the Bloom with a registered account.
//
// Build 04: beautiful holding page only.
// Build 05: vault auth + claim finalization.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

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

  // token is kept in the URL so Build 05 can pick it up for vault auth
  // It is not displayed and not logged
  void token;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-df-black px-6">

      <div className="mx-auto max-w-[440px] text-center">

        <p className="mb-8 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
          DIGITAL FLORIST
        </p>

        <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-light leading-[1.08] tracking-[0.02em] text-df-text mb-8">
          {t('heading')}
        </h1>

        <p className="text-[12px] leading-[1.9] tracking-[0.06em] text-df-muted mb-16">
          {t('body')}
        </p>

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
