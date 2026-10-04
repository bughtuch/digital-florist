// /[locale]/sent
//
// Stripe redirects here after embedded checkout completes.
// The session_id is read from the URL query param.
//
// Server-side: verifies payment with Stripe, calls finalize_paid_gift (idempotent),
// then renders the appropriate confirmation or error state.
//
// The webhook is the authoritative finalisation path.
// This page calls finalize_paid_gift as a fallback so the confirmation is
// immediate for the customer — the idempotency guard means the webhook
// doing the same thing later is harmless.

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import SentPolling from '@/components/sent/SentPolling';
import { getStripeServer } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GiftConfirmation } from '@/types';
import Stripe from 'stripe';

export const metadata: Metadata = {
  title: 'Your Bloom — DIGITAL FLORIST',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

type Status = 'paid' | 'pending' | 'expired' | 'error';
type ResolvedSession = {
  status: Status;
  giftData: GiftConfirmation | null;
};

async function resolveSession(sessionId: string): Promise<ResolvedSession> {
  try {
    const stripe = getStripeServer();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    if (session.status === 'expired') {
      return { status: 'expired', giftData: null };
    }

    if (session.payment_status !== 'paid') {
      return { status: 'pending', giftData: null };
    }

    const giftId = session.metadata?.gift_id;
    if (!giftId) return { status: 'paid', giftData: null };

    const supabase = createAdminClient();

    const pi = session.payment_intent as Stripe.PaymentIntent | string | null;
    const piId = typeof pi === 'string' ? pi : pi?.id ?? '';

    // Idempotent — safe if webhook already ran
    await supabase.rpc('finalize_paid_gift', {
      p_gift_id: giftId,
      p_stripe_checkout_session_id: session.id,
      p_stripe_payment_intent_id: piId,
    });

    // Fetch minimal display data — no private fields
    const { data: gift } = await supabase
      .from('gifts')
      .select('edition_number, bloom_id')
      .eq('id', giftId)
      .single();

    if (!gift?.bloom_id) return { status: 'paid', giftData: null };

    const { data: bloom } = await supabase
      .from('blooms')
      .select('title, archive_code, edition_total, city:cities(code)')
      .eq('id', gift.bloom_id)
      .single();

    if (!bloom) return { status: 'paid', giftData: null };

    const cityRaw = bloom.city;
    const city = (Array.isArray(cityRaw) ? cityRaw[0] : cityRaw) as { code: string } | null | undefined;
    return {
      status: 'paid',
      giftData: {
        bloomTitle: bloom.title,
        cityCode: city?.code ?? '',
        archiveCode: bloom.archive_code,
        editionNumber: gift.edition_number ?? 0,
        editionTotal: bloom.edition_total,
      },
    };

  } catch {
    return { status: 'error', giftData: null };
  }
}

export default async function SentPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { session_id: sessionId } = await searchParams;

  if (!sessionId || typeof sessionId !== 'string') {
    redirect(`/${locale}`);
  }

  const t = await getTranslations({ locale, namespace: 'sent' });
  const { status, giftData } = await resolveSession(sessionId);

  // ── Pending: poll until webhook fires ────────────────────────────────────
  if (status === 'pending') {
    return (
      <>
        <Header locale={locale} />
        <SentPolling sessionId={sessionId} />
      </>
    );
  }

  // ── Expired / Error ──────────────────────────────────────────────────────
  if (status === 'expired' || status === 'error') {
    return (
      <div className="flex min-h-svh flex-col bg-df-black">
        <Header locale={locale} />
        <main id="main-content" className="flex flex-1 items-center justify-center px-6">
          <div className="mx-auto max-w-[480px] py-20 text-center">
            <h1 className="font-display text-[clamp(1.75rem,5vw,3rem)] font-light text-df-text leading-[1.05] mb-5 tracking-[0.02em]">
              {t('notCompleted')}
            </h1>
            <p className="text-[11px] tracking-[0.08em] text-df-muted mb-12">
              {t('notCompletedSub')}
            </p>
            <Link
              href={`/${locale}/gallery`}
              className="text-[10px] tracking-[0.18em] text-df-muted hover:text-df-text uppercase transition-colors duration-300"
            >
              {t('backToGallery')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ── Paid: confirmation ───────────────────────────────────────────────────
  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />

      <main id="main-content" className="flex flex-1 items-center justify-center px-6">
        <div className="mx-auto max-w-[480px] py-20 text-center">

          <h1 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-light text-df-text leading-[1.05] mb-10 tracking-[0.02em]">
            {t('ready')}
          </h1>

          {giftData && (
            <div className="mb-10 space-y-2">
              <p className="text-[13px] tracking-[0.1em] text-df-text uppercase">
                {giftData.bloomTitle}
              </p>
              <p className="text-[10px] tracking-[0.16em] text-df-muted uppercase">
                {giftData.cityCode}&ensp;/&ensp;{giftData.archiveCode}
              </p>
              <p className="text-[10px] tracking-[0.14em] text-df-faint uppercase">
                {t('edition')}&ensp;
                {String(giftData.editionNumber).padStart(3, '0')}&ensp;/&ensp;{giftData.editionTotal}
              </p>
            </div>
          )}

          <div className="border-t border-df-border-subtle pt-8 space-y-3">
            <p className="text-[10px] tracking-[0.12em] text-df-muted">
              {t('paymentConfirmed')}
            </p>
            <p className="text-[10px] tracking-[0.08em] text-df-faint leading-[1.8]">
              {t('deliveryNote')}
            </p>
          </div>

          <div className="mt-12">
            <Link
              href={`/${locale}/gallery`}
              className="text-[10px] tracking-[0.18em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
            >
              {t('backToGallery')}
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
