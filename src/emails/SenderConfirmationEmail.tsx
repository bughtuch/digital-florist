// src/emails/SenderConfirmationEmail.tsx
//
// Sender confirmation — restrained House confirmation after a Gift is sent.
// Not an invoice. Bloom identity and recipient name only.
// No Stripe IDs, no payment details, no private message repeat.

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import { getEmailCopy, type EmailLocale } from './email-i18n';

export interface SenderConfirmationEmailProps {
  bloomTitle: string;
  archiveCode: string;
  cityName: string;
  cityCode: string;
  editionNumber: number;
  editionTotal: number;
  recipientName: string;
  locale: EmailLocale;
}

export default function SenderConfirmationEmail({
  bloomTitle,
  archiveCode,
  cityName,
  cityCode,
  editionNumber,
  editionTotal,
  recipientName,
  locale = 'en',
}: SenderConfirmationEmailProps) {
  const c = getEmailCopy(locale);
  const editionLabel = `${String(editionNumber).padStart(3, '0')} / ${editionTotal}`;
  const cityLine = `${cityCode} / ${archiveCode}`;

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

          {/* Heading */}
          <Section style={{ ...section, paddingTop: '32px' }}>
            <Text style={heading}>{c.yourBloomIsReady}</Text>
          </Section>

          {/* Bloom identity */}
          <Section style={section}>
            <Text style={bloomTitleStyle}>{bloomTitle.toUpperCase()}</Text>
          </Section>

          {/* City / archive code */}
          <Section style={metaSection}>
            <Text style={metaLabel}>{cityName.toUpperCase()}</Text>
            <Text style={metaValue}>{cityLine}</Text>
          </Section>

          {/* Edition */}
          <Section style={metaSection}>
            <Text style={metaLabel}>{c.edition}</Text>
            <Text style={metaValue}>{editionLabel}</Text>
          </Section>

          {/* Recipient */}
          <Section style={metaSection}>
            <Text style={metaLabel}>{c.forLabel}</Text>
            <Text style={metaValue}>{recipientName.toUpperCase()}</Text>
          </Section>

          <Hr style={rule} />

          {/* Sent message */}
          <Section style={section}>
            <Text style={sentText}>{c.sentPrivately}</Text>
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

const metaSection: React.CSSProperties = {
  paddingTop: '10px',
  paddingBottom: '10px',
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

const heading: React.CSSProperties = {
  color: '#f2ede8',
  fontSize: '13px',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  margin: 0,
};

const bloomTitleStyle: React.CSSProperties = {
  color: '#f2ede8',
  fontSize: '22px',
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontWeight: '300',
  letterSpacing: '0.06em',
  margin: 0,
};

const metaLabel: React.CSSProperties = {
  color: '#3d3a37',
  fontSize: '9px',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  margin: '0 0 3px 0',
};

const metaValue: React.CSSProperties = {
  color: '#6b6560',
  fontSize: '12px',
  letterSpacing: '0.08em',
  fontFamily: 'Courier New, Courier, monospace',
  margin: 0,
};

const sentText: React.CSSProperties = {
  color: '#6b6560',
  fontSize: '12px',
  letterSpacing: '0.08em',
  margin: 0,
};

const footer: React.CSSProperties = {
  color: '#3d3a37',
  fontSize: '8px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  margin: '2px 0',
};
