import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = { locale: string };

export default function Hero({ locale }: Props) {
  const t = useTranslations('hero');

  // Split newlines from the body text
  const bodyLines = t('body').split('\n');

  return (
    <section
      aria-label="Hero"
      className="relative flex min-h-svh flex-col items-stretch pt-16"
    >
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-6 py-20 md:flex-row md:items-center md:gap-16 md:px-10 md:py-28 lg:px-16">

        {/* Text column */}
        <div className="flex flex-col justify-center md:w-1/2 md:max-w-[560px]">

          {/* Tagline — large display type */}
          <h1 className="font-display text-[clamp(2.6rem,6vw,5.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-df-text">
            {t('tagline')}
          </h1>

          {/* Supporting text */}
          <p className="mt-8 text-[clamp(0.8rem,1.2vw,0.95rem)] leading-[1.8] tracking-[0.04em] text-df-muted">
            {bodyLines.map((line, i) => (
              <span key={i} className={i > 0 ? 'block mt-1' : undefined}>
                {line}
              </span>
            ))}
          </p>

          {/* CTA — square-bordered, not rounded */}
          <div className="mt-12">
            <Link
              href={`/${locale}/gallery`}
              className="
                inline-block border border-df-text px-8 py-4
                text-[11px] tracking-[0.18em] text-df-text uppercase
                transition-all duration-500
                hover:bg-df-text hover:text-df-black
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-df-text
              "
            >
              {t('cta')}
            </Link>
          </div>
        </div>

        {/* Artwork placeholder column */}
        <div
          className="relative mt-16 flex items-center justify-center md:mt-0 md:w-1/2"
          aria-hidden="true"
        >
          {/* Outer halo ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="aspect-square w-[90%] max-w-[520px] rounded-full border border-df-border-subtle opacity-40" />
          </div>

          {/* The bloom orb — marks where artwork will live */}
          <div className="relative z-10 w-[72%] max-w-[420px]">
            <div className="bloom-orb">
              {/* Placeholder label — visible until real artwork lands */}
              <span className="sr-only">Artwork placeholder</span>
            </div>
          </div>

          {/* Future artwork label */}
          <p className="absolute bottom-0 start-[14%] text-[9px] tracking-[0.14em] text-df-faint uppercase">
            Artwork · Coming
          </p>
        </div>

      </div>
    </section>
  );
}
