// src/app/studio/blooms/new/page.tsx

import { createClient } from '@/lib/supabase/server';
import BloomFormClient from '@/components/studio/BloomFormClient';

export const dynamic = 'force-dynamic';

export default async function NewBloomPage() {
  const supabase = await createClient();

  const [{ data: cities }, { data: collections }] = await Promise.all([
    supabase
      .from('cities')
      .select('*')
      .order('display_order', { ascending: true }),
    supabase
      .from('collections')
      .select('*')
      .order('display_order', { ascending: true }),
  ]);

  return (
    <div className="px-8 py-10">
      <div className="mb-10">
        <p className="text-[9px] tracking-[0.3em] text-df-faint uppercase mb-2">
          Studio / Blooms
        </p>
        <h1 className="font-display text-[28px] tracking-[0.08em] text-df-text uppercase">
          New Bloom
        </h1>
      </div>

      <BloomFormClient
        mode="new"
        cities={cities ?? []}
        collections={collections ?? []}
      />
    </div>
  );
}
