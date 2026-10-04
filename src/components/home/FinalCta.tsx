import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = { locale: string };

export default function FinalCta({ locale }: Props) {
  const t = useTranslations('finalCta');

  return (
    <section
      aria-label="Final call to action"
      className="border-t border-df-border bg-df-surface py-28 md:py-48"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col items-center px-6 text-center md:px-10 lg:px-16">

        <p className="
          font-display font-light leading-[1.05]
          text-[clamp(2.2rem,5.5vw,5rem)]
          tracking-[-0.01em] text-df-text
          max-w-[14ch]
        ">
          {t('statement')}
        </p>

        <div className="mt-14">
          <Link
            href={`/${locale}/gallery`}
            className="
              inline-block border border-df-muted px-10 py-4
              text-[11px] tracking-[0.18em] text-df-muted uppercase
              transition-all duration-500
              hover:border-df-text hover:text-df-text
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-df-text
            "
          >
            {t('cta')}
          </Link>
        </div>

      </div>
    </section>
  );
}
