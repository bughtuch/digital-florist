import Link from 'next/link';
import type { BloomWithRelations } from '@/types';
import BloomArtPlaceholder from './BloomArtPlaceholder';

// Grid layout pattern for editorial rhythm.
// All class strings are hardcoded so Tailwind includes them.
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
};

export default function BloomCard({ bloom, index, locale }: Props) {
  const layout = LAYOUT[index % LAYOUT.length];
  const isArchived = bloom.edition_sold >= bloom.edition_total;

  return (
    <article className={`col-span-12 ${layout.grid}`}>
      <Link
        href={`/${locale}/bloom/${bloom.slug}`}
        className="group block focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-df-text"
        aria-label={`${bloom.title} — ${bloom.city.name} — $25`}
      >
        {/* Artwork area */}
        <div className={`relative overflow-hidden ${layout.aspect}`}>
          <BloomArtPlaceholder
            slug={bloom.slug}
            title={bloom.title}
            className="absolute inset-0"
          />

          {/* Desktop hover overlay — hidden on mobile */}
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
              {bloom.title}
            </p>
            <p className="text-[10px] tracking-[0.12em] text-df-muted">
              {bloom.city.name}
            </p>
            <p className="mt-3 text-[11px] tracking-[0.1em] text-df-text">
              {isArchived ? 'ARCHIVED' : '$25'}
            </p>
          </div>
        </div>

        {/* Mobile info — always visible */}
        <div className="mt-3 md:hidden">
          <p className="text-[11px] tracking-[0.16em] text-df-text uppercase">
            {bloom.title}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.1em] text-df-muted">
            {bloom.city.name}
            {isArchived ? ' · ARCHIVED' : ' · $25'}
          </p>
        </div>
      </Link>
    </article>
  );
}
