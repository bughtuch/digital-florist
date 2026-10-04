import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return { title: `${t('about')} — DIGITAL FLORIST` };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'placeholderPage' });

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-[9px] tracking-[0.2em] text-df-faint uppercase mb-6">
            About
          </p>
          <p className="font-display text-[clamp(2rem,4vw,3.5rem)] font-light text-df-muted">
            {t('coming')}
          </p>
        </div>
      </main>
      <Footer locale={locale} />
    </div>
  );
}
