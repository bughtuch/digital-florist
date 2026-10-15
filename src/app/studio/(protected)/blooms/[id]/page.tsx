// src/app/studio/blooms/[id]/page.tsx

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import BloomFormClient from '@/components/studio/BloomFormClient';
import type { BloomWithRelations, BloomStatus } from '@/types';

export const dynamic = 'force-dynamic';

interface EditBloomPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditBloomPage({ params }: EditBloomPageProps) {
  const { id: bloomId } = await params;

  const supabase = await createClient();

  const [
    { data: bloom },
    { data: cities },
    { data: collections },
    { data: translations },
  ] = await Promise.all([
    supabase
      .from('blooms')
      .select('*, city:cities(*), collection:collections(*)')
      .eq('id', bloomId)
      .maybeSingle(),
    supabase
      .from('cities')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('collections')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('bloom_translations')
      .select('*')
      .eq('bloom_id', bloomId),
  ]);

  if (!bloom) {
    notFound();
  }

  return (
    <div className="px-8 py-10">
      <div className="mb-10">
        <p className="text-[9px] tracking-[0.3em] text-df-faint uppercase mb-2">
          <Link href="/studio/blooms" className="hover:text-df-muted transition-colors">
            Studio / Blooms
          </Link>
          {' / '}Edit
        </p>
        <div className="flex items-end justify-between">
          <h1 className="font-display text-[28px] tracking-[0.08em] text-df-text uppercase">
            {bloom.title}
          </h1>
          <div className="flex items-center gap-4">
            {bloom.status === 'draft' && (
              <Link
                href={`/studio/blooms/${bloomId}/preview`}
                className="text-[9px] tracking-[0.18em] text-df-muted uppercase hover:text-df-text transition-colors duration-200"
              >
                Preview →
              </Link>
            )}
          </div>
        </div>
      </div>

      <BloomFormClient
        mode="edit"
        bloom={bloom as unknown as BloomWithRelations & { status: BloomStatus; published_at: string | null; edition_sold: number }}
        cities={cities ?? []}
        collections={collections ?? []}
        translations={translations ?? []}
      />
    </div>
  );
}
