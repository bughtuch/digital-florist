// /[locale]/archive
//
// House Archive — public, indexed cultural record of all published Blooms.
// Organised editorially by city. No ownership data exposed.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAllBlooms } from '@/lib/data/blooms';
import { getAllCities } from '@/lib/data/archive';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import type { BloomWithRelations, DbCity } from '@/types';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'archive' });
  return {
    title: `${t('heading')} — DIGITAL FLORIST`,
    description: t('subline'),
  };
}

export default async function ArchivePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'archive' });
  const tCity = await getTranslations({ locale, namespace: 'cityPages' });

  const [blooms, cities] = await Promise.all([getAllBlooms(), getAllCities()]);

  // Group blooms by city_id
  const bloomsByCity = new Map<string, BloomWithRelations[]>();
  for (const bloom of blooms) {
    const existing = bloomsByCity.get(bloom.city_id) ?? [];
    existing.push(bloom);
    bloomsByCity.set(bloom.city_id, existing);
  }

  // Keep only cities that have published blooms, in display_order
  const activeCities: DbCity[] = cities.filter((c) => (bloomsByCity.get(c.id)?.length ?? 0) > 0);

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />

      <main className="mx-auto w-full max-w-[1400px] px-6 pt-32 pb-24 md:px-10 lg:px-16">

        {/* Heading */}
        <div className="mb-20 md:mb-28">
          <p className="mb-3 text-[8px] tracking-[0.3em] text-df-faint uppercase select-none">
            DIGITAL FLORIST
          </p>
          <h1 className="font-display text-[clamp(2.5rem,7vw,5rem)] font-light leading-[1] tracking-[0.02em] text-df-text">
            {t('heading')}
          </h1>
          <p className="mt-4 text-[10px] tracking-[0.18em] text-df-muted uppercase">
            {t('subline')}
          </p>
        </div>

        {/* Cities */}
        {activeCities.map((city) => {
          const cityBlooms = bloomsByCity.get(city.id) ?? [];
          return (
            <section key={city.id} className="mb-20 md:mb-28">

              {/* City header */}
              <div className="mb-10 flex items-baseline justify-between border-b border-df-border pb-5">
                <div className="flex items-baseline gap-5">
                  <span className="text-[9px] tracking-[0.28em] text-df-faint uppercase">
                    {city.code}
                  </span>
                  <Link
                    href={`/${locale}/cities/${city.slug}`}
                    className="font-display text-[clamp(1.4rem,3vw,2.5rem)] font-light tracking-[0.02em] text-df-text hover:text-df-muted transition-colors duration-300"
                  >
                    {city.name}
                  </Link>
                </div>
                <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase">
                  {cityBlooms.length} {t('bloomsLabel')}
                </span>
              </div>

              {/* Bloom grid */}
              <div className="grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 bg-df-border">
                {cityBlooms.map((bloom) => (
                  <Link
                    key={bloom.id}
                    href={`/${locale}/bloom/${bloom.slug}`}
                    className="group block bg-df-black p-5 hover:bg-df-surface transition-colors duration-500"
                  >
                    {/* Artwork */}
                    <div className="relative mb-4 aspect-[3/4] w-full overflow-hidden bg-df-surface">
                      {bloom.still_asset_url ? (
                        <img
                          src={bloom.still_asset_url}
                          alt={bloom.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[7px] tracking-[0.2em] text-df-faint uppercase">
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
                      <p className="text-[8px] tracking-[0.2em] text-df-faint uppercase mb-1">
                        {bloom.archive_code}
                      </p>
                      <p className="text-[12px] tracking-[0.08em] text-df-text uppercase">
                        {bloom.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

            </section>
          );
        })}

        {/* Cities index link */}
        <div className="mt-8 border-t border-df-border pt-10">
          <Link
            href={`/${locale}/cities`}
            className="text-[9px] tracking-[0.22em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
          >
            {tCity('allCities')} →
          </Link>
        </div>

      </main>

      <Footer locale={locale} />
    </div>
  );
}
