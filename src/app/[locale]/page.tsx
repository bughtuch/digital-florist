import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/home/Hero';
import CityStrip from '@/components/home/CityStrip';
import Manifesto from '@/components/home/Manifesto';
import Permanence from '@/components/home/Permanence';
import HowItWorks from '@/components/home/HowItWorks';
import CityOrigins from '@/components/home/CityOrigins';
import FinalCta from '@/components/home/FinalCta';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hero' });

  return {
    title: 'DIGITAL FLORIST',
    description: t('tagline'),
    openGraph: {
      title: 'DIGITAL FLORIST',
      description: t('tagline'),
      siteName: 'DIGITAL FLORIST',
    },
  };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />
      <main id="main-content">
        <Hero locale={locale} />
        <CityStrip />
        <Manifesto />
        <Permanence />
        <HowItWorks />
        <CityOrigins />
        <FinalCta locale={locale} />
      </main>
      <Footer locale={locale} />
    </div>
  );
}
