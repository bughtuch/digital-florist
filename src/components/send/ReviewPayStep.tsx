'use client';

import { useTranslations } from 'next-intl';
import BloomArtPlaceholder from '@/components/gallery/BloomArtPlaceholder';
import EmbeddedCheckoutWrapper from './EmbeddedCheckoutWrapper';
import { formatPrice } from '@/lib/currency';
import type { SendBloomData } from '@/types';

type CheckoutPhase = 'idle' | 'creating' | 'ready' | 'error';

type ReviewData = {
  message: string;
  recipientName: string;
  senderName: string;
};

type Props = {
  bloom: SendBloomData;
  locale: string;
  data: ReviewData;
  checkoutPhase: CheckoutPhase;
  clientSecret: string;
  errorMessage: string;
  onSend: () => void;
  onBack: () => void;
  onCancelCheckout: () => void;
};

export default function ReviewPayStep({
  bloom,
  locale,
  data,
  checkoutPhase,
  clientSecret,
  errorMessage,
  onSend,
  onBack,
  onCancelCheckout,
}: Props) {
  const t = useTranslations('send');
  const priceDisplay = bloom.priceMinor && bloom.currency
    ? formatPrice(bloom.priceMinor, bloom.currency, locale)
    : t('step3.price');

  // Phase: show embedded Stripe checkout
  if (checkoutPhase === 'ready' && clientSecret) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-6 py-12 md:py-16">
        <div className="mb-8 flex items-center justify-between">
          <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">
            {t('step3.paymentHeading')}
          </p>
          <button
            onClick={onCancelCheckout}
            className="text-[9px] tracking-[0.18em] text-df-faint hover:text-df-muted uppercase transition-colors duration-200"
          >
            {t('step3.cancel')}
          </button>
        </div>
        <EmbeddedCheckoutWrapper clientSecret={clientSecret} />
      </div>
    );
  }

  // Phase: creating session (loading)
  const isCreating = checkoutPhase === 'creating';

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-12 md:py-20">

      <button
        onClick={onBack}
        disabled={isCreating}
        className="mb-10 text-[9px] tracking-[0.18em] text-df-faint hover:text-df-muted uppercase transition-colors duration-200 disabled:opacity-30"
      >
        {t('step3.back')}
      </button>

      <h1 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-light leading-[1.05] text-df-text mb-10 tracking-[0.02em]">
        {t('step3.heading')}
      </h1>

      {/* Bloom artwork + identity */}
      <div className="mb-10 flex gap-5 items-start">
        <div className="w-16 h-20 shrink-0 overflow-hidden">
          <BloomArtPlaceholder
            slug={bloom.slug}
            title={bloom.title}
            className="w-full h-full"
          />
        </div>
        <div className="pt-0.5">
          <p className="text-[11px] tracking-[0.12em] text-df-text uppercase mb-1">
            {bloom.title}
          </p>
          <p className="text-[9px] tracking-[0.16em] text-df-muted uppercase mb-1">
            {bloom.cityCode}&ensp;/&ensp;{bloom.archiveCode}
          </p>
          <p className="text-[9px] tracking-[0.14em] text-df-faint uppercase">
            {t('step3.edition', { defaultValue: 'EDITION' })}&ensp;{bloom.editionDisplay}
          </p>
        </div>
      </div>

      {/* Recipients */}
      <div className="mb-8 space-y-3 border-t border-df-border-subtle pt-6">
        <MetaRow label={t('step3.to')} value={data.recipientName} />
        <MetaRow label={t('step3.from')} value={data.senderName} />
      </div>

      {/* Message preview */}
      <div className="mb-8 border-t border-df-border-subtle pt-6">
        <p className="text-[9px] tracking-[0.18em] text-df-muted uppercase mb-3">
          {t('step3.message')}
        </p>
        <p className="text-[13px] text-df-muted leading-[1.75] line-clamp-3 whitespace-pre-wrap">
          {data.message}
        </p>
      </div>

      {/* Total */}
      <div className="mb-10 border-t border-df-border-subtle pt-6 flex justify-between items-baseline">
        <p className="text-[9px] tracking-[0.18em] text-df-muted uppercase">
          {t('step3.total')}
        </p>
        <p className="text-[15px] tracking-[0.06em] text-df-text">
          {priceDisplay}
        </p>
      </div>

      {/* Error message */}
      {checkoutPhase === 'error' && errorMessage && (
        <p role="alert" className="mb-6 text-[11px] text-red-600 tracking-[0.04em]">
          {errorMessage}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={onSend}
        disabled={isCreating}
        className={[
          'w-full border py-4 text-[11px] tracking-[0.2em] uppercase transition-all duration-300',
          isCreating
            ? 'border-df-border text-df-faint cursor-not-allowed'
            : 'border-df-text text-df-text hover:bg-df-text hover:text-df-black',
        ].join(' ')}
      >
        {isCreating ? t('step3.preparing') : t('step3.cta')}
      </button>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="text-[9px] tracking-[0.18em] text-df-muted uppercase w-10 shrink-0">
        {label}
      </span>
      <span className="text-[13px] text-df-text">{value}</span>
    </div>
  );
}
