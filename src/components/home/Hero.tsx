import { useTranslations } from 'next-intl';
import Link from 'next/link';

type Props = { locale: string };

export default function Hero({ locale }: Props) {
  const t = useTranslations('hero');
  const bodyLines = t('body').split('\n');

  return (
    <section
      aria-label="Hero"
      className="relative flex min-h-svh flex-col pt-16"
    >
      {/* Full-bleed two-column container — no max-width cap so artwork reaches the viewport edge */}
      <div className="flex flex-1 flex-col md:flex-row md:items-stretch">

        {/* LEFT — text composition */}
        <div className="flex flex-col justify-center px-6 pb-10 pt-16 md:w-[44%] md:max-w-[640px] md:px-10 md:py-28 lg:px-16">

          <h1 className="font-display text-[clamp(2.6rem,4.5vw,5.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-df-text">
            {t('tagline')}
          </h1>

          <p className="mt-8 text-[clamp(0.8rem,1.1vw,0.95rem)] leading-[1.8] tracking-[0.04em] text-df-text">
            {bodyLines.map((line, i) => (
              <span key={i} className={i > 0 ? 'block mt-1' : undefined}>
                {line}
              </span>
            ))}
          </p>

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

        {/* RIGHT — artwork / media slot
            Desktop: fills full column height flush to the right viewport edge.
            Mobile: portrait rectangle that partially overlaps the text above.
            When artwork arrives: add <Image fill src={url} alt={title} className="object-cover" />
            and remove the placeholder label. */}
        <div
          aria-hidden="true"
          className="-mt-10 md:relative md:mt-0 md:flex-1 md:self-stretch"
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden bg-df-surface md:absolute md:inset-0 md:aspect-auto">
            {/* Artwork lands here — still image, transparent PNG, WebP, or motion asset */}

            <p className="absolute bottom-5 right-5 text-[8px] tracking-[0.18em] text-df-faint uppercase md:bottom-8 md:right-8">
              Artwork · Coming
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
