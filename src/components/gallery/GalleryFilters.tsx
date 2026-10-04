'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { DbCollection } from '@/types';

type Props = {
  collections: DbCollection[];
  activeSlug: string | null;
};

export default function GalleryFilters({ collections, activeSlug }: Props) {
  const t = useTranslations('gallery');
  const tCol = useTranslations('collections');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('collection', slug);
    } else {
      params.delete('collection');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const filters = [
    { slug: null, label: t('filterAll') },
    ...collections.map((c) => ({
      slug: c.slug,
      label: tCol(c.slug as 'afterhours' | 'morning' | 'memory' | 'ritual' | 'city'),
    })),
  ];

  return (
    <nav
      aria-label={t('filterLabel')}
      className="flex flex-wrap items-center gap-x-8 gap-y-3"
    >
      {filters.map(({ slug, label }) => {
        const isActive = slug === activeSlug;
        return (
          <button
            key={slug ?? 'all'}
            onClick={() => setFilter(slug)}
            aria-pressed={isActive}
            className={`
              text-[11px] tracking-[0.14em] uppercase transition-all duration-300
              border-b pb-0.5
              ${isActive
                ? 'text-df-text border-df-text'
                : 'text-df-muted border-transparent hover:text-df-text hover:border-df-border'
              }
            `}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}
