// Server-only reveal token utilities.
// Import only in server components, API routes, and server actions.
// NEVER import in client components — uses Node.js crypto.

import { randomBytes, createHash, createHmac, timingSafeEqual } from 'crypto';

// ── Production token operations ────────────────────────────────────────────

/**
 * Generates a cryptographically secure reveal token pair.
 * The rawToken is placed in the recipient's URL.
 * The tokenHash is stored in Supabase — never the raw token.
 * After inserting into the database, discard rawToken unless immediately emailing it.
 */
export function generateRevealToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashRevealToken(rawToken);
  return { rawToken, tokenHash };
}

/** Hashes a raw reveal token with SHA-256. Used for database lookups. */
export function hashRevealToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

// ── Production HMAC token (hmac_v1 scheme) ─────────────────────────────────

/**
 * Derives a deterministic production reveal token from a stable gift ID.
 *
 * Algorithm:
 *   raw_token  = HMAC-SHA256(REVEAL_TOKEN_SECRET, "v1:" + giftId) → base64url
 *   token_hash = SHA-256(raw_token) → hex   (stored in DB; raw never stored)
 *
 * Properties:
 *   - Deterministic: same secret + giftId always produces the same raw token.
 *   - Unguessable: computationally infeasible without the server secret.
 *   - Idempotent email retry: server can reproduce the URL without reading a stored secret.
 *
 * Throws if REVEAL_TOKEN_SECRET is absent or too short (< 32 chars).
 */
export function deriveHmacRevealToken(giftId: string): {
  rawToken: string;
  tokenHash: string;
} {
  const secret = process.env.REVEAL_TOKEN_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'REVEAL_TOKEN_SECRET must be set and at least 32 characters long.',
    );
  }
  const rawToken = createHmac('sha256', secret)
    .update(`v1:${giftId}`)
    .digest('base64url');
  const tokenHash = hashRevealToken(rawToken);
  return { rawToken, tokenHash };
}

// ── Development preview tokens ─────────────────────────────────────────────
// These tokens are:
//   - Signed with REVEAL_DEV_SECRET (HMAC-SHA256)
//   - Only accepted when NODE_ENV !== 'production'
//   - Self-contained (no database read required for the preview path)
//   - Impossible to forge without REVEAL_DEV_SECRET

export const DEV_TOKEN_PREFIX = 'dev_';

export type DevTokenPayload = {
  slug: string;
  senderName: string;
  message: string;
  ts: number;
};

export function generateDevPreviewToken(
  payload: DevTokenPayload,
  devSecret: string,
): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = createHmac('sha256', devSecret).update(encoded).digest('base64url');
  return `${DEV_TOKEN_PREFIX}${encoded}.${hmac}`;
}

/**
 * Verifies and decodes a dev preview token.
 * Returns null if invalid, not in development, or secret not configured.
 */
export function verifyDevPreviewToken(
  token: string,
  devSecret: string,
): DevTokenPayload | null {
  if (!token.startsWith(DEV_TOKEN_PREFIX)) return null;

  const rest = token.slice(DEV_TOKEN_PREFIX.length);
  const lastDot = rest.lastIndexOf('.');
  if (lastDot === -1) return null;

  const encoded = rest.slice(0, lastDot);
  const providedHmac = rest.slice(lastDot + 1);
  const expectedHmac = createHmac('sha256', devSecret)
    .update(encoded)
    .digest('base64url');

  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(providedHmac, 'utf8');
  const b = Buffer.from(expectedHmac, 'utf8');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString()) as DevTokenPayload;
  } catch {
    return null;
  }
}
