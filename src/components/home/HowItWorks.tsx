import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('howItWorks');
  const steps = t.raw('steps') as { title: string; body: string }[];

  return (
    <section
      aria-label="How it works"
      className="border-t border-df-border bg-df-surface py-28 md:py-40"
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">

        {/* Heading */}
        <p className="mb-20 text-[9px] tracking-[0.2em] text-df-faint uppercase">
          {t('heading')}
        </p>

        {/* Steps — editorial, not cards */}
        <ol className="flex flex-col gap-20 md:flex-row md:gap-0">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex-1 md:pe-12 lg:pe-20"
            >
              {/* Step number */}
              <span className="mb-6 block text-[9px] tracking-[0.16em] text-df-faint">
                0{index + 1}
              </span>

              {/* Step title */}
              <h3 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-light leading-none tracking-[-0.01em] text-df-text">
                {step.title}
              </h3>

              {/* Step body */}
              <p className="mt-6 text-[clamp(0.75rem,1.1vw,0.85rem)] leading-[1.9] tracking-[0.04em] text-df-text">
                {step.body}
              </p>

              {/* Divider between steps on desktop */}
              {index < steps.length - 1 && (
                <div
                  className="absolute end-0 top-0 hidden h-full w-px bg-df-border md:block"
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>

      </div>
    </section>
  );
}
