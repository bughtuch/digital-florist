'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import MessageStep from './MessageStep';
import PeopleStep from './PeopleStep';
import ReviewPayStep from './ReviewPayStep';
import type { SendBloomData } from '@/types';

type Step = 1 | 2 | 3;

interface FormState {
  message: string;
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
}

type CheckoutPhase = 'idle' | 'creating' | 'ready' | 'error';

type Props = {
  bloom: SendBloomData;
  locale: string;
};

export default function SendFlowClient({ bloom, locale }: Props) {
  const t = useTranslations('send');

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>({
    message: '',
    senderName: '',
    senderEmail: '',
    recipientName: '',
    recipientEmail: '',
  });

  const [checkoutPhase, setCheckoutPhase] = useState<CheckoutPhase>('idle');
  const [clientSecret, setClientSecret] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────
  function handleMessageSubmit(message: string) {
    setForm((prev) => ({ ...prev, message }));
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Step 2 → 3 ──────────────────────────────────────────────────────────
  function handlePeopleSubmit(people: {
    senderName: string;
    senderEmail: string;
    recipientName: string;
    recipientEmail: string;
  }) {
    setForm((prev) => ({ ...prev, ...people }));
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Step 3 → Stripe ──────────────────────────────────────────────────────
  async function handleSend() {
    setCheckoutPhase('creating');
    setCheckoutError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: bloom.slug,
          locale,
          message: form.message,
          senderName: form.senderName,
          senderEmail: form.senderEmail,
          recipientName: form.recipientName,
          recipientEmail: form.recipientEmail,
        }),
      });

      const data = (await res.json()) as { clientSecret?: string; error?: string };

      if (!res.ok) {
        const msg = data.error ?? t('errors.checkoutFailed');
        setCheckoutPhase('error');
        setCheckoutError(
          data.error === 'This Bloom is not available.' ||
          data.error === 'This Bloom is sold out.'
            ? t('errors.bloomUnavailable')
            : msg,
        );
        return;
      }

      if (!data.clientSecret) {
        setCheckoutPhase('error');
        setCheckoutError(t('errors.checkoutFailed'));
        return;
      }

      setClientSecret(data.clientSecret);
      setCheckoutPhase('ready');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch {
      setCheckoutPhase('error');
      setCheckoutError(t('errors.checkoutFailed'));
    }
  }

  // ── Cancel embedded checkout ─────────────────────────────────────────────
  function handleCancelCheckout() {
    setCheckoutPhase('idle');
    setClientSecret('');
    setCheckoutError('');
  }

  // ── Step indicator ───────────────────────────────────────────────────────
  const stepLabel = `0${step} / 03`;

  return (
    <div className="flex min-h-svh flex-col bg-df-black">

      {/* Step indicator — top right */}
      <div className="fixed top-20 right-6 z-10 md:right-10">
        <span className="text-[9px] tracking-[0.2em] text-df-faint tabular-nums">
          {stepLabel}
        </span>
      </div>

      <main id="main-content" className="flex flex-1 flex-col justify-center pt-14 pb-10">
        {step === 1 && (
          <MessageStep
            bloom={bloom}
            initialMessage={form.message}
            onSubmit={handleMessageSubmit}
          />
        )}

        {step === 2 && (
          <PeopleStep
            initial={{
              recipientName: form.recipientName,
              recipientEmail: form.recipientEmail,
              senderName: form.senderName,
              senderEmail: form.senderEmail,
            }}
            onSubmit={handlePeopleSubmit}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <ReviewPayStep
            bloom={bloom}
            data={{
              message: form.message,
              recipientName: form.recipientName,
              senderName: form.senderName,
            }}
            checkoutPhase={checkoutPhase}
            clientSecret={clientSecret}
            errorMessage={checkoutError}
            onSend={handleSend}
            onBack={() => {
              setCheckoutPhase('idle');
              setStep(2);
            }}
            onCancelCheckout={handleCancelCheckout}
          />
        )}
      </main>
    </div>
  );
}
