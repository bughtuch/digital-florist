'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { SendBloomData } from '@/types';

const MAX = 320;

type Props = {
  bloom: SendBloomData;
  initialMessage: string;
  onSubmit: (message: string) => void;
};

export default function MessageStep({ bloom, initialMessage, onSubmit }: Props) {
  const t = useTranslations('send');
  const [message, setMessage] = useState(initialMessage);
  const [error, setError] = useState('');

  const remaining = MAX - message.length;
  const nearLimit = remaining <= 60;
  const atLimit = remaining <= 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError(t('errors.messageRequired'));
      return;
    }
    if (trimmed.length > MAX) {
      setError(t('errors.messageTooLong'));
      return;
    }
    setError('');
    onSubmit(trimmed);
  }

  return (
    <div className="mx-auto w-full max-w-[560px] px-6 py-12 md:py-20">

      {/* Bloom reference */}
      <p className="mb-10 text-[9px] tracking-[0.22em] text-df-faint uppercase">
        {bloom.cityCode}&ensp;/&ensp;{bloom.archiveCode}&ensp;—&ensp;{bloom.title}
      </p>

      <h1 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-light leading-[1.05] text-df-text mb-10">
        {t('step1.heading')}
      </h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="relative">
          <label
            htmlFor="message"
            className="block text-[9px] tracking-[0.18em] text-df-muted uppercase mb-3"
          >
            {t('step1.label')}
          </label>

          <textarea
            id="message"
            name="message"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            placeholder={t('step1.placeholder')}
            rows={6}
            maxLength={MAX + 10} // allow typing past limit so counter shows, but server validates
            className={[
              'w-full resize-none bg-df-surface border text-df-text text-[14px]',
              'leading-[1.75] px-4 py-3 outline-none placeholder:text-df-faint',
              'transition-colors duration-200 focus:border-df-muted',
              error ? 'border-red-800' : 'border-df-border',
            ].join(' ')}
            aria-describedby={error ? 'message-error' : 'message-hint'}
          />

          {/* Character counter */}
          <div
            className={[
              'absolute bottom-3 right-4 text-[10px] tabular-nums transition-opacity duration-200',
              nearLimit && !atLimit ? 'text-df-muted opacity-100' : '',
              atLimit ? 'text-red-600 opacity-100' : '',
              !nearLimit ? 'opacity-0' : '',
            ].join(' ')}
            aria-live="polite"
          >
            {remaining}
          </div>
        </div>

        {/* Hint */}
        {!error && (
          <p id="message-hint" className="mt-2 text-[10px] text-df-faint tracking-[0.06em]">
            {t('step1.hint')}
          </p>
        )}

        {/* Error */}
        {error && (
          <p id="message-error" role="alert" className="mt-2 text-[10px] text-red-600 tracking-[0.06em]">
            {error}
          </p>
        )}

        <button
          type="submit"
          className="mt-10 w-full border border-df-border py-4 text-[11px] tracking-[0.2em] text-df-text uppercase hover:border-df-muted transition-colors duration-300"
        >
          {t('step1.cta')}
        </button>
      </form>
    </div>
  );
}
