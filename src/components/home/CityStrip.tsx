import { useTranslations } from 'next-intl';

export default function CityStrip() {
  const t = useTranslations('cityStrip');
  const cities = t.raw('cities') as string[];
  const codes = t.raw('codes') as string[];

  return (
    <section
      aria-label="Launch cities"
      className="border-y border-df-border py-6"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <ol className="flex flex-wrap items-center justify-between gap-y-4">
          {cities.map((city, i) => (
            <li key={codes[i]} className="flex flex-col items-center gap-1 text-center">
              <span className="text-[11px] tracking-[0.18em] text-df-muted uppercase">
                {city}
              </span>
              <span className="text-[9px] tracking-[0.14em] text-df-faint">
                {codes[i]}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
