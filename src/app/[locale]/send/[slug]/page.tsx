import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getBloomBySlug } from '@/lib/data/blooms';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bloom = await getBloomBySlug(slug);
  if (!bloom) return { title: 'DIGITAL FLORIST' };
  return { title: `Send ${bloom.title} — DIGITAL FLORIST` };
}

export default async function SendPage({ params }: Props) {
  const { locale, slug } = await params;

  const bloom = await getBloomBySlug(slug);
  if (!bloom) notFound();

  const t = await getTranslations({ locale, namespace: 'bloom' });

  return (
    <div className="flex min-h-svh flex-col bg-df-black">
      <Header locale={locale} />

      <main id="main-content" className="flex flex-1 items-center justify-center pt-16">
        <div className="mx-auto max-w-[600px] px-6 py-20 text-center">

          <p className="text-[9px] tracking-[0.2em] text-df-faint uppercase mb-6">
            {bloom.title}
          </p>

          <h1 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-light text-df-text leading-[1.1] mb-8">
            {t('sendCta')}
          </h1>

          <p className="text-[11px] tracking-[0.06em] leading-[1.9] text-df-muted max-w-[38ch] mx-auto">
            {t('sendArrives')}
          </p>

          <div className="mt-12">
            <Link
              href={`/${locale}/bloom/${slug}`}
              className="text-[10px] tracking-[0.14em] text-df-faint hover:text-df-muted transition-colors duration-300 uppercase"
            >
              ← {bloom.title}
            </Link>
          </div>

        </div>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
