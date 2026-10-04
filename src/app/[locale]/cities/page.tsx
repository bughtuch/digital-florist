// /[locale]/cities
//
// Five Cities — editorial index of the House launch cities.
// Links to individual city pages.

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getAllCities } from '@/lib/data/archive';
import { getAllBlooms } from '@/lib/data/blooms';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: `${t('cities')} — DIGITAL FLORIST`,
  };
}

export default async function CitiesPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'cityPages' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  const [cities, blooms] = await Promise.all([getAllCities(), getAllBlooms()]);

  const bloomCountByCity = new Map<string, number>();
  for (const bloom of blooms) {
    bloomCountByCity.set(bloom.city_id, (bloomCountByCity.get(bloom.city_id) ?? 0) + 1);
  }

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
            {tNav('cities')}
          </h1>
          <p className="mt-4 text-[10px] tracking-[0.18em] text-df-muted uppercase">
            {t('houseLabel')}
          </p>
        </div>

        {/* City list */}
        <div className="divide-y divide-df-border border-t border-df-border">
          {cities.map((city, i) => {
            const count = bloomCountByCity.get(city.id) ?? 0;
            return (
              <Link
                key={city.id}
                href={`/${locale}/cities/${city.slug}`}
                className="group flex items-baseline justify-between py-8 md:py-10 hover:bg-df-surface transition-colors duration-500 px-1"
              >
                <div className="flex items-baseline gap-6 md:gap-10">
                  <span className="text-[8px] tracking-[0.28em] text-df-faint uppercase w-8">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="font-display text-[clamp(2rem,5vw,4rem)] font-light leading-[1] tracking-[0.02em] text-df-text group-hover:text-df-muted transition-colors duration-300">
                    {city.name}
                  </span>
                  <span className="text-[8px] tracking-[0.24em] text-df-faint uppercase hidden sm:block">
                    {city.code}
                  </span>
                </div>
                {count > 0 && (
                  <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase">
                    {count} {t('bloomsInCity')}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Archive link */}
        <div className="mt-16 border-t border-df-border pt-10">
          <Link
            href={`/${locale}/archive`}
            className="text-[9px] tracking-[0.22em] text-df-faint hover:text-df-muted uppercase transition-colors duration-300"
          >
            {t('archiveLabel')} →
          </Link>
        </div>

      </main>

      <Footer locale={locale} />
    </div>
  );
}
