'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';

type Props = {
  locale: string;
  token: string;
};

export default function ClaimSignInClient({ locale, token }: Props) {
  const t = useTranslations('claim');
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setPhase('sending');

    const supabase = createClient();
    const redirectTo = `${siteUrl}/${locale}/auth/callback?next=${encodeURIComponent(`/${locale}/claim/${token}`)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    setPhase(error ? 'error' : 'sent');
  }

  if (phase === 'sent') {
    return (
      <div className="mx-auto max-w-[440px] text-center">
        <p className="mb-6 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
          DIGITAL FLORIST
        </p>
        <h1 className="font-display text-[clamp(1.75rem,5vw,3rem)] font-light leading-[1.08] tracking-[0.02em] text-df-text mb-6">
          {t('checkEmail')}
        </h1>
        <p className="text-[12px] leading-[1.9] tracking-[0.05em] text-df-muted">
          {t('checkEmailBody')}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[440px] text-center">
      <p className="mb-8 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
        DIGITAL FLORIST
      </p>

      <h1 className="font-display text-[clamp(2rem,6vw,3.5rem)] font-light leading-[1.08] tracking-[0.02em] text-df-text mb-6">
        {t('heading')}
      </h1>

      <p className="text-[12px] leading-[1.9] tracking-[0.05em] text-df-muted mb-10">
        {t('signInBody')}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-start">
          <label
            htmlFor="claim-email"
            className="text-[9px] tracking-[0.2em] text-df-faint uppercase"
          >
            {t('emailLabel')}
          </label>
          <input
            id="claim-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="
              w-full border border-df-border bg-transparent px-4 py-3
              text-[12px] tracking-[0.06em] text-df-text placeholder:text-df-faint
              outline-none focus:border-df-muted transition-colors duration-300
            "
          />
        </div>

        {phase === 'error' && (
          <p className="text-[10px] tracking-[0.08em] text-red-400">
            Something went wrong. Please try again.
          </p>
        )}

        <button
          type="submit"
          disabled={phase === 'sending' || !email.trim()}
          className="
            mt-2 border border-df-text px-8 py-4
            text-[9px] tracking-[0.22em] text-df-text uppercase
            hover:bg-df-text hover:text-df-black transition-colors duration-300
            disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          {phase === 'sending' ? '…' : t('signInCta')}
        </button>
      </form>
    </div>
  );
}
