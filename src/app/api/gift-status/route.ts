// GET /api/gift-status?session_id=cs_xxx
//
// Polled by the /[locale]/sent page when payment confirmation is still pending.
// Returns { status: 'paid' | 'expired' | 'pending' | 'error' }.
// Never exposes private gift data in the response.

import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe/server';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id');

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ status: 'error' }, { status: 400 });
  }

  try {
    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      return NextResponse.json({ status: 'paid' });
    }

    if (session.status === 'expired') {
      return NextResponse.json({ status: 'expired' });
    }

    return NextResponse.json({ status: 'pending' });

  } catch {
    // Do not expose Stripe errors — just signal an error state
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
