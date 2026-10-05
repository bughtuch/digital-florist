// src/emails/RecipientBloomEmail.tsx
//
// Recipient transactional email — the private envelope.
//
// PRIVATE MESSAGE IS NOT INCLUDED.
// ARTWORK IS NOT INCLUDED.
//
// The email carries only: sender name, CTA link, House identity.
// Everything meaningful lives inside the Reveal experience.

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import { getEmailCopy, type EmailLocale } from './email-i18n';

export interface RecipientBloomEmailProps {
  senderName: string;
  revealUrl: string;
  locale: EmailLocale;
}

export default function RecipientBloomEmail({
  senderName,
  revealUrl,
  locale = 'en',
}: RecipientBloomEmailProps) {
  const c = getEmailCopy(locale);

  return (
    <Html lang={c.lang} dir={c.dir}>
      <Head />
      <Body style={body}>
        <Container style={container}>

          {/* Wordmark */}
          <Section style={section}>
            <Text style={wordmark}>DIGITAL FLORIST</Text>
          </Section>

          <Hr style={rule} />

          {/* From label */}
          <Section style={section}>
            <Text style={label}>{c.aBloomFrom}</Text>
            <Text style={senderNameStyle}>{senderName}</Text>
          </Section>

          {/* Body */}
          <Section style={section}>
            <Text style={bodyText}>{c.recipientBody(senderName)}</Text>
          </Section>

          {/* CTA */}
          <Section style={{ ...section, paddingTop: '32px', paddingBottom: '32px' }}>
            <Link href={revealUrl} style={cta}>
              {c.openBloom}
            </Link>
          </Section>

          <Hr style={rule} />

          {/* Tagline */}
          <Section style={section}>
            <Text style={taglineStyle}>{c.tagline}</Text>
          </Section>

          {/* Footer */}
          <Section style={section}>
            <Text style={footer}>DIGITAL FLORIST</Text>
            <Text style={footer}>{c.cities}</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
// Email-client-safe inline styles. No CSS grid, no web fonts required.
// Falls back gracefully to system fonts.

const body: React.CSSProperties = {
  backgroundColor: '#080706',
  fontFamily: 'Georgia, "Times New Roman", serif',
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '48px 32px',
};

const section: React.CSSProperties = {
  paddingTop: '16px',
  paddingBottom: '16px',
};

const wordmark: React.CSSProperties = {
  color: '#f2ede8',
  fontSize: '10px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  margin: 0,
};

const rule: React.CSSProperties = {
  borderColor: '#1a1917',
  margin: '8px 0',
};

const label: React.CSSProperties = {
  color: '#3d3a37',
  fontSize: '9px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  margin: '0 0 8px 0',
};

const senderNameStyle: React.CSSProperties = {
  color: '#f2ede8',
  fontSize: '28px',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontWeight: '300',
  letterSpacing: '0.04em',
  margin: 0,
};

const bodyText: React.CSSProperties = {
  color: '#6b6560',
  fontSize: '13px',
  letterSpacing: '0.04em',
  lineHeight: '1.7',
  margin: 0,
};

const cta: React.CSSProperties = {
  display: 'inline-block',
  color: '#f2ede8',
  backgroundColor: 'transparent',
  border: '1px solid #f2ede8',
  padding: '14px 32px',
  fontSize: '10px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  textDecoration: 'none',
};

const taglineStyle: React.CSSProperties = {
  color: '#3d3a37',
  fontSize: '10px',
  letterSpacing: '0.1em',
  fontStyle: 'italic',
  margin: 0,
};

const footer: React.CSSProperties = {
  color: '#3d3a37',
  fontSize: '8px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  margin: '2px 0',
};
