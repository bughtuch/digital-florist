// src/components/gallery/BloomCard.tsx

import Link from 'next/link';
import type { BloomWithRelations } from '@/types';
import BloomMedia from '@/components/bloom/BloomMedia';
import { formatPrice } from '@/lib/currency';

const LAYOUT = [
  { grid: 'md:col-span-8',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-4',  aspect: 'aspect-tall'     },
  { grid: 'md:col-span-4',  aspect: 'aspect-tall'     },
  { grid: 'md:col-span-8',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-12', aspect: 'aspect-cinema'   },
  { grid: 'md:col-span-6',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-6',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-8',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-4',  aspect: 'aspect-square'   },
  { grid: 'md:col-span-12', aspect: 'aspect-cinema'   },
  { grid: 'md:col-span-4',  aspect: 'aspect-tall'     },
  { grid: 'md:col-span-8',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-6',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-6',  aspect: 'aspect-portrait' },
  { grid: 'md:col-span-12', aspect: 'aspect-cinema'   },
] as const;

type Props = {
  bloom: BloomWithRelations;
  index: number;
  locale: string;
  localizedTitle?: string;
};

export default function BloomCard({ bloom, index, locale, localizedTitle }: Props) {
  const layout = LAYOUT[index % LAYOUT.length];
  const isArchived = bloom.status === 'archived' || bloom.edition_sold >= bloom.edition_total;
  const title = localizedTitle || bloom.title;
  const priceLabel = isArchived ? 'Archived' : formatPrice(bloom.price_minor, bloom.currency, locale);

  return (
    <article className={`col-span-12 ${layout.grid}`}>
      <Link
        href={`/${locale}/bloom/${bloom.slug}`}
        className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-df-text"
        aria-label={`${title} — ${bloom.city.name}${isArchived ? ' — Archived' : ` — ${priceLabel}`}`}
      >
        {/* Artwork area — still only in gallery (no motion preload) */}
        <div className={`relative overflow-hidden ${layout.aspect}`}>
          <BloomMedia
            stillUrl={bloom.still_asset_url}
            mode="gallery"
            alt={`${title} — Digital Florist, ${bloom.city.name}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="absolute inset-0"
          />

          {/* Desktop hover overlay */}
          <div
            className="
              absolute inset-0 hidden md:flex flex-col justify-end p-7
              bg-df-black/80
              opacity-0 translate-y-1
              group-hover:opacity-100 group-hover:translate-y-0
              transition-all duration-500 ease-out
            "
            aria-hidden="true"
          >
            <p className="text-[11px] tracking-[0.18em] text-df-text uppercase mb-1">
              {title}
            </p>
            <p className="text-[10px] tracking-[0.12em] text-df-muted">
              {bloom.city.name}
            </p>
            <p className="mt-3 text-[11px] tracking-[0.1em] text-df-text">
              {isArchived ? 'ARCHIVED' : priceLabel}
            </p>
          </div>
        </div>

        {/* Mobile info — always visible */}
        <div className="mt-3 md:hidden">
          <p className="text-[11px] tracking-[0.16em] text-df-text uppercase">
            {title}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.1em] text-df-muted">
            {bloom.city.name}
            {isArchived ? ' · ARCHIVED' : ` · ${priceLabel}`}
          </p>
        </div>
      </Link>
    </article>
  );
}
