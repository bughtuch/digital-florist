import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import GalleryClient from '@/components/gallery/GalleryClient';
import { getAllBlooms, getAllCollections } from '@/lib/data/blooms';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ collection?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'gallery' });
  return {
    title: `${t('heading')} — DIGITAL FLORIST`,
    description: t('subline'),
    openGraph: { title: `${t('heading')} — DIGITAL FLORIST` },
  };
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { collection } = await searchParams;

  const [blooms, collections, t] = await Promise.all([
    getAllBlooms(),
    getAllCollections(),
    getTranslations({ locale, namespace: 'gallery' }),
  ]);

  const validSlugs = new Set(collections.map((c) => c.slug));
  const initialCollection =
    collection && validSlugs.has(collection) ? collection : null;

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />

      <main id="main-content" className="flex-1 pt-16">
        {/* Gallery header */}
        <div className="mx-auto max-w-[1400px] px-6 pt-20 pb-12 md:px-10 lg:px-16">
          <p className="text-[9px] tracking-[0.2em] text-df-faint uppercase mb-4">
            {t('subline')}
          </p>
          <h1 className="font-display text-[clamp(3rem,7vw,7rem)] font-light tracking-[-0.02em] text-df-text leading-none mb-14">
            {t('heading')}
          </h1>

          {/* Filters + grid — client island for instant filtering */}
          <Suspense fallback={<GalleryFallback />}>
            <GalleryClient
              blooms={blooms}
              collections={collections}
              locale={locale}
              initialCollection={initialCollection}
            />
          </Suspense>
        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}

function GalleryFallback() {
  return (
    <div className="mt-16 grid grid-cols-12 gap-4 md:gap-6" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="col-span-12 md:col-span-6 aspect-portrait bg-df-surface animate-pulse"
        />
      ))}
    </div>
  );
}
