// POST /api/checkout
//
// Creates a draft Gift record and a Stripe Embedded Checkout session.
// Returns { clientSecret } for the browser to mount <EmbeddedCheckout />.
//
// Security rules enforced here:
//   - All Bloom data (price, availability, inventory) is fetched server-side.
//   - No browser-supplied price, currency, or inventory values are trusted.
//   - Private message and recipient email are NOT sent to Stripe metadata.

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripeServer, getStripeLocale } from '@/lib/stripe/server';
import { checkoutInputSchema } from '@/lib/validation/send';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  // ── Validate and sanitise input ─────────────────────────────────────────
  const parsed = checkoutInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input.', details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const {
    slug,
    locale,
    message,
    senderName,
    senderEmail,
    recipientName,
    recipientEmail,
  } = parsed.data;

  try {
    const supabase = createAdminClient();

    // ── Fetch and verify Bloom server-side ──────────────────────────────
    const { data: bloom, error: bloomError } = await supabase
      .from('blooms')
      .select('id, title, archive_code, edition_total, edition_sold, price_minor, currency, status, published_at, city:cities(code)')
      .eq('slug', slug)
      .maybeSingle();

    if (bloomError) {
      console.error('[checkout] bloom fetch error:', bloomError.message);
      return NextResponse.json({ error: 'Failed to fetch Bloom.' }, { status: 500 });
    }

    if (!bloom) {
      return NextResponse.json({ error: 'Bloom not found.' }, { status: 404 });
    }

    if (bloom.status !== 'available') {
      return NextResponse.json({ error: 'This Bloom is not available.' }, { status: 400 });
    }

    if (!bloom.published_at) {
      return NextResponse.json({ error: 'This Bloom is not available.' }, { status: 400 });
    }

    if (bloom.edition_sold >= bloom.edition_total) {
      return NextResponse.json({ error: 'This Bloom is sold out.' }, { status: 400 });
    }

    // Price verification — never trust the browser for price
    if (!bloom.price_minor || bloom.price_minor <= 0 || !bloom.currency) {
      console.error('[checkout] price verification failed for bloom:', slug);
      return NextResponse.json({ error: 'Price verification failed.' }, { status: 400 });
    }

    // ── Create draft gift ───────────────────────────────────────────────
    const { data: gift, error: giftError } = await supabase
      .from('gifts')
      .insert({
        bloom_id: bloom.id,
        sender_name: senderName,
        sender_email: senderEmail,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        private_message: message,
        locale,
        status: 'draft',
        amount_minor: bloom.price_minor,
        currency: bloom.currency,
      })
      .select('id')
      .single();

    if (giftError || !gift) {
      console.error('[checkout] gift insert error:', giftError?.message);
      return NextResponse.json({ error: 'Failed to create gift.' }, { status: 500 });
    }

    // ── Create Stripe Embedded Checkout session ─────────────────────────
    const stripe = getStripeServer();

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const automaticTaxEnabled =
      process.env.STRIPE_AUTOMATIC_TAX_ENABLED === 'true';

    const cityRaw = bloom.city;
    const cityObj = (Array.isArray(cityRaw) ? cityRaw[0] : cityRaw) as { code: string } | null | undefined;
    const cityCode = cityObj?.code ?? '';
    const nextEdition = bloom.edition_sold + 1;

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      return_url: `${siteUrl}/${locale}/sent?session_id={CHECKOUT_SESSION_ID}`,
      locale: getStripeLocale(locale),
      mode: 'payment',
      customer_email: senderEmail,

      line_items: [
        {
          price_data: {
            currency: bloom.currency.toLowerCase(),
            unit_amount: bloom.price_minor,
            tax_behavior: 'inclusive',
            product_data: {
              name: bloom.title,
              description: `Digital Bloom — ${cityCode} / ${bloom.archive_code} — Edition ${String(nextEdition).padStart(3, '0')} / ${bloom.edition_total}`,
            },
          },
          quantity: 1,
        },
      ],

      payment_intent_data: {
        metadata: {
          gift_id: gift.id,
          bloom_id: bloom.id,
          creator_ref: req.cookies.get('df_ref')?.value ?? '',
        },
      },

      // gift_id in session metadata for webhook processing
      // private_message and recipient email are intentionally excluded
      metadata: {
        gift_id: gift.id,
        bloom_id: bloom.id,
        creator_ref: req.cookies.get('df_ref')?.value ?? '',
      },

      ...(automaticTaxEnabled ? { automatic_tax: { enabled: true } } : {}),
    });

    if (!session.client_secret) {
      console.error('[checkout] Stripe session missing client_secret');
      return NextResponse.json({ error: 'Payment session could not be created.' }, { status: 500 });
    }

    // ── Update gift to checkout_created ─────────────────────────────────
    await supabase
      .from('gifts')
      .update({
        stripe_checkout_session_id: session.id,
        status: 'checkout_created',
      })
      .eq('id', gift.id);

    // Return only what the browser needs — never log or expose private data
    return NextResponse.json({ clientSecret: session.client_secret });

  } catch (err) {
    // Log message only — never log private_message or email addresses
    console.error('[checkout] error:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json({ error: 'Payment setup failed.' }, { status: 500 });
  }
}
