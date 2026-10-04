import { useTranslations } from 'next-intl';

export default function Permanence() {
  const t = useTranslations('permanence');

  return (
    <section
      aria-label="Kept Bloom"
      className="py-28 md:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">

        {/* Section label */}
        <p className="mb-16 text-[9px] tracking-[0.2em] text-df-faint uppercase">
          {t('label')}
        </p>

        <div className="flex flex-col gap-16 md:flex-row md:items-center md:gap-20 lg:gap-28">

          {/* Artwork placeholder */}
          <div
            className="w-full md:w-3/5 lg:w-1/2"
            aria-hidden="true"
          >
            <div className="bloom-orb-sm" />
          </div>

          {/* Metadata */}
          <div className="flex flex-col gap-5 md:w-2/5 lg:w-1/2">
            <h2 className="font-display text-[clamp(2rem,4.5vw,4rem)] font-light tracking-[-0.01em] text-df-text">
              {t('metadata.title')}
            </h2>

            <div className="mt-2 flex flex-col gap-2">
              <span className="text-[11px] tracking-[0.14em] text-df-muted">
                {t('metadata.city')}
              </span>
              <span className="text-[11px] tracking-[0.14em] text-df-muted">
                {t('metadata.edition')}
              </span>
            </div>

            <p className="mt-6 text-[11px] tracking-[0.18em] text-df-faint uppercase">
              {t('metadata.status')}
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
