import { useTranslations } from 'next-intl';

export default function CityStrip() {
  const t = useTranslations('cityStrip');
  const cities = t.raw('cities') as string[];

  return (
    <section
      aria-label="Launch cities"
      className="border-y border-df-border py-6"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <ol className="flex flex-wrap items-center justify-between gap-y-3">
          {cities.map((city) => (
            <li key={city} className="text-center">
              <span className="text-[11px] tracking-[0.18em] text-df-text uppercase">
                {city}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
