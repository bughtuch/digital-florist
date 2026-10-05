// POST /api/stripe/webhook
//
// Receives Stripe webhook events and finalises gifts.
// Idempotent: a Stripe webhook retry will never allocate a second edition.
//
// Requires STRIPE_WEBHOOK_SECRET to verify signatures.
// Do not process unsigned payloads.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeServer } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fulfillPaidGift } from '@/lib/fulfillment/fulfill-paid-gift';

// Next.js App Router — read raw body as text for Stripe signature verification
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 });
  }

  // ── Verify Stripe signature ─────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    const stripe = getStripeServer();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[webhook] signature verification failed:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Webhook signature invalid.' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // ── Idempotency check ───────────────────────────────────────────────────
  // Record this event first. If the unique constraint fires (duplicate),
  // the event has already been processed — acknowledge safely.
  const { error: insertError } = await supabase
    .from('stripe_webhook_events')
    .insert({
      stripe_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    });

  if (insertError) {
    if (insertError.code === '23505') {
      // Unique violation — this event was already processed
      return NextResponse.json({ received: true });
    }
    console.error('[webhook] event recording error:', insertError.message);
    return NextResponse.json({ error: 'Event recording failed.' }, { status: 500 });
  }

  // ── Handle events ───────────────────────────────────────────────────────
  try {
    switch (event.type) {

      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status !== 'paid') {
          // Payment not yet confirmed (e.g. async method still pending)
          break;
        }

        const giftId = session.metadata?.gift_id;
        if (!giftId) {
          console.error('[webhook] missing gift_id in session metadata:', session.id);
          break;
        }

        const piId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? '';

        const { error: rpcError } = await supabase.rpc('finalize_paid_gift', {
          p_gift_id: giftId,
          p_stripe_checkout_session_id: session.id,
          p_stripe_payment_intent_id: piId,
        });

        if (rpcError) {
          console.error('[webhook] finalize_paid_gift error:', rpcError.message);
          // Return 500 so Stripe retries — idempotency guard handles the retry safely
          return NextResponse.json({ error: 'Finalisation failed.' }, { status: 500 });
        }

        // ── Fulfilment (Build 09) ──────────────────────────────────────────
        // fulfillPaidGift is idempotent: calling it on a Stripe retry is safe.
        // It handles: City Receipt, Reveal token, recipient email, sender confirmation.
        // Email delivery failure does NOT fail the webhook — payment is permanent.
        // We fire-and-forget in a microtask so Stripe gets a fast 200 response.
        fulfillPaidGift(giftId).catch((err: unknown) => {
          console.error(
            '[webhook] fulfillPaidGift error for gift',
            giftId,
            ':',
            err instanceof Error ? err.message : 'unknown',
          );
        });

        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const giftId = session.metadata?.gift_id;

        if (giftId) {
          await supabase
            .from('gifts')
            .update({ status: 'expired', expired_at: new Date().toISOString() })
            .eq('id', giftId)
            .in('status', ['draft', 'checkout_created']); // Only expire if not already paid
        }

        break;
      }

      default:
        // Unhandled event types are acknowledged without error
        break;
    }
  } catch (err) {
    console.error('[webhook] handler error:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Webhook handler failed.' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
