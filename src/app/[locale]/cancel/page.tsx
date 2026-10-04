import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'DIGITAL FLORIST',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ slug?: string }>;
};

export default async function CancelPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { slug } = await searchParams;

  const t = await getTranslations({ locale, namespace: 'sent' });

  const tryAgainHref = slug
    ? `/${locale}/send/${slug}`
    : `/${locale}/gallery`;

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />

      <main id="main-content" className="flex flex-1 items-center justify-center px-6">
        <div className="mx-auto max-w-[480px] py-20 text-center">

          <h1 className="font-display text-[clamp(1.75rem,5vw,3rem)] font-light text-df-text leading-[1.05] mb-5 tracking-[0.02em]">
            {t('notCompleted')}
          </h1>

          <p className="text-[11px] tracking-[0.08em] text-df-muted mb-12">
            {t('notCompletedSub')}
          </p>

          <Link
            href={tryAgainHref}
            className="inline-block border border-df-border px-10 py-4 text-[10px] tracking-[0.2em] text-df-text uppercase hover:border-df-muted transition-colors duration-300"
          >
            {t('tryAgain')}
          </Link>

        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
