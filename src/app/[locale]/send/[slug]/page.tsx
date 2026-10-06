import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import Header from '@/components/layout/Header';
import SendFlowClient from '@/components/send/SendFlowClient';
import { getBloomBySlug } from '@/lib/data/blooms';
import { getEditionDisplay } from '@/lib/data/edition';
import type { SendBloomData } from '@/types';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bloom = await getBloomBySlug(slug);
  if (!bloom) return { title: 'DIGITAL FLORIST' };
  return {
    title: `Send ${bloom.title} — DIGITAL FLORIST`,
    robots: { index: false, follow: false },
  };
}

export default async function SendPage({ params }: Props) {
  const { locale, slug } = await params;

  const bloom = await getBloomBySlug(slug);
  if (!bloom) notFound();

  // Archived blooms cannot be sent
  if (bloom.status === 'archived') notFound();

  const t = await getTranslations({ locale, namespace: 'send' });
  void t; // translations available to sub-components via next-intl provider

  const edition = getEditionDisplay(bloom.edition_sold, bloom.edition_total);

  const bloomData: SendBloomData = {
    id: bloom.id,
    slug: bloom.slug,
    title: bloom.title,
    cityCode: bloom.city.code,
    archiveCode: bloom.archive_code,
    editionDisplay: edition.label,
    isArchived: edition.isArchived,
    stillAssetUrl: bloom.still_asset_url,
    priceMinor: bloom.price_minor,
    currency: bloom.currency,
  };

  return (
    <div className="bg-df-black">
      <Header locale={locale} />
      <SendFlowClient bloom={bloomData} locale={locale} />
    </div>
  );
}
