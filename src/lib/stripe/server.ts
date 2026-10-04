// Server-only Stripe instance.
// Never import this from a client component or any 'use client' file.

import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured. Set it in .env.local.',
      );
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

// Maps Digital Florist locales to supported Stripe Checkout locales.
// Stripe does not have an 'ar' locale — falls back to auto-detection.
export function getStripeLocale(
  locale: string,
): Stripe.Checkout.SessionCreateParams['locale'] {
  const map: Record<string, Stripe.Checkout.SessionCreateParams['locale']> = {
    en: 'en',
    it: 'it',
    ko: 'ko',
    ja: 'ja',
    ar: 'auto',
  };
  return map[locale] ?? 'auto';
}
