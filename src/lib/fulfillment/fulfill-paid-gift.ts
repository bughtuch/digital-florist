// src/lib/fulfillment/fulfill-paid-gift.ts
//
// Server-only. Never import in client components.
//
// fulfillPaidGift(giftId)
// ────────────────────────
// Central fulfilment orchestrator. Safe to call multiple times:
// every stage is idempotent. Calling twice must not:
//   - allocate a second edition
//   - create a duplicate City Receipt
//   - create a duplicate Reveal token row
//   - send duplicate emails
//
// Stage failures are isolated:
//   - A paid Gift remains paid even if email delivery fails.
//   - Edition allocation is the responsibility of finalize_paid_gift (Build 03).
//     fulfillPaidGift() verifies it exists but does not re-allocate.

import { createAdminClient } from '@/lib/supabase/admin';
import { ensureRevealTokenForGift, buildRevealUrl } from './ensure-reveal-token';
import { sendRecipientBloom } from '@/lib/email/send-recipient-bloom';
import { sendSenderConfirmation } from '@/lib/email/send-sender-confirmation';
import { createCreatorAttributionForGift } from './creator-attribution';

export type FulfillStage =
  | 'verify_gift'
  | 'ensure_city_receipt'
  | 'ensure_reveal_token'
  | 'send_recipient_email'
  | 'send_sender_email'
  | 'creator_attribution';

export type FulfillPaidGiftResult = {
  ok: boolean;
  giftId: string;
  stages: Partial<Record<FulfillStage, { ok: boolean; detail?: string }>>;
};

export async function fulfillPaidGift(
  giftId: string,
  creatorRef?: string | null,
): Promise<FulfillPaidGiftResult> {
  const supabase = createAdminClient();
  const stages: FulfillPaidGiftResult['stages'] = {};

  // ── STAGE 1: Verify Gift ─────────────────────────────────────────────────
  const { data: gift, error: giftError } = await supabase
    .from('gifts')
    .select(`
      id, status, edition_number, locale,
      sender_name, sender_email,
      recipient_name, recipient_email,
      bloom:blooms (
        id, title, archive_code, edition_total,
        city:cities ( name, code )
      )
    `)
    .eq('id', giftId)
    .maybeSingle();

  if (giftError || !gift) {
    stages.verify_gift = { ok: false, detail: giftError?.message ?? 'Gift not found.' };
    return { ok: false, giftId, stages };
  }
  if (gift.status !== 'paid') {
    stages.verify_gift = { ok: false, detail: `Gift is not paid (status: ${gift.status}).` };
    return { ok: false, giftId, stages };
  }
  if (!gift.edition_number) {
    stages.verify_gift = { ok: false, detail: 'Gift has no edition_number.' };
    return { ok: false, giftId, stages };
  }

  stages.verify_gift = { ok: true };

  // Extract nested relations safely
  const bloom = Array.isArray(gift.bloom) ? gift.bloom[0] : gift.bloom;
  const city = bloom ? (Array.isArray(bloom.city) ? bloom.city[0] : bloom.city) : null;

  // ── STAGE 2: Ensure City Receipt ─────────────────────────────────────────
  // ensure_city_receipt is idempotent and service_role only (Build 06).
  try {
    const { error: receiptError } = await supabase.rpc('ensure_city_receipt', {
      p_gift_id: giftId,
    });
    stages.ensure_city_receipt = receiptError
      ? { ok: false, detail: receiptError.message }
      : { ok: true };
  } catch (err: unknown) {
    stages.ensure_city_receipt = {
      ok: false,
      detail: err instanceof Error ? err.message : 'Receipt error',
    };
    // Non-fatal — continue fulfilment
  }

  // ── STAGE 3: Ensure Reveal Token ─────────────────────────────────────────
  const tokenResult = await ensureRevealTokenForGift(giftId);
  if (!tokenResult.ok) {
    stages.ensure_reveal_token = { ok: false, detail: tokenResult.reason };
    // Cannot send recipient email without a Reveal token.
    return { ok: false, giftId, stages };
  }
  stages.ensure_reveal_token = { ok: true };

  const locale = gift.locale ?? 'en';
  const revealUrl = buildRevealUrl(locale, tokenResult.rawToken);

  // ── STAGE 4: Send Recipient Email ────────────────────────────────────────
  // Raw token used only here to construct the URL; not logged.
  const recipientResult = await sendRecipientBloom(
    giftId,
    gift.recipient_email as string,
    gift.sender_name as string,
    revealUrl,
    locale,
  );
  stages.send_recipient_email = {
    ok: recipientResult.ok,
    detail: recipientResult.ok ? undefined : recipientResult.reason,
  };

  // ── STAGE 5: Send Sender Confirmation ───────────────────────────────────
  const senderResult = await sendSenderConfirmation(giftId, {
    senderEmail: gift.sender_email as string,
    bloomTitle: bloom?.title ?? '',
    archiveCode: bloom?.archive_code ?? '',
    cityName: city?.name ?? '',
    cityCode: city?.code ?? '',
    editionNumber: gift.edition_number,
    editionTotal: bloom?.edition_total ?? 0,
    recipientName: gift.recipient_name as string,
    locale,
  });
  stages.send_sender_email = {
    ok: senderResult.ok,
    detail: senderResult.ok ? undefined : senderResult.reason,
  };

  // ── STAGE 6: Creator Attribution ─────────────────────────────────────────
  if (creatorRef) {
    try {
      const attributionId = await createCreatorAttributionForGift(giftId, creatorRef);
      stages.creator_attribution = attributionId
        ? { ok: true, detail: attributionId }
        : { ok: false, detail: 'Attribution not created (creator inactive or not found)' };
    } catch (err: unknown) {
      stages.creator_attribution = {
        ok: false,
        detail: err instanceof Error ? err.message : 'Attribution error',
      };
      // Non-fatal — continue
    }
  }

  // Overall success: gift verified + token + at least recipient email sent
  const overallOk =
    stages.verify_gift?.ok === true &&
    stages.ensure_reveal_token?.ok === true &&
    stages.send_recipient_email?.ok === true;

  if (overallOk) {
    console.log(`[fulfillment] gift ${giftId} fulfilled successfully`);
  } else {
    console.log(
      `[fulfillment] gift ${giftId} fulfilment partial/failed:`,
      JSON.stringify(
        Object.fromEntries(
          Object.entries(stages).map(([k, v]) => [k, v?.ok ? 'ok' : v?.detail]),
        ),
      ),
    );
  }

  return { ok: overallOk, giftId, stages };
}
