// /[locale]/vault
//
// Private BloomVault — authenticated home for a user's claimed Blooms.
// Unauthenticated visitors see a sign-in form (magic link OTP).
// Authenticated users see their editorial Bloom grid with stats.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import VaultSignInClient from '@/components/vault/VaultSignInClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'VAULT — DIGITAL FLORIST',
  robots: 'noindex, nofollow, noarchive',
};

type VaultEntry = {
  entry_id: string;
  bloom_id: string;
  edition_number: number;
  claimed_at: string;
  bloom_title: string;
  bloom_slug: string;
  still_asset_url: string | null;
  city_code: string;
  city_name: string;
  collection_slug: string;
};

type Props = { params: Promise<{ locale: string }> };

export default async function VaultPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'vault' });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="flex min-h-svh flex-col bg-df-black">
        <Header locale={locale} />
        <main className="flex flex-1 items-center justify-center px-6 pt-16">
          <VaultSignInClient locale={locale} />
        </main>
        <Footer locale={locale} />
      </div>
    );
  }

  // ── Authenticated ──────────────────────────────────────────────────────────
  const { data: entries } = await supabase.rpc('get_my_vault');
  const vault = (entries ?? []) as VaultEntry[];

  // Stats
  const bloomCount = vault.length;
  const cityCount = new Set(vault.map((e) => e.city_code)).size;
  const firstYear = vault.length > 0
    ? new Date(vault[vault.length - 1].claimed_at).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} isAuthed />

      <main className="mx-auto w-full max-w-[1400px] px-6 pt-32 pb-24 md:px-10 lg:px-16">

        {/* Heading + stats */}
        <div className="mb-16 md:mb-20">
          <p className="mb-3 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
            DIGITAL FLORIST
          </p>
          <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-light leading-[1] tracking-[0.02em] text-df-text">
            {t('heading')}
          </h1>

          {bloomCount > 0 && (
            <p className="mt-4 text-[10px] tracking-[0.18em] text-df-muted uppercase">
              {bloomCount} {t('blooms')}
              {cityCount > 0 && ` · ${cityCount} ${t('cities')}`}
              {` · ${firstYear}${t('statSuffix')}`}
            </p>
          )}
        </div>

        {/* Empty state */}
        {bloomCount === 0 && (
          <div className="py-24 text-center">
            <p className="font-display text-[clamp(1.5rem,4vw,3rem)] font-light text-df-muted mb-6">
              {t('empty')}
            </p>
            <p className="text-[12px] leading-[1.9] tracking-[0.05em] text-df-faint mb-10">
              {t('emptyBody')}
            </p>
            <Link
              href={`/${locale}/gallery`}
              className="text-[9px] tracking-[0.22em] text-df-muted hover:text-df-text uppercase transition-colors duration-300"
            >
              GALLERY →
            </Link>
          </div>
        )}

        {/* Vault grid */}
        {bloomCount > 0 && (
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 bg-df-border">
            {vault.map((entry) => (
              <Link
                key={entry.entry_id}
                href={`/${locale}/vault/${entry.entry_id}`}
                className="group block bg-df-black p-6 hover:bg-df-surface transition-colors duration-500"
              >
                {/* Artwork */}
                <div className="relative mb-5 aspect-[3/4] w-full overflow-hidden bg-df-surface">
                  {entry.still_asset_url ? (
                    <img
                      src={entry.still_asset_url}
                      alt={entry.bloom_title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] tracking-[0.2em] text-df-faint uppercase">
                        DIGITAL FLORIST
                      </span>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-df-faint uppercase mb-1">
                    {entry.city_code} · {t('edition')} {String(entry.edition_number).padStart(3, '0')}
                  </p>
                  <p className="text-[13px] tracking-[0.08em] text-df-text uppercase">
                    {entry.bloom_title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer locale={locale} />
    </div>
  );
}
