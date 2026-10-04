// /[locale]/vault/[entryId]
//
// Private vault entry — the permanent home for a claimed Bloom.
// Ownership is enforced server-side via get_my_vault_entry() which checks auth.uid().
// Unauthenticated visitors and wrong-user requests both receive notFound().

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const dynamic = 'force-dynamic';

type VaultEntryRow = {
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
  bloom_material: string | null;
  bloom_year: number;
  edition_total: number;
  sender_name: string;
  private_message: string;
};

type Props = {
  params: Promise<{ locale: string; entryId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'VAULT — DIGITAL FLORIST',
    robots: 'noindex, nofollow, noarchive',
  };
}

export default async function VaultEntryPage({ params }: Props) {
  const { locale, entryId } = await params;
  const t = await getTranslations({ locale, namespace: 'vault' });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/vault`);
  }

  const { data } = await supabase.rpc('get_my_vault_entry', {
    p_entry_id: entryId,
  });

  const rows = data as VaultEntryRow[] | null;

  if (!rows || rows.length === 0) {
    notFound();
  }

  const entry = rows[0];

  const editionLabel = `${String(entry.edition_number).padStart(3, '0')} / ${String(entry.edition_total).padStart(3, '0')}`;
  const claimedDate = new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(entry.claimed_at));

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} isAuthed />

      <main className="mx-auto w-full max-w-[1400px] px-6 pt-28 pb-24 md:px-10 lg:px-16">

        {/* Back link */}
        <div className="mb-12">
          <Link
            href={`/${locale}/vault`}
            className="text-[9px] tracking-[0.2em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
          >
            {t('backToVault')}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20 xl:grid-cols-[55fr_45fr]">

          {/* Artwork */}
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-df-surface">
            {entry.still_asset_url ? (
              <img
                src={entry.still_asset_url}
                alt={entry.bloom_title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[8px] tracking-[0.2em] text-df-faint uppercase">
                  DIGITAL FLORIST
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between py-2">

            <div>
              {/* House mark */}
              <p className="mb-8 text-[8px] tracking-[0.3em] text-df-faint uppercase">
                DIGITAL FLORIST HOUSE
              </p>

              {/* From + message */}
              <div className="mb-12 border-l border-df-border pl-5">
                <p className="mb-3 text-[9px] tracking-[0.18em] text-df-faint uppercase">
                  FROM {entry.sender_name}
                </p>
                <p className="font-display text-[clamp(1.1rem,2.5vw,1.6rem)] font-light leading-[1.6] tracking-[0.01em] text-df-text whitespace-pre-wrap">
                  {entry.private_message}
                </p>
              </div>

              {/* Bloom title */}
              <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] font-light leading-[1] tracking-[0.02em] text-df-text mb-3">
                {entry.bloom_title}
              </h1>

              <p className="mb-12 text-[10px] tracking-[0.16em] text-df-muted uppercase">
                {entry.city_code} · DIGITAL FLORIST HOUSE
              </p>

              {/* Metadata grid */}
              <dl className="grid grid-cols-2 gap-x-8 gap-y-5 border-t border-df-border pt-8">
                <MetaItem label={t('edition')} value={editionLabel} />
                <MetaItem label="CITY" value={`${entry.city_name} · ${entry.city_code}`} />
                {entry.bloom_material && (
                  <MetaItem label="MATERIAL" value={entry.bloom_material} />
                )}
                <MetaItem label="YEAR" value={String(entry.bloom_year)} />
                <MetaItem label={t('claimedOn')} value={claimedDate} />
              </dl>
            </div>

            {/* Kept forever mark + receipt link */}
            <div className="mt-12 flex items-center justify-between">
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">
                KEPT FOREVER ·
              </p>
              <Link
                href={`/${locale}/vault/${entry.entry_id}/receipt`}
                className="text-[9px] tracking-[0.22em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
              >
                {t('cityReceipt')} →
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-[8px] tracking-[0.22em] text-df-faint uppercase">{label}</dt>
      <dd className="text-[11px] tracking-[0.08em] text-df-muted uppercase">{value}</dd>
    </div>
  );
}
