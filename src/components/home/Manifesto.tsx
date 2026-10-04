import { useTranslations } from 'next-intl';

export default function Manifesto() {
  const t = useTranslations('manifesto');

  return (
    <section
      aria-label="House manifesto"
      className="bg-df-surface py-28 md:py-40 lg:py-52"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <p
          className="
            font-display font-light leading-[1]
            text-df-text
            text-[clamp(3rem,9vw,9rem)]
            tracking-[-0.02em]
          "
          aria-label={`${t('line1')} ${t('line2')}`}
        >
          <span className="block">{t('line1')}</span>
          <span className="block">{t('line2')}</span>
        </p>
      </div>
    </section>
  );
}
