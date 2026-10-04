// /[locale]/vault/[entryId]/receipt
//
// City Receipt — immutable provenance record for a claimed Bloom.
// Ownership enforced server-side via get_receipt_for_vault_entry().
// Unauthenticated visitors and wrong-user requests both receive notFound().
// Print-friendly: preserves dark aesthetic via print CSS in globals.css.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PrintButton from '@/components/receipt/PrintButton';

export const dynamic = 'force-dynamic';

type ReceiptRow = {
  receipt_code: string;
  bloom_title: string;
  city_code: string;
  city_name: string;
  archive_code: string;
  edition_number: number;
  edition_total: number;
  sender_name: string;
  issued_at: string;
};

type Props = {
  params: Promise<{ locale: string; entryId: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'CITY RECEIPT — DIGITAL FLORIST',
    robots: 'noindex, nofollow, noarchive',
  };
}

export default async function ReceiptPage({ params }: Props) {
  const { locale, entryId } = await params;
  const t = await getTranslations({ locale, namespace: 'receipt' });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/vault`);
  }

  const { data } = await supabase.rpc('get_receipt_for_vault_entry', {
    p_entry_id: entryId,
  });

  const rows = data as ReceiptRow[] | null;

  // No receipt yet — show pending state rather than 404
  // (receipt is issued asynchronously after claiming)
  const receipt = rows && rows.length > 0 ? rows[0] : null;

  if (!receipt && (!rows || rows.length === 0)) {
    // Check if entry exists for this user at all — if not, 404
    const { data: entryCheck } = await supabase.rpc('get_my_vault_entry', {
      p_entry_id: entryId,
    });
    if (!entryCheck || (entryCheck as unknown[]).length === 0) {
      notFound();
    }
  }

  const editionLabel = receipt
    ? `${String(receipt.edition_number).padStart(3, '0')} / ${String(receipt.edition_total).padStart(3, '0')}`
    : null;

  const issuedDate = receipt
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(receipt.issued_at))
    : null;

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <div className="print:hidden">
        <Header locale={locale} isAuthed />
      </div>

      <main className="mx-auto w-full max-w-[900px] px-6 pt-28 pb-24 md:px-10">

        {/* Back link */}
        <div className="mb-12 print:hidden">
          <Link
            href={`/${locale}/vault/${entryId}`}
            className="text-[9px] tracking-[0.2em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
          >
            {t('backToEntry')}
          </Link>
        </div>

        {receipt ? (
          <>
            {/* Receipt document */}
            <div className="border border-df-border p-8 md:p-12 lg:p-16">

              {/* House mark */}
              <div className="mb-12 flex items-start justify-between">
                <p className="text-[8px] tracking-[0.3em] text-df-faint uppercase">
                  DIGITAL FLORIST HOUSE
                </p>
                <p className="text-[8px] tracking-[0.2em] text-df-faint uppercase">
                  {t('heading')}
                </p>
              </div>

              {/* Receipt code — the centrepiece */}
              <div className="mb-14 border-b border-df-border pb-14">
                <p className="mb-4 text-[9px] tracking-[0.22em] text-df-faint uppercase">
                  {t('receiptCode')}
                </p>
                <p className="font-display text-[clamp(2rem,6vw,4.5rem)] font-light leading-[1] tracking-[0.04em] text-df-text">
                  {receipt.receipt_code}
                </p>
              </div>

              {/* Metadata grid */}
              <dl className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-3 mb-14">
                <ReceiptItem label={t('bloom')} value={receipt.bloom_title} />
                <ReceiptItem label={t('city')} value={`${receipt.city_name} · ${receipt.city_code}`} />
                <ReceiptItem label={t('edition')} value={editionLabel!} />
                <ReceiptItem label={t('issuedTo')} value={receipt.sender_name} />
                <ReceiptItem label={t('issuedOn')} value={issuedDate!} />
                <ReceiptItem label="ARCHIVE" value={receipt.archive_code} />
              </dl>

              {/* Permanent mark */}
              <div className="border-t border-df-border pt-8 flex items-center justify-between">
                <p className="text-[8px] tracking-[0.28em] text-df-faint uppercase">
                  {t('permanent')}
                </p>
                <p className="text-[8px] tracking-[0.2em] text-df-faint uppercase">
                  DIGITAL FLORIST ·
                </p>
              </div>

            </div>

            {/* Print hint */}
            <div className="mt-8 text-right print:hidden">
              <PrintButton />
            </div>
          </>
        ) : (
          /* Receipt not yet issued */
          <div className="py-24 text-center">
            <p className="font-display text-[clamp(1.5rem,4vw,3rem)] font-light text-df-muted mb-6">
              {t('notIssued')}
            </p>
            <p className="text-[12px] leading-[1.9] tracking-[0.05em] text-df-faint">
              {t('notIssuedBody')}
            </p>
          </div>
        )}

      </main>

      <div className="print:hidden">
        <Footer locale={locale} />
      </div>
    </div>
  );
}

function ReceiptItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="mb-1 text-[8px] tracking-[0.22em] text-df-faint uppercase">{label}</dt>
      <dd className="text-[11px] tracking-[0.08em] text-df-muted uppercase">{value}</dd>
    </div>
  );
}
