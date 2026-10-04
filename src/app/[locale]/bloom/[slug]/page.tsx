import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BloomArtwork from '@/components/bloom/BloomArtwork';
import BloomInfo from '@/components/bloom/BloomInfo';
import { getBloomBySlug } from '@/lib/data/blooms';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const bloom = await getBloomBySlug(slug);
  if (!bloom) return { title: 'DIGITAL FLORIST' };

  const t = await getTranslations({ locale, namespace: 'bloom' });

  return {
    title: `${bloom.title} — DIGITAL FLORIST`,
    description: bloom.house_line ?? `${bloom.title}. ${bloom.city.name}. ${t('price')}.`,
    openGraph: {
      title: `${bloom.title} — DIGITAL FLORIST`,
      description: bloom.house_line ?? undefined,
    },
  };
}

export default async function BloomPage({ params }: Props) {
  const { locale, slug } = await params;

  let bloom;
  try {
    bloom = await getBloomBySlug(slug);
  } catch {
    // Supabase unavailable — show error rather than crashing
    return <BloomErrorState locale={locale} />;
  }

  if (!bloom) notFound();

  const t = await getTranslations({ locale, namespace: 'bloom' });

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />

      <main id="main-content" className="flex-1 pt-16">
        {/* Back link */}
        <div className="mx-auto max-w-[1400px] px-6 pt-10 md:px-10 lg:px-16">
          <Link
            href={`/${locale}/gallery`}
            className="text-[9px] tracking-[0.18em] text-df-faint hover:text-df-muted transition-colors duration-300 uppercase"
          >
            ← {t('backToGallery')}
          </Link>
        </div>

        {/* Main bloom layout */}
        <div className="mx-auto max-w-[1400px] px-6 py-12 md:px-10 lg:px-16">
          <div className="flex flex-col gap-12 md:flex-row md:gap-16 lg:gap-24">

            {/* Artwork — 2/3 width on desktop */}
            <div className="w-full md:w-[62%] lg:w-[65%]">
              <BloomArtwork bloom={bloom} />
            </div>

            {/* Info panel — sticky on desktop */}
            <div className="w-full md:w-[38%] lg:w-[35%] md:sticky md:top-24 md:self-start">
              <BloomInfo bloom={bloom} locale={locale} />
            </div>

          </div>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}

async function BloomErrorState({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'bloom' });
  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center px-6">
          <p className="text-[9px] tracking-[0.2em] text-df-faint uppercase mb-6">
            Unavailable
          </p>
          <p className="font-display text-[clamp(1.8rem,3vw,3rem)] font-light text-df-muted">
            This Bloom could not be loaded.
          </p>
          <Link
            href={`/${locale}/gallery`}
            className="mt-10 inline-block text-[11px] tracking-[0.14em] text-df-faint hover:text-df-muted transition-colors duration-300 uppercase"
          >
            ← {t('backToGallery')}
          </Link>
        </div>
      </main>
    </div>
  );
}
