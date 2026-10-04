'use client';

import { useCallback } from 'react';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe/client';

type Props = {
  clientSecret: string;
};

export default function EmbeddedCheckoutWrapper({ clientSecret }: Props) {
  // fetchClientSecret must be a stable function reference
  const fetchClientSecret = useCallback(
    () => Promise.resolve(clientSecret),
    [clientSecret],
  );

  return (
    <div className="w-full">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
