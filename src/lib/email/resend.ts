// src/lib/email/resend.ts
//
// Server-only Resend client.
// Never import in client components.
//
// Returns null when RESEND_API_KEY is absent so callers can produce
// a safe 'email_not_configured' result rather than crashing.

import { Resend } from 'resend';

let _resend: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'Digital Florist <noreply@digitalflorist.com>';
}

export function getReplyTo(): string | undefined {
  return process.env.EMAIL_REPLY_TO ?? undefined;
}
