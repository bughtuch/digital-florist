// src/emails/email-i18n.ts
//
// Minimal copy translations for transactional emails.
// House interface strings only — sender names, Bloom titles, and
// archive codes are passed through as-is (never translated here).

export type EmailLocale = 'en' | 'ar' | 'it' | 'ko' | 'ja';

export interface EmailCopy {
  // Recipient email
  recipientSubject: (senderName: string) => string;
  recipientPreheader: string;
  aBloomFrom: string;
  recipientBody: (senderName: string) => string;
  openBloom: string;
  tagline: string;
  // Sender email
  senderSubject: string;
  yourBloomIsReady: string;
  edition: string;
  forLabel: string;
  sentPrivately: string;
  // Shared
  cities: string;
  dir: 'ltr' | 'rtl';
  lang: string;
}

export const EMAIL_COPY: Record<EmailLocale, EmailCopy> = {
  en: {
    recipientSubject: (n) => `${n} sent you a Digital Bloom`,
    recipientPreheader: 'A private Bloom is waiting for you.',
    aBloomFrom: 'A BLOOM FROM',
    recipientBody: (n) => `${n} sent you a Digital Bloom.`,
    openBloom: 'OPEN BLOOM',
    tagline: 'A flower that lives in code.',
    senderSubject: 'Your Digital Bloom is ready',
    yourBloomIsReady: 'YOUR BLOOM IS READY.',
    edition: 'EDITION',
    forLabel: 'FOR',
    sentPrivately: 'Sent privately.',
    cities: 'LONDON · DUBAI · MILANO · SEOUL · TOKYO',
    dir: 'ltr',
    lang: 'en',
  },
  ar: {
    recipientSubject: (n) => `${n} أرسل لك زهرة رقمية`,
    recipientPreheader: 'زهرة خاصة في انتظارك.',
    aBloomFrom: 'زهرة من',
    recipientBody: (n) => `أرسل لك ${n} زهرة رقمية.`,
    openBloom: 'افتح الزهرة',
    tagline: 'زهرة تعيش في الكود.',
    senderSubject: 'زهرتك الرقمية جاهزة',
    yourBloomIsReady: 'زهرتك جاهزة.',
    edition: 'الإصدار',
    forLabel: 'إلى',
    sentPrivately: 'أُرسلت بشكل خاص.',
    cities: 'لندن · دبي · ميلانو · سيول · طوكيو',
    dir: 'rtl',
    lang: 'ar',
  },
  it: {
    recipientSubject: (n) => `${n} ti ha inviato un Digital Bloom`,
    recipientPreheader: 'Un Bloom privato ti aspetta.',
    aBloomFrom: 'UN BLOOM DA',
    recipientBody: (n) => `${n} ti ha inviato un Digital Bloom.`,
    openBloom: 'APRI IL BLOOM',
    tagline: 'Un fiore che vive nel codice.',
    senderSubject: 'Il tuo Digital Bloom è pronto',
    yourBloomIsReady: 'IL TUO BLOOM È PRONTO.',
    edition: 'EDIZIONE',
    forLabel: 'PER',
    sentPrivately: 'Inviato privatamente.',
    cities: 'LONDRA · DUBAI · MILANO · SEUL · TOKYO',
    dir: 'ltr',
    lang: 'it',
  },
  ko: {
    recipientSubject: (n) => `${n}님이 디지털 블룸을 보냈습니다`,
    recipientPreheader: '나만의 블룸이 기다리고 있습니다.',
    aBloomFrom: '블룸을 보낸 분',
    recipientBody: (n) => `${n}님이 디지털 블룸을 보냈습니다.`,
    openBloom: '블룸 열기',
    tagline: '코드 속에 사는 꽃.',
    senderSubject: '디지털 블룸이 준비되었습니다',
    yourBloomIsReady: '블룸이 준비되었습니다.',
    edition: '에디션',
    forLabel: '받는 분',
    sentPrivately: '비공개로 전송되었습니다.',
    cities: '런던 · 두바이 · 밀라노 · 서울 · 도쿄',
    dir: 'ltr',
    lang: 'ko',
  },
  ja: {
    recipientSubject: (n) => `${n}さんからデジタルブルームが届いています`,
    recipientPreheader: 'あなただけのブルームが待っています。',
    aBloomFrom: 'ブルームの贈り主',
    recipientBody: (n) => `${n}さんがデジタルブルームを送りました。`,
    openBloom: 'ブルームを開く',
    tagline: 'コードの中に生きる花。',
    senderSubject: 'デジタルブルームの準備ができました',
    yourBloomIsReady: 'ブルームの準備ができました。',
    edition: 'エディション',
    forLabel: '宛先',
    sentPrivately: 'プライベートに送信されました。',
    cities: 'ロンドン · ドバイ · ミラノ · ソウル · 東京',
    dir: 'ltr',
    lang: 'ja',
  },
};

export function getEmailCopy(locale: string): EmailCopy {
  return EMAIL_COPY[(locale as EmailLocale) in EMAIL_COPY ? (locale as EmailLocale) : 'en'];
}

/**
 * Strips CR, LF, NUL, and other control characters from a string
 * that will appear in an email subject line or header.
 * Does NOT modify the stored original — only the derived header value.
 */
export function sanitizeHeader(value: string, maxLength = 200): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\r\n\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ').trim().slice(0, maxLength);
}

/** Basic email address format validation. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}
