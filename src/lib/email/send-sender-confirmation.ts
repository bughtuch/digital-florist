// src/lib/email/send-sender-confirmation.ts
//
// Server-only. Sends the sender confirmation email and persists delivery state.
// Never import in client code.

import { render } from '@react-email/components';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResendClient, getFromAddress, getReplyTo } from './resend';
import SenderConfirmationEmail from '@/emails/SenderConfirmationEmail';
import {
  getEmailCopy,
  sanitizeHeader,
  isValidEmail,
  type EmailLocale,
} from '@/emails/email-i18n';

export type SendSenderConfirmationResult =
  | { ok: true; messageId: string | null }
  | { ok: false; reason: string };

interface SenderConfirmationData {
  senderEmail: string;
  bloomTitle: string;
  archiveCode: string;
  cityName: string;
  cityCode: string;
  editionNumber: number;
  editionTotal: number;
  recipientName: string;
  locale: string;
}

export async function sendSenderConfirmation(
  giftId: string,
  data: SenderConfirmationData,
): Promise<SendSenderConfirmationResult> {
  const supabase = createAdminClient();
  const copy = getEmailCopy(data.locale);

  // ── Validate email address ───────────────────────────────────────────────
  if (!isValidEmail(data.senderEmail)) {
    return { ok: false, reason: 'invalid_sender_email' };
  }

  // ── Ensure delivery record and increment attempt counter ─────────────────
  const { data: existing } = await supabase
    .from('email_deliveries')
    .select('id, attempt_count')
    .eq('gift_id', giftId)
    .eq('kind', 'sender_confirmation')
    .maybeSingle();

  const attemptCount = (existing?.attempt_count ?? 0) + 1;

  if (existing) {
    await supabase
      .from('email_deliveries')
      .update({ attempt_count: attemptCount, last_attempt_at: new Date().toISOString() })
      .eq('gift_id', giftId)
      .eq('kind', 'sender_confirmation');
  } else {
    await supabase.from('email_deliveries').insert({
      gift_id: giftId,
      kind: 'sender_confirmation',
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
      .eq('kind', 'sender_confirmation');
    return { ok: false, reason: 'email_not_configured' };
  }

  // ── Render template ──────────────────────────────────────────────────────
  const subject = sanitizeHeader(copy.senderSubject);
  const html = await render(
    SenderConfirmationEmail({
      bloomTitle: data.bloomTitle,
      archiveCode: data.archiveCode,
      cityName: data.cityName,
      cityCode: data.cityCode,
      editionNumber: data.editionNumber,
      editionTotal: data.editionTotal,
      recipientName: data.recipientName,
      locale: data.locale as EmailLocale,
    }),
  );
  const text = buildPlaintext(data, copy);

  // ── Send via Resend ──────────────────────────────────────────────────────
  try {
    const replyTo = getReplyTo();
    const { data: result, error } = await resend.emails.send({
      from: getFromAddress(),
      to: [data.senderEmail],
      ...(replyTo ? { replyTo } : {}),
      subject,
      html,
      text,
      headers: { 'X-Entity-Ref-ID': `sender-confirmation/${giftId}` },
      tags: [{ name: 'type', value: 'sender_confirmation' }],
    });

    if (error) {
      const code = categorise(error.message);
      await supabase
        .from('email_deliveries')
        .update({ status: 'failed', last_error_code: code })
        .eq('gift_id', giftId)
        .eq('kind', 'sender_confirmation');
      return { ok: false, reason: code };
    }

    await supabase
      .from('email_deliveries')
      .update({
        status: 'sent',
        provider_message_id: result?.id ?? null,
        sent_at: new Date().toISOString(),
        last_error_code: null,
      })
      .eq('gift_id', giftId)
      .eq('kind', 'sender_confirmation');

    return { ok: true, messageId: result?.id ?? null };
  } catch (err: unknown) {
    const code = categorise(err instanceof Error ? err.message : 'unknown');
    await supabase
      .from('email_deliveries')
      .update({ status: 'failed', last_error_code: code })
      .eq('gift_id', giftId)
      .eq('kind', 'sender_confirmation');
    return { ok: false, reason: code };
  }
}

function buildPlaintext(
  data: SenderConfirmationData,
  copy: ReturnType<typeof getEmailCopy>,
): string {
  const editionLabel = `${String(data.editionNumber).padStart(3, '0')} / ${data.editionTotal}`;
  return [
    'DIGITAL FLORIST',
    '',
    copy.yourBloomIsReady,
    '',
    data.bloomTitle.toUpperCase(),
    '',
    data.cityName.toUpperCase(),
    `${data.cityCode} / ${data.archiveCode}`,
    '',
    copy.edition,
    editionLabel,
    '',
    copy.forLabel,
    data.recipientName.toUpperCase(),
    '',
    copy.sentPrivately,
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
