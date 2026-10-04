import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { routing } from '@/i18n/routing';

type Props = { locale: string };

const localeCodes: Record<string, string> = {
  en: 'EN',
  ar: 'AR',
  it: 'IT',
  ko: 'KO',
  ja: 'JA',
};

export default function Footer({ locale }: Props) {
  const t = useTranslations('footer');
  const tLang = useTranslations('languages');
  const tNav = useTranslations('nav');

  return (
    <footer className="border-t border-df-border bg-df-black">
      <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 lg:px-16">

        {/* Top row */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">

          {/* Brand */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px] tracking-[0.18em] text-df-text uppercase">
              DIGITAL FLORIST
            </span>
            <span className="text-[11px] tracking-[0.06em] text-df-muted">
              {t('tagline')}
            </span>
          </div>

          {/* Archive link + cities */}
          <div className="flex flex-col gap-3 items-end">
            <Link
              href={`/${locale}/archive`}
              className="text-[9px] tracking-[0.2em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
            >
              {tNav('archive')} →
            </Link>
            <p className="text-[11px] tracking-[0.08em] text-df-faint">
              {t('cities')}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-14 border-t border-df-border" />

        {/* Bottom row */}
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          {/* Language switcher */}
          <nav className="flex flex-wrap gap-5" aria-label="Language switcher">
            {routing.locales.map((loc) => (
              <Link
                key={loc}
                href={`/${loc}`}
                aria-label={tLang(loc)}
                className={`text-[11px] tracking-[0.1em] transition-colors duration-300 ${
                  loc === locale ? 'text-df-text' : 'text-df-faint hover:text-df-muted'
                }`}
              >
                {localeCodes[loc]}
              </Link>
            ))}
          </nav>

          {/* Legal */}
          <div className="flex items-center gap-6">
            <Link
              href={`/${locale}/privacy`}
              className="text-[10px] tracking-[0.08em] text-df-faint hover:text-df-muted transition-colors duration-300"
            >
              {t('legal.privacy')}
            </Link>
            <Link
              href={`/${locale}/terms`}
              className="text-[10px] tracking-[0.08em] text-df-faint hover:text-df-muted transition-colors duration-300"
            >
              {t('legal.terms')}
            </Link>
            <span className="text-[10px] tracking-[0.06em] text-df-faint">
              © {new Date().getFullYear()} DIGITAL FLORIST — {t('legal.rights')}
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
