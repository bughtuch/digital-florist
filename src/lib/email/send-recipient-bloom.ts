// src/lib/email/send-recipient-bloom.ts
//
// Server-only. Sends the recipient Bloom email and persists delivery state.
// Never import in client code.
//
// Privacy guarantees:
//   - Raw Reveal token is never logged.
//   - Reveal URL is only placed inside the email body.
//   - Private message is never included anywhere.
//   - Provider tags contain only non-sensitive type identifiers.

import { render } from '@react-email/components';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResendClient, getFromAddress, getReplyTo } from './resend';
import RecipientBloomEmail from '@/emails/RecipientBloomEmail';
import {
  getEmailCopy,
  sanitizeHeader,
  isValidEmail,
  type EmailLocale,
} from '@/emails/email-i18n';

export type SendRecipientBloomResult =
  | { ok: true; messageId: string | null }
  | { ok: false; reason: string };

export async function sendRecipientBloom(
  giftId: string,
  recipientEmail: string,
  senderName: string,
  revealUrl: string,
  locale: string,
): Promise<SendRecipientBloomResult> {
  const supabase = createAdminClient();
  const safeSenderName = sanitizeHeader(senderName, 100);
  const copy = getEmailCopy(locale);

  // ── Validate email address ───────────────────────────────────────────────
  if (!isValidEmail(recipientEmail)) {
    return { ok: false, reason: 'invalid_recipient_email' };
  }

  // ── Ensure delivery record and increment attempt counter ─────────────────
  // Upsert creates the row on first call; subsequent calls update in place.
  const { data: existing } = await supabase
    .from('email_deliveries')
    .select('id, attempt_count')
    .eq('gift_id', giftId)
    .eq('kind', 'recipient_bloom')
    .maybeSingle();

  const attemptCount = (existing?.attempt_count ?? 0) + 1;

  if (existing) {
    await supabase
      .from('email_deliveries')
      .update({ attempt_count: attemptCount, last_attempt_at: new Date().toISOString() })
      .eq('gift_id', giftId)
      .eq('kind', 'recipient_bloom');
  } else {
    await supabase.from('email_deliveries').insert({
      gift_id: giftId,
      kind: 'recipient_bloom',
      status: 'pending',
      attempt_count: attemptCount,
      last_attempt_at: new Date().toISOString(),
    });
  }

  // ── Check provider availability ──────────────────────────────────────────
  const resend = getResendClient();
  if (!resend) {
    await supabase
      .from('email_deliveries')
      .update({ status: 'failed', last_error_code: 'email_not_configured' })
      .eq('gift_id', giftId)
      .eq('kind', 'recipient_bloom');
    return { ok: false, reason: 'email_not_configured' };
  }

  // ── Render template ──────────────────────────────────────────────────────
  const subject = sanitizeHeader(copy.recipientSubject(safeSenderName));
  const html = await render(
    RecipientBloomEmail({
      senderName: safeSenderName,
      revealUrl,
      locale: locale as EmailLocale,
    }),
  );
  const text = buildPlaintext(safeSenderName, revealUrl, copy);

  // ── Send via Resend ──────────────────────────────────────────────────────
  try {
    const replyTo = getReplyTo();
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [recipientEmail],
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
      text,
      // Stable idempotency marker per gift — prevents duplicate sends on provider retry
      headers: { 'X-Entity-Ref-ID': `recipient-bloom/${giftId}` },
      // Minimal non-sensitive tags — no personal data in provider metadata
      tags: [{ name: 'type', value: 'recipient_bloom' }],
    });

    if (error) {
      const code = categorise(error.message);
      await supabase
        .from('email_deliveries')
        .update({ status: 'failed', last_error_code: code })
        .eq('gift_id', giftId)
        .eq('kind', 'recipient_bloom');
      return { ok: false, reason: code };
    }

    await supabase
      .from('email_deliveries')
      .update({
        status: 'sent',
        provider_message_id: data?.id ?? null,
        sent_at: new Date().toISOString(),
        last_error_code: null,
      })
      .eq('gift_id', giftId)
      .eq('kind', 'recipient_bloom');

    return { ok: true, messageId: data?.id ?? null };
  } catch (err: unknown) {
    const code = categorise(err instanceof Error ? err.message : 'unknown');
    await supabase
      .from('email_deliveries')
      .update({ status: 'failed', last_error_code: code })
      .eq('gift_id', giftId)
      .eq('kind', 'recipient_bloom');
    return { ok: false, reason: code };
  }
}

function buildPlaintext(
  senderName: string,
  revealUrl: string,
  copy: ReturnType<typeof getEmailCopy>,
): string {
  return [
    'DIGITAL FLORIST',
    '',
    copy.aBloomFrom,
    '',
    senderName.toUpperCase(),
    '',
    copy.recipientBody(senderName),
    '',
    `${copy.openBloom}:`,
    revealUrl,
    '',
    copy.tagline,
    '',
    '— Digital Florist',
  ].join('\n');
}

function categorise(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate') || m.includes('limit')) return 'rate_limited';
  if (m.includes('invalid') && m.includes('email')) return 'invalid_recipient';
  if (m.includes('domain') || m.includes('sender')) return 'sender_domain_error';
  if (m.includes('network') || m.includes('timeout')) return 'network_error';
  return 'provider_error';
}
