import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { BloomWithRelations } from '@/types';
import { getEditionDisplay } from '@/lib/data/blooms';

type Props = {
  bloom: BloomWithRelations;
  locale: string;
};

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3 border-b border-df-border last:border-0">
      <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase shrink-0">
        {label}
      </span>
      <span className="text-[11px] tracking-[0.08em] text-df-muted text-end">
        {value}
      </span>
    </div>
  );
}

export default function BloomInfo({ bloom, locale }: Props) {
  const t = useTranslations('bloom');
  const edition = getEditionDisplay(bloom.edition_sold, bloom.edition_total);
  const isArchived = edition.isArchived || bloom.status === 'archived';

  return (
    <div className="flex flex-col">

      {/* Title */}
      <h1 className="font-display text-[clamp(2rem,3.5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.01em] text-df-text">
        {bloom.title}
      </h1>

      {/* House line */}
      {bloom.house_line && (
        <p className="mt-5 text-[clamp(0.8rem,1.1vw,0.9rem)] leading-[1.8] tracking-[0.04em] text-df-text">
          {bloom.house_line}
        </p>
      )}

      {/* City + archive code */}
      <div className="mt-8 pb-6 border-b border-df-border">
        <p className="text-[13px] tracking-[0.1em] text-df-text">
          {bloom.city.name}
        </p>
        <p className="mt-1 text-[10px] tracking-[0.14em] text-df-muted">
          {bloom.archive_code}
        </p>
      </div>

      {/* Edition */}
      <div className="py-6 border-b border-df-border">
        <p className="text-[9px] tracking-[0.18em] text-df-faint uppercase mb-2">
          {t('edition')}
        </p>
        <p className="text-[13px] tracking-[0.08em] text-df-text">
          {edition.label}
        </p>
      </div>

      {/* Price + CTA */}
      <div className="py-8 border-b border-df-border">
        {isArchived ? (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] tracking-[0.14em] text-df-muted uppercase">
              {t('archived')}
            </p>
            <p className="text-[11px] tracking-[0.04em] leading-[1.7] text-df-faint">
              {t('archivedMessage')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <p className="text-[clamp(1.4rem,2.5vw,2rem)] font-display font-light text-df-text">
              {t('price')}
            </p>
            <Link
              href={`/${locale}/send/${bloom.slug}`}
              className="
                inline-block border border-df-text px-8 py-4
                text-[11px] tracking-[0.18em] text-df-text uppercase text-center
                transition-all duration-500
                hover:bg-df-text hover:text-df-black
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-df-text
              "
            >
              {t('sendCta')}
            </Link>
          </div>
        )}
      </div>

      {/* Provenance metadata */}
      <div className="mt-6">
        <MetaRow label={t('origin')}     value={bloom.city.name} />
        <MetaRow label={t('collection')} value={bloom.collection.name} />
        {bloom.material_note && (
          <MetaRow label={t('material')} value={bloom.material_note} />
        )}
        <MetaRow label={t('house')} value="Digital Florist" />
        <MetaRow label={t('year')}  value={String(bloom.year)} />
      </div>

    </div>
  );
}
