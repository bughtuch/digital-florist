'use client';

// Shown when Stripe redirects to /sent but payment confirmation is not yet
// reflected in our system (edge case — Stripe's redirect implies payment is done,
// but this handles any brief delay).
//
// Polls /api/gift-status every 2 seconds.
// When confirmed, refreshes the server component to render SentSuccess.

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

type Props = {
  sessionId: string;
};

export default function SentPolling({ sessionId }: Props) {
  const t = useTranslations('sent');
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    const MAX_ATTEMPTS = 15; // 30 seconds total

    intervalRef.current = setInterval(async () => {
      attemptsRef.current += 1;

      try {
        const res = await fetch(`/api/gift-status?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as { status: string };

        if (data.status === 'paid') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          router.refresh();
          return;
        }

        if (data.status === 'expired' || data.status === 'error') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          router.refresh();
          return;
        }
      } catch {
        // Network error — keep polling
      }

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        router.refresh();
      }
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId, router]);

  return (
    <div className="flex min-h-svh items-center justify-center bg-df-black px-6">
      <div className="text-center">
        <p className="font-display text-[clamp(1.5rem,4vw,2.5rem)] font-light text-df-muted tracking-[0.04em]">
          {t('finishing')}
        </p>
      </div>
    </div>
  );
}
