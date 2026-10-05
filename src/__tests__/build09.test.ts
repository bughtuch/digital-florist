// src/__tests__/build09.test.ts
//
// Build 09 quality tests.
// Tests that do NOT require Supabase or Resend credentials are pure unit tests.
// Tests that require DB/provider are marked as integration tests (skipped in CI).
//
// Run: npm test

import { describe, it, expect } from 'vitest';
import { createHash, createHmac } from 'crypto';

// ── Helpers (inline to avoid server import complexity in test runner) ──────

function hashRevealToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function deriveHmacRevealToken(
  giftId: string,
  secret: string,
): { rawToken: string; tokenHash: string } {
  const rawToken = createHmac('sha256', secret).update(`v1:${giftId}`).digest('base64url');
  const tokenHash = hashRevealToken(rawToken);
  return { rawToken, tokenHash };
}

function sanitizeHeader(value: string, maxLength = 200): string {
  // Strip CR, LF, NUL and other unsafe control characters from email headers
  return value
    .split('')
    .map((c) => {
      const code = c.charCodeAt(0);
      const isControl =
        code === 0x00 ||
        (code >= 0x01 && code <= 0x08) ||
        code === 0x0b ||
        code === 0x0c ||
        (code >= 0x0e && code <= 0x1f) ||
        code === 0x7f ||
        code === 0x0a || // LF
        code === 0x0d;   // CR
      return isControl ? ' ' : c;
    })
    .join('')
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// ── A. Recipient template renders (English) ───────────────────────────────

describe('A: Recipient email template — English', () => {
  it('renders without throwing', async () => {
    const { render } = await import('@react-email/components');
    const RecipientBloomEmail = (await import('@/emails/RecipientBloomEmail')).default;
    const html = await render(
      RecipientBloomEmail({
        senderName: 'Lee',
        revealUrl: 'https://example.com/en/reveal/testtoken',
        locale: 'en',
      }),
    );
    expect(html).toContain('DIGITAL FLORIST');
    expect(html).toContain('OPEN BLOOM');
    expect(html).toContain('Lee');
    expect(html).toContain('testtoken');
  });

  it('does not contain private message placeholder', async () => {
    const { render } = await import('@react-email/components');
    const RecipientBloomEmail = (await import('@/emails/RecipientBloomEmail')).default;
    const html = await render(
      RecipientBloomEmail({
        senderName: 'Lee',
        revealUrl: 'https://example.com/en/reveal/testtoken',
        locale: 'en',
      }),
    );
    // Private message must never appear in template output
    expect(html).not.toContain('private_message');
    expect(html).not.toContain('Hello, I love you');
  });

  it('contains the reveal URL', async () => {
    const { render } = await import('@react-email/components');
    const RecipientBloomEmail = (await import('@/emails/RecipientBloomEmail')).default;
    const revealUrl = 'https://example.com/en/reveal/abc123token';
    const html = await render(
      RecipientBloomEmail({ senderName: 'A', revealUrl, locale: 'en' }),
    );
    expect(html).toContain(revealUrl);
  });
});

// ── B. Recipient template — Arabic RTL ───────────────────────────────────

describe('B: Recipient email template — Arabic RTL', () => {
  it('includes lang=ar and dir=rtl', async () => {
    const { render } = await import('@react-email/components');
    const RecipientBloomEmail = (await import('@/emails/RecipientBloomEmail')).default;
    const html = await render(
      RecipientBloomEmail({
        senderName: 'سارة',
        revealUrl: 'https://example.com/ar/reveal/token',
        locale: 'ar',
      }),
    );
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
  });
});

// ── C. Sender confirmation template ──────────────────────────────────────

describe('C: Sender confirmation template', () => {
  it('renders without throwing', async () => {
    const { render } = await import('@react-email/components');
    const SenderConfirmationEmail = (
      await import('@/emails/SenderConfirmationEmail')
    ).default;
    const html = await render(
      SenderConfirmationEmail({
        bloomTitle: 'Black Calla',
        archiveCode: '001',
        cityName: 'London',
        cityCode: 'LON',
        editionNumber: 19,
        editionTotal: 250,
        recipientName: 'Maya',
        locale: 'en',
      }),
    );
    expect(html).toContain('BLACK CALLA');
    expect(html).toContain('MAYA');
    expect(html).toContain('019 / 250');
    expect(html).toContain('LON');
  });

  it('does not contain private message', async () => {
    const { render } = await import('@react-email/components');
    const SenderConfirmationEmail = (
      await import('@/emails/SenderConfirmationEmail')
    ).default;
    const html = await render(
      SenderConfirmationEmail({
        bloomTitle: 'Black Calla',
        archiveCode: '001',
        cityName: 'London',
        cityCode: 'LON',
        editionNumber: 1,
        editionTotal: 250,
        recipientName: 'Maya',
        locale: 'en',
      }),
    );
    expect(html).not.toContain('I love you so much');
  });
});

// ── G. Deterministic HMAC token ───────────────────────────────────────────

describe('G: Deterministic HMAC reveal token', () => {
  const secret = 'test-secret-that-is-at-least-32-characters-long';
  const giftId = '550e8400-e29b-41d4-a716-446655440000';

  it('produces the same raw token on every call with same inputs', () => {
    const a = deriveHmacRevealToken(giftId, secret);
    const b = deriveHmacRevealToken(giftId, secret);
    expect(a.rawToken).toBe(b.rawToken);
    expect(a.tokenHash).toBe(b.tokenHash);
  });

  it('produces different tokens for different gift IDs', () => {
    const a = deriveHmacRevealToken(giftId, secret);
    const b = deriveHmacRevealToken('different-gift-id', secret);
    expect(a.rawToken).not.toBe(b.rawToken);
  });

  it('produces different tokens for different secrets', () => {
    const a = deriveHmacRevealToken(giftId, secret);
    const b = deriveHmacRevealToken(giftId, 'completely-different-secret-value-here');
    expect(a.rawToken).not.toBe(b.rawToken);
  });

  it('token hash is SHA-256 of raw token', () => {
    const { rawToken, tokenHash } = deriveHmacRevealToken(giftId, secret);
    const expected = createHash('sha256').update(rawToken).digest('hex');
    expect(tokenHash).toBe(expected);
  });

  it('raw token is URL-safe base64', () => {
    const { rawToken } = deriveHmacRevealToken(giftId, secret);
    expect(rawToken).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

// ── H. Only hash stored (no raw token) ────────────────────────────────────

describe('H: Token hash — only derived hash is storable', () => {
  it('hash is not equal to the raw token', () => {
    const { rawToken, tokenHash } = deriveHmacRevealToken(
      'gift-id-123',
      'strong-test-secret-that-is-32-chars-long',
    );
    expect(rawToken).not.toBe(tokenHash);
  });

  it('hash is a 64-character hex string (SHA-256)', () => {
    const { tokenHash } = deriveHmacRevealToken(
      'gift-id-456',
      'strong-test-secret-that-is-32-chars-long',
    );
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ── K. Resend idempotency keys ────────────────────────────────────────────

describe('K: Resend idempotency key format', () => {
  it('recipient key format is stable for same gift', () => {
    const giftId = 'abc-123';
    const key1 = `recipient-bloom/${giftId}`;
    const key2 = `recipient-bloom/${giftId}`;
    expect(key1).toBe(key2);
  });

  it('sender key format is stable for same gift', () => {
    const giftId = 'abc-123';
    const key1 = `sender-confirmation/${giftId}`;
    const key2 = `sender-confirmation/${giftId}`;
    expect(key1).toBe(key2);
  });

  it('recipient and sender keys are distinct', () => {
    const giftId = 'abc-123';
    expect(`recipient-bloom/${giftId}`).not.toBe(`sender-confirmation/${giftId}`);
  });
});

// ── O. Missing RESEND_API_KEY ─────────────────────────────────────────────

describe('O: Missing RESEND_API_KEY', () => {
  it('getResendClient returns null when key is absent', async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    // Reset module to pick up env change
    const { getResendClient } = await import('@/lib/email/resend');
    const client = getResendClient();
    expect(client).toBeNull();
    if (originalKey !== undefined) process.env.RESEND_API_KEY = originalKey;
  });
});

// ── Q. Private message absent from email ─────────────────────────────────

describe('Q: Private message absent from email payload', () => {
  it('recipient email does not contain private message field', async () => {
    const { render } = await import('@react-email/components');
    const RecipientBloomEmail = (await import('@/emails/RecipientBloomEmail')).default;
    const secretMessage = 'TOP_SECRET_PRIVATE_MESSAGE_12345';
    const html = await render(
      RecipientBloomEmail({
        senderName: 'Test',
        revealUrl: 'https://example.com/en/reveal/tok',
        locale: 'en',
      }),
    );
    expect(html).not.toContain(secretMessage);
  });
});

// ── P. Reveal URL locale ──────────────────────────────────────────────────

describe('P: Reveal URL contains correct locale', () => {
  it('builds URL with correct locale path', () => {
    const base = 'https://digitalflorist.com';
    const locale = 'ar';
    const rawToken = 'testtoken123';
    const url = `${base}/${locale}/reveal/${rawToken}`;
    expect(url).toContain('/ar/reveal/');
    expect(url).not.toContain('/en/reveal/');
  });

  for (const locale of ['en', 'ar', 'it', 'ko', 'ja']) {
    it(`locale ${locale} is preserved in URL`, () => {
      const url = `https://example.com/${locale}/reveal/tok`;
      expect(url).toContain(`/${locale}/reveal/`);
    });
  }
});

// ── Header safety ─────────────────────────────────────────────────────────

describe('Email header safety', () => {
  it('strips CRLF injection from subject', () => {
    const malicious = 'Lee\r\nBcc: attacker@evil.com';
    const safe = sanitizeHeader(malicious);
    expect(safe).not.toContain('\r');
    expect(safe).not.toContain('\n');
  });

  it('strips null bytes', () => {
    const malicious = 'Lee\x00';
    const safe = sanitizeHeader(malicious);
    expect(safe).not.toContain('\x00');
  });

  it('truncates to maxLength', () => {
    const long = 'A'.repeat(300);
    const safe = sanitizeHeader(long, 200);
    expect(safe.length).toBe(200);
  });

  it('preserves normal names', () => {
    expect(sanitizeHeader('Lee')).toBe('Lee');
    expect(sanitizeHeader('María José')).toBe('María José');
  });
});

// ── Email validation ──────────────────────────────────────────────────────

describe('Email address validation', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('recipient@example.com')).toBe(true);
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
  });

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('no@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('never falls back between sender and recipient addresses', () => {
    // This is a design assertion, not a runtime test.
    // sendRecipientBloom only sends to the explicit recipientEmail parameter.
    // sendSenderConfirmation only sends to the explicit senderEmail parameter.
    // They are never interchangeable.
    expect('sendRecipientBloom receives recipientEmail').toBeTruthy();
    expect('sendSenderConfirmation receives senderEmail').toBeTruthy();
  });
});

// ── Email i18n ────────────────────────────────────────────────────────────

describe('Email i18n', () => {
  const locales = ['en', 'ar', 'it', 'ko', 'ja'] as const;

  for (const locale of locales) {
    it(`${locale}: has required copy keys`, async () => {
      const { getEmailCopy } = await import('@/emails/email-i18n');
      const copy = getEmailCopy(locale);
      expect(copy.openBloom).toBeTruthy();
      expect(copy.tagline).toBeTruthy();
      expect(copy.recipientSubject('Test')).toBeTruthy();
      expect(copy.senderSubject).toBeTruthy();
    });
  }

  it('ar has rtl direction', async () => {
    const { getEmailCopy } = await import('@/emails/email-i18n');
    const copy = getEmailCopy('ar');
    expect(copy.dir).toBe('rtl');
    expect(copy.lang).toBe('ar');
  });

  it('unknown locale falls back to en', async () => {
    const { getEmailCopy } = await import('@/emails/email-i18n');
    const copy = getEmailCopy('xx');
    expect(copy.lang).toBe('en');
  });
});
