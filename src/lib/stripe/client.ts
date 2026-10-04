// Browser-side Stripe.js loader.
// loadStripe is called once at module level — safe to import in client components.

import { loadStripe } from '@stripe/stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

// stripePromise resolves to null when the key is absent (dev without Stripe configured).
// The EmbeddedCheckoutProvider handles null gracefully.
export const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : Promise.resolve(null);
