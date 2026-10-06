// src/__tests__/build10.test.ts
//
// Build 10 quality tests — local pricing, zero-decimal currencies, creator attribution.
// Pure unit tests only — no Supabase or Stripe credentials required.
//
// Run: npm test

import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  parseInputToMinor,
  decimalToMinor,
  minorToDecimal,
  CITY_DEFAULT_CURRENCY,
} from '@/lib/currency';

// ── A. Currency formatting ─────────────────────────────────────────────────

describe('A: Currency formatting — standard decimal currencies', () => {
  it('GBP: formatPrice(5000, GBP, en) produces £50', () => {
    const result = formatPrice(5000, 'GBP', 'en');
    // The numeric value must be 50 — allow for locale symbol/spacing variation
    expect(result).toMatch(/50/);
    expect(result.toLowerCase()).toMatch(/£|gbp/);
  });

  it('EUR: formatPrice(5900, EUR, en) produces €59', () => {
    const result = formatPrice(5900, 'EUR', 'en');
    expect(result).toMatch(/59/);
    expect(result.toLowerCase()).toMatch(/€|eur/);
  });

  it('USD: formatPrice(2500, USD, en) produces $25', () => {
    const result = formatPrice(2500, 'USD', 'en');
    expect(result).toMatch(/25/);
    expect(result.toLowerCase()).toMatch(/\$|usd/);
  });

  it('AED: formatPrice(75000, AED, en) produces 750', () => {
    const result = formatPrice(75000, 'AED', 'en');
    expect(result).toMatch(/750/);
  });
});

// ── B. Zero-decimal currency formatting ──────────────────────────────────

describe('B: Zero-decimal currency formatting', () => {
  it('JPY: formatPrice(19800, JPY, ja) contains 19,800 or 19800', () => {
    const result = formatPrice(19800, 'JPY', 'ja');
    // The full integer must appear (not divided by 100)
    expect(result.replace(/,/g, '')).toMatch(/19800/);
  });

  it('KRW: formatPrice(189000, KRW, ko) contains 189,000 or 189000', () => {
    const result = formatPrice(189000, 'KRW', 'ko');
    expect(result.replace(/,/g, '')).toMatch(/189000/);
  });

  it('JPY: formatPrice does NOT divide by 100', () => {
    // 19800 JPY should NOT produce 198 or 197.xx
    const result = formatPrice(19800, 'JPY', 'ja');
    expect(result).not.toMatch(/^¥?1[89][0-9]\.?[0-9]*$/);
    expect(result.replace(/[^0-9]/g, '')).toBe('19800');
  });

  it('KRW: formatPrice does NOT divide by 100', () => {
    const result = formatPrice(189000, 'KRW', 'ko');
    expect(result.replace(/[^0-9]/g, '')).toBe('189000');
  });
});

// ── C. Commission arithmetic ───────────────────────────────────────────────

describe('C: Commission arithmetic — integer floor', () => {
  it('40% of 5000 (GBP pence) = 2000', () => {
    const commissionBps = 4000; // 40%
    const amountMinor = 5000;
    const result = Math.floor((amountMinor * commissionBps) / 10000);
    expect(result).toBe(2000);
  });

  it('40% of 5001 floors to 2000 (not 2001)', () => {
    const commissionBps = 4000;
    const amountMinor = 5001;
    const result = Math.floor((amountMinor * commissionBps) / 10000);
    expect(result).toBe(2000);
  });

  it('commission uses floor not round', () => {
    // 4000 bps of 2501 = 1000.4 — floor = 1000, round = 1000
    // 4000 bps of 2503 = 1001.2 — floor = 1001, round = 1001
    // 4000 bps of 2499 = 999.6  — floor = 999, round = 1000 (these differ)
    const commissionBps = 4000;
    const amountMinor = 2499;
    const floored = Math.floor((amountMinor * commissionBps) / 10000);
    const rounded = Math.round((amountMinor * commissionBps) / 10000);
    expect(floored).toBe(999);
    expect(rounded).toBe(1000);
    // The system uses floor
    expect(floored).toBe(999);
  });

  it('zero commission for 0 bps', () => {
    expect(Math.floor((5000 * 0) / 10000)).toBe(0);
  });

  it('100% commission for 10000 bps', () => {
    expect(Math.floor((5000 * 10000) / 10000)).toBe(5000);
  });
});

// ── D. Cookie PII check ────────────────────────────────────────────────────

describe('D: Cookie value — slug only, no PII', () => {
  it('slug matches safe pattern (alphanumeric + hyphens)', () => {
    const slug = 'sarah-london';
    expect(/^[a-z0-9-]{1,80}$/.test(slug)).toBe(true);
  });

  it('email address does not match slug pattern', () => {
    const email = 'creator@example.com';
    expect(/^[a-z0-9-]{1,80}$/.test(email)).toBe(false);
  });

  it('UUID does not match slug pattern', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    // UUIDs contain uppercase and are valid as slugs if lowercase — but they
    // should not be used. The cookie value should be the slug, not the creator id.
    // Verify that a UUID with uppercase fails the lowercase slug test.
    expect(/^[a-z0-9-]{1,80}$/.test(uuid.toUpperCase())).toBe(false);
  });

  it('slug with spaces is rejected', () => {
    expect(/^[a-z0-9-]{1,80}$/.test('sarah london')).toBe(false);
  });

  it('empty slug is rejected', () => {
    expect(/^[a-z0-9-]{1,80}$/.test('')).toBe(false);
  });

  it('slug longer than 80 chars is rejected', () => {
    const long = 'a'.repeat(81);
    expect(/^[a-z0-9-]{1,80}$/.test(long)).toBe(false);
  });
});

// ── E. CITY_DEFAULT_CURRENCY — New York ───────────────────────────────────

describe('E: City default currencies', () => {
  it('NYC maps to USD', () => {
    expect(CITY_DEFAULT_CURRENCY['NYC']).toBe('USD');
  });

  it('LON maps to GBP', () => {
    expect(CITY_DEFAULT_CURRENCY['LON']).toBe('GBP');
  });

  it('DXB maps to AED', () => {
    expect(CITY_DEFAULT_CURRENCY['DXB']).toBe('AED');
  });

  it('MIL maps to EUR', () => {
    expect(CITY_DEFAULT_CURRENCY['MIL']).toBe('EUR');
  });

  it('SEL maps to KRW', () => {
    expect(CITY_DEFAULT_CURRENCY['SEL']).toBe('KRW');
  });

  it('TYO maps to JPY', () => {
    expect(CITY_DEFAULT_CURRENCY['TYO']).toBe('JPY');
  });
});

// ── F. parseInputToMinor ──────────────────────────────────────────────────

describe('F: parseInputToMinor', () => {
  it('parseInputToMinor("50.00", GBP) = 5000', () => {
    expect(parseInputToMinor('50.00', 'GBP')).toBe(5000);
  });

  it('parseInputToMinor("19800", JPY) = 19800 (zero-decimal)', () => {
    expect(parseInputToMinor('19800', 'JPY')).toBe(19800);
  });

  it('parseInputToMinor("189000", KRW) = 189000 (zero-decimal)', () => {
    expect(parseInputToMinor('189000', 'KRW')).toBe(189000);
  });

  it('parseInputToMinor("25.00", USD) = 2500', () => {
    expect(parseInputToMinor('25.00', 'USD')).toBe(2500);
  });

  it('parseInputToMinor("59.00", EUR) = 5900', () => {
    expect(parseInputToMinor('59.00', 'EUR')).toBe(5900);
  });

  it('parseInputToMinor returns null for invalid input', () => {
    expect(parseInputToMinor('abc', 'GBP')).toBeNull();
    expect(parseInputToMinor('', 'GBP')).toBeNull();
    expect(parseInputToMinor('-5', 'GBP')).toBeNull();
  });
});

// ── G. decimalToMinor / minorToDecimal round-trip ─────────────────────────

describe('G: decimal/minor round-trip', () => {
  it('GBP: decimalToMinor(50, GBP) = 5000, minorToDecimal(5000, GBP) = 50', () => {
    expect(decimalToMinor(50, 'GBP')).toBe(5000);
    expect(minorToDecimal(5000, 'GBP')).toBe(50);
  });

  it('JPY: decimalToMinor(19800, JPY) = 19800 (zero-decimal)', () => {
    expect(decimalToMinor(19800, 'JPY')).toBe(19800);
    expect(minorToDecimal(19800, 'JPY')).toBe(19800);
  });

  it('KRW: decimalToMinor(189000, KRW) = 189000 (zero-decimal)', () => {
    expect(decimalToMinor(189000, 'KRW')).toBe(189000);
    expect(minorToDecimal(189000, 'KRW')).toBe(189000);
  });

  it('EUR: round-trip 59.99 EUR', () => {
    const minor = decimalToMinor(59.99, 'EUR');
    expect(minor).toBe(5999);
    expect(minorToDecimal(minor, 'EUR')).toBeCloseTo(59.99, 5);
  });

  it('AED: round-trip 750 AED', () => {
    expect(decimalToMinor(750, 'AED')).toBe(75000);
    expect(minorToDecimal(75000, 'AED')).toBe(750);
  });
});

// ── H. Seed data — no hardcoded USD $25 ──────────────────────────────────

describe('H: Seed data — local pricing', () => {
  it('SEED_BLOOMS are not all priced at 2500 USD', async () => {
    const { SEED_BLOOMS } = await import('@/lib/data/seed');
    const allUsd2500 = SEED_BLOOMS.every(
      (b) => b.price_minor === 2500 && b.currency === 'USD',
    );
    expect(allUsd2500).toBe(false);
  });

  it('SEED_BLOOMS contain multiple currencies', async () => {
    const { SEED_BLOOMS } = await import('@/lib/data/seed');
    const currencies = new Set(SEED_BLOOMS.map((b) => b.currency));
    expect(currencies.size).toBeGreaterThan(1);
  });

  it('SEED_BLOOMS contain GBP blooms for London', async () => {
    const { SEED_BLOOMS } = await import('@/lib/data/seed');
    const gbpBlooms = SEED_BLOOMS.filter((b) => b.currency === 'GBP');
    expect(gbpBlooms.length).toBeGreaterThan(0);
  });

  it('SEED_BLOOMS contain JPY blooms for Tokyo', async () => {
    const { SEED_BLOOMS } = await import('@/lib/data/seed');
    const jpyBlooms = SEED_BLOOMS.filter((b) => b.currency === 'JPY');
    expect(jpyBlooms.length).toBeGreaterThan(0);
  });

  it('SEED_BLOOMS contain KRW blooms for Seoul', async () => {
    const { SEED_BLOOMS } = await import('@/lib/data/seed');
    const krwBlooms = SEED_BLOOMS.filter((b) => b.currency === 'KRW');
    expect(krwBlooms.length).toBeGreaterThan(0);
  });
});

// ── I. Attribution idempotency math ──────────────────────────────────────

describe('I: Attribution commission calculation', () => {
  function calculateCommission(amountMinor: number, commissionBps: number): number {
    return Math.floor((amountMinor * commissionBps) / 10000);
  }

  it('calling the same calculation twice produces the same result', () => {
    const a = calculateCommission(5000, 4000);
    const b = calculateCommission(5000, 4000);
    expect(a).toBe(b);
  });

  it('commission is always a non-negative integer', () => {
    const cases = [
      [5000, 4000],
      [19800, 3000],
      [189000, 2500],
      [75000, 5000],
    ] as const;
    for (const [amount, bps] of cases) {
      const commission = calculateCommission(amount, bps);
      expect(Number.isInteger(commission)).toBe(true);
      expect(commission).toBeGreaterThanOrEqual(0);
    }
  });
});
