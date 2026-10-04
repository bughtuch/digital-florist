import { useTranslations } from 'next-intl';

export default function CityOrigins() {
  const t = useTranslations('cityOrigins');
  const cities = t.raw('cities') as { code: string; name: string }[];

  return (
    <section
      aria-label="City origins"
      className="py-28 md:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">

        <p className="mb-20 text-[9px] tracking-[0.2em] text-df-faint uppercase">
          {t('heading')}
        </p>

        {/* City name list — full names in large editorial type */}
        <ul className="flex flex-col divide-y divide-df-border">
          {cities.map(({ code, name }) => (
            <li
              key={code}
              className="
                group flex items-baseline justify-between
                py-7 transition-colors duration-300
                hover:bg-df-surface-2
              "
            >
              <span className="
                font-display text-[clamp(2rem,5vw,4.5rem)]
                font-light tracking-[-0.01em] text-df-text
                transition-colors duration-300
              ">
                {name}
              </span>
              {/* Code as provenance metadata — stays subtle */}
              <span className="text-[10px] tracking-[0.14em] text-df-faint uppercase transition-colors duration-300 group-hover:text-df-muted">
                {code}
              </span>
            </li>
          ))}
        </ul>

      </div>
    </section>
  );
}
