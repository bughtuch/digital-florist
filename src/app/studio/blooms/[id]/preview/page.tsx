// src/app/studio/blooms/[id]/preview/page.tsx

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { BloomWithRelations } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: 'noindex, nofollow, noarchive',
};

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function BloomPreviewPage({ params }: PreviewPageProps) {
  const { id: bloomId } = await params;

  const supabase = await createClient();

  const { data: bloom } = await supabase
    .from('blooms')
    .select('*, city:cities(*), collection:collections(*)')
    .eq('id', bloomId)
    .maybeSingle();

  if (!bloom) notFound();

  const b = bloom as unknown as BloomWithRelations;

  return (
    <div className="min-h-screen bg-df-black">
      {/* Studio preview bar */}
      <div className="fixed top-12 left-0 right-0 z-40 bg-df-surface border-b border-df-border h-10 flex items-center px-6 gap-6">
        <span className="text-[9px] tracking-[0.22em] text-df-faint uppercase">
          Studio Preview
        </span>
        <span className="text-[9px] tracking-[0.18em] text-df-faint">·</span>
        <span
          className={`text-[9px] tracking-[0.18em] uppercase ${
            b.status === 'draft'
              ? 'text-df-faint'
              : b.status === 'available'
                ? 'text-df-muted'
                : 'text-df-faint line-through'
          }`}
        >
          {b.status}
        </span>
        <div className="flex-1" />
        <Link
          href={`/studio/blooms/${bloomId}`}
          className="text-[9px] tracking-[0.18em] text-df-muted uppercase hover:text-df-text transition-colors duration-200"
        >
          ← Back to Edit
        </Link>
      </div>

      {/* Preview content */}
      <div className="pt-[88px] px-8 py-16 max-w-5xl mx-auto">
        {/* City / archive code */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[9px] tracking-[0.28em] text-df-faint uppercase">
            {b.city?.code ?? '—'}
          </span>
          <span className="text-df-faint text-[9px]">·</span>
          <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase font-mono">
            {b.archive_code}
          </span>
          <span className="text-df-faint text-[9px]">·</span>
          <span className="text-[9px] tracking-[0.18em] text-df-faint uppercase">
            Edition of {b.edition_total}
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-[52px] leading-none tracking-[0.04em] text-df-text uppercase mb-4">
          {b.title}
        </h1>

        {b.house_line && (
          <p className="text-[14px] tracking-[0.08em] text-df-muted mb-10">
            {b.house_line}
          </p>
        )}

        {/* Still asset */}
        {b.still_asset_url ? (
          <div className="mb-12 border border-df-border">
            <img
              src={b.still_asset_url}
              alt={b.title}
              className="w-full object-cover max-h-[70vh]"
            />
          </div>
        ) : (
          <div className="mb-12 border border-df-border bg-df-surface aspect-[4/3] flex items-center justify-center">
            <span className="text-[9px] tracking-[0.2em] text-df-faint uppercase">
              No image uploaded
            </span>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-4 gap-8 border-t border-df-border pt-8 mb-10">
          <div>
            <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-2">
              Collection
            </p>
            <p className="text-[12px] text-df-muted">
              {b.collection?.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-2">
              City
            </p>
            <p className="text-[12px] text-df-muted">
              {b.city?.name ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-2">
              Year
            </p>
            <p className="text-[12px] text-df-muted">{b.year}</p>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-2">
              Price
            </p>
            <p className="text-[12px] text-df-muted">
              ${(b.price_cents / 100).toFixed(0)}
            </p>
          </div>
        </div>

        {b.material_note && (
          <div className="border-t border-df-border pt-8">
            <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-3">
              Material Note
            </p>
            <p className="text-[13px] text-df-muted leading-relaxed max-w-xl">
              {b.material_note}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
