// src/lib/currency/index.ts
//
// Currency configuration and formatting utilities.
// Safe for both client and server — zero server imports.
//
// SUPPORTED CURRENCIES and their decimal precision:
//   GBP  2  (pence)
//   EUR  2  (cents)
//   USD  2  (cents)
//   AED  2  (fils)
//   JPY  0  (yen — zero-decimal, price_minor = display amount)
//   KRW  0  (won — zero-decimal, price_minor = display amount)
//
// IMPORTANT: Never manually divide all amounts by 100.
// Use minorToDecimal() and formatPrice() which are zero-decimal aware.

export const SUPPORTED_CURRENCIES = ['GBP', 'EUR', 'USD', 'AED', 'JPY', 'KRW'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** Decimal places for each supported currency. */
export const CURRENCY_DECIMALS: Record<SupportedCurrency, number> = {
  GBP: 2,
  EUR: 2,
  USD: 2,
  AED: 2,
  JPY: 0,
  KRW: 0,
};

/** Returns the number of decimal places for a currency code. Defaults to 2 for unknown. */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase() as SupportedCurrency] ?? 2;
}

/** Converts a price_minor integer to the decimal display amount. */
export function minorToDecimal(minor: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  if (decimals === 0) return minor;
  return minor / Math.pow(10, decimals);
}

/** Converts a decimal display amount to price_minor integer. */
export function decimalToMinor(amount: number, currency: string): number {
  const decimals = getCurrencyDecimals(currency);
  if (decimals === 0) return Math.round(amount);
  return Math.round(amount * Math.pow(10, decimals));
}

/**
 * Formats a price_minor value for display in a given locale.
 * Handles zero-decimal currencies (JPY, KRW) correctly — never divides by 100.
 *
 * Examples:
 *   formatPrice(5000, 'GBP', 'en')      → "£50"
 *   formatPrice(5900, 'EUR', 'it')      → "59 €"
 *   formatPrice(9900, 'USD', 'en')      → "$99"
 *   formatPrice(75000, 'AED', 'ar')     → "٧٥٠ د.إ."
 *   formatPrice(19800, 'JPY', 'ja')     → "¥19,800"
 *   formatPrice(189000, 'KRW', 'ko')    → "₩189,000"
 */
export function formatPrice(
  priceMinor: number,
  currency: string,
  locale = 'en',
): string {
  const decimals = getCurrencyDecimals(currency);
  const amount = decimals === 0 ? priceMinor : priceMinor / Math.pow(10, decimals);
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    // Fallback for unknown currencies or environments without Intl
    return `${currency.toUpperCase()} ${amount.toFixed(decimals)}`;
  }
}

/**
 * Formats a price for Studio UI — always uses 'en' locale for predictable House display.
 * Studio is a House admin tool; currency symbols are always Western.
 */
export function formatPriceStudio(priceMinor: number, currency: string): string {
  return formatPrice(priceMinor, currency, 'en');
}

/**
 * Parses a user-entered decimal string into price_minor.
 * Handles zero-decimal currencies (no fractional input expected).
 * Returns null if the input is not a valid positive number.
 */
export function parseInputToMinor(input: string, currency: string): number | null {
  const cleaned = input.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;
  const decimals = getCurrencyDecimals(currency);
  if (decimals === 0) return Math.round(num);
  return Math.round(num * Math.pow(10, decimals));
}

/** Default city currencies — matches cities table. */
export const CITY_DEFAULT_CURRENCY: Record<string, SupportedCurrency> = {
  LON: 'GBP',
  DXB: 'AED',
  MIL: 'EUR',
  SEL: 'KRW',
  TYO: 'JPY',
  NYC: 'USD',
};

export function isSupportedCurrency(c: string): c is SupportedCurrency {
  return SUPPORTED_CURRENCIES.includes(c.toUpperCase() as SupportedCurrency);
}
