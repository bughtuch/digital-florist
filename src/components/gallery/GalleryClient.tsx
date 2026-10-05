'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import type { BloomWithRelations, DbBloomTranslation, DbCollection } from '@/types';
import GalleryFilters from './GalleryFilters';
import BloomCard from './BloomCard';

type Props = {
  blooms: BloomWithRelations[];
  collections: DbCollection[];
  locale: string;
  initialCollection: string | null;
  translations: Record<string, DbBloomTranslation>;
};

const VALID_SLUGS = new Set(['afterhours', 'morning', 'memory', 'ritual', 'city']);

export default function GalleryClient({
  blooms,
  collections,
  locale,
  initialCollection,
  translations,
}: Props) {
  const searchParams = useSearchParams();
  const raw = searchParams.get('collection') ?? initialCollection ?? null;
  const activeSlug = raw && VALID_SLUGS.has(raw) ? raw : null;

  const filtered = useMemo(
    () =>
      activeSlug
        ? blooms.filter((b) => b.collection.slug === activeSlug)
        : blooms,
    [blooms, activeSlug],
  );

  return (
    <>
      <GalleryFilters collections={collections} activeSlug={activeSlug} />

      {filtered.length === 0 ? (
        <p className="mt-24 text-[11px] tracking-[0.14em] text-df-muted uppercase">
          No Blooms in this collection yet.
        </p>
      ) : (
        <div className="mt-16 grid grid-cols-12 gap-4 md:gap-6">
          {filtered.map((bloom, i) => {
            const t = translations[bloom.id];
            const localizedTitle = t?.translated_title?.trim() || undefined;
            return (
              <BloomCard
                key={bloom.id}
                bloom={bloom}
                index={i}
                locale={locale}
                localizedTitle={localizedTitle}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
