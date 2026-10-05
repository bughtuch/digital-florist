// src/app/studio/email-preview/page.tsx
//
// Studio-admin-only email template preview.
// Uses safe example data — never reads real Gift records.
// Never sends email. Never creates delivery records.

import { redirect } from 'next/navigation';
import { render } from '@react-email/components';
import { createClient } from '@/lib/supabase/server';
import RecipientBloomEmail from '@/emails/RecipientBloomEmail';
import SenderConfirmationEmail from '@/emails/SenderConfirmationEmail';
import type { EmailLocale } from '@/emails/email-i18n';

export const dynamic = 'force-dynamic';

// ── Safe example data — no real customer information ──────────────────────

const EXAMPLE_LOCALE: EmailLocale = 'en';
const EXAMPLE_REVEAL_URL = 'https://digitalflorist.com/en/reveal/example-preview-token';

const EXAMPLE_RECIPIENT_PROPS = {
  senderName: 'Lee',
  revealUrl: EXAMPLE_REVEAL_URL,
  locale: EXAMPLE_LOCALE,
};

const EXAMPLE_SENDER_PROPS = {
  bloomTitle: 'Black Calla',
  archiveCode: '001',
  cityName: 'London',
  cityCode: 'LON',
  editionNumber: 19,
  editionTotal: 250,
  recipientName: 'Maya',
  locale: EXAMPLE_LOCALE,
};

const LOCALES: EmailLocale[] = ['en', 'ar', 'it', 'ko', 'ja'];

type SearchParams = Promise<{ template?: string; locale?: string }>;

interface EmailPreviewPageProps {
  searchParams: SearchParams;
}

export default async function EmailPreviewPage({ searchParams }: EmailPreviewPageProps) {
  // ── Guard: Studio admin only ──────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/studio/sign-in');
  const { data: isAdmin } = await supabase.rpc('is_studio_admin');
  if (!isAdmin) redirect('/studio/sign-in');

  // ── Parameters ────────────────────────────────────────────────────────────
  const { template = 'recipient', locale = 'en' } = await searchParams;
  const safeLocale: EmailLocale = LOCALES.includes(locale as EmailLocale)
    ? (locale as EmailLocale)
    : 'en';

  // ── Render selected template ───────────────────────────────────────────────
  const html =
    template === 'recipient'
      ? await render(RecipientBloomEmail({ ...EXAMPLE_RECIPIENT_PROPS, locale: safeLocale }))
      : await render(SenderConfirmationEmail({ ...EXAMPLE_SENDER_PROPS, locale: safeLocale }));

  return (
    <div className="min-h-screen bg-df-black pt-16">
      <div className="px-8 py-10 max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[9px] tracking-[0.28em] text-df-faint uppercase mb-2">
            Studio · Email Preview
          </p>
          <p className="text-[9px] tracking-[0.16em] text-df-faint italic">
            Example data only. No real Gifts. No email sent.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-6 mb-10">
          <div className="flex gap-3 items-center">
            <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase">Template</span>
            {['recipient', 'sender'].map((t) => (
              <a
                key={t}
                href={`/studio/email-preview?template=${t}&locale=${safeLocale}`}
                className={`text-[9px] tracking-[0.18em] uppercase transition-colors duration-200 ${
                  template === t ? 'text-df-text' : 'text-df-faint hover:text-df-muted'
                }`}
              >
                {t === 'recipient' ? 'Recipient Bloom' : 'Sender Confirmation'}
              </a>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase">Locale</span>
            {LOCALES.map((l) => (
              <a
                key={l}
                href={`/studio/email-preview?template=${template}&locale=${l}`}
                className={`text-[9px] tracking-[0.14em] uppercase font-mono transition-colors duration-200 ${
                  safeLocale === l ? 'text-df-text' : 'text-df-faint hover:text-df-muted'
                }`}
              >
                {l}
              </a>
            ))}
          </div>
        </div>

        {/* Rendered email preview */}
        <div className="border border-df-border overflow-hidden">
          <div className="bg-df-surface px-4 py-2 border-b border-df-border flex items-center gap-3">
            <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase">
              {template === 'recipient' ? 'Recipient Bloom Email' : 'Sender Confirmation Email'}
            </span>
            <span className="text-df-faint text-[9px]">·</span>
            <span className="text-[9px] tracking-[0.12em] text-df-faint uppercase font-mono">
              {safeLocale}
            </span>
          </div>
          <iframe
            srcDoc={html}
            title="Email preview"
            className="w-full"
            style={{ height: '700px', border: 'none', background: '#fff' }}
            sandbox="allow-same-origin"
          />
        </div>

      </div>
    </div>
  );
}
