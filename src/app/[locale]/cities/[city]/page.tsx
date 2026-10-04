// /[locale]/cities/[city]
//
// City detail — editorial origin page for a single House city.
// Shows the city's Blooms in the current collection.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getCityBySlug, getBloomsByCity } from '@/lib/data/archive';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

type Props = {
  params: Promise<{ locale: string; city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return { title: 'DIGITAL FLORIST' };
  const t = await getTranslations({ locale, namespace: 'cityPages' });
  return {
    title: `${city.name} · ${t('houseLabel')} — DIGITAL FLORIST`,
    description: `${city.name} ${city.code} — ${t('houseLabel')}`,
  };
}

export default async function CityPage({ params }: Props) {
  const { locale, city: citySlug } = await params;

  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const t = await getTranslations({ locale, namespace: 'cityPages' });
  const tArchive = await getTranslations({ locale, namespace: 'archive' });

  const blooms = await getBloomsByCity(city.id);

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />

      <main className="mx-auto w-full max-w-[1400px] px-6 pt-32 pb-24 md:px-10 lg:px-16">

        {/* Back link */}
        <div className="mb-12">
          <Link
            href={`/${locale}/archive`}
            className="text-[9px] tracking-[0.2em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
          >
            {t('backToArchive')}
          </Link>
        </div>

        {/* City heading */}
        <div className="mb-20 md:mb-28">
          <p className="mb-3 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
            {city.code} · {t('houseLabel')}
          </p>
          <h1 className="font-display text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95] tracking-[0.01em] text-df-text">
            {city.name}
          </h1>
          {blooms.length > 0 && (
            <p className="mt-5 text-[10px] tracking-[0.18em] text-df-muted uppercase">
              {blooms.length} {t('bloomsInCity')}
            </p>
          )}
        </div>

        {/* Bloom grid */}
        {blooms.length > 0 ? (
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3 bg-df-border">
            {blooms.map((bloom) => (
              <Link
                key={bloom.id}
                href={`/${locale}/bloom/${bloom.slug}`}
                className="group block bg-df-black p-6 hover:bg-df-surface transition-colors duration-500"
              >
                {/* Artwork */}
                <div className="relative mb-5 aspect-[3/4] w-full overflow-hidden bg-df-surface">
                  {bloom.still_asset_url ? (
                    <img
                      src={bloom.still_asset_url}
                      alt={bloom.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] tracking-[0.2em] text-df-faint uppercase">
                        DIGITAL FLORIST
                      </span>
                    </div>
                  )}
                  {bloom.status === 'archived' && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[7px] tracking-[0.2em] text-df-faint uppercase border border-df-border px-2 py-1 bg-df-black">
                        ARCHIVED
                      </span>
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div>
                  <p className="text-[9px] tracking-[0.2em] text-df-faint uppercase mb-1">
                    {bloom.archive_code} · {tArchive('editionLabel')} {bloom.edition_total}
                  </p>
                  <p className="text-[13px] tracking-[0.08em] text-df-text uppercase">
                    {bloom.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-[clamp(1.5rem,4vw,3rem)] font-light text-df-muted">
              —
            </p>
          </div>
        )}

      </main>

      <Footer locale={locale} />
    </div>
  );
}
