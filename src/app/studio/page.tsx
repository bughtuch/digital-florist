// src/app/studio/page.tsx

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function StudioDashboardPage() {
  const supabase = await createClient();

  const { data: blooms } = await supabase
    .from('blooms')
    .select('status, edition_sold, edition_total', { count: 'exact' });

  const total = blooms?.length ?? 0;
  const draft = blooms?.filter((b) => b.status === 'draft').length ?? 0;
  const available = blooms?.filter((b) => b.status === 'available').length ?? 0;
  const archived = blooms?.filter((b) => b.status === 'archived').length ?? 0;
  const editionsIssued =
    blooms?.reduce((sum, b) => sum + (b.edition_sold ?? 0), 0) ?? 0;

  const stats = [
    { label: 'Total Blooms', value: total },
    { label: 'Draft', value: draft },
    { label: 'Available', value: available },
    { label: 'Archived', value: archived },
    { label: 'Editions Issued', value: editionsIssued },
  ];

  return (
    <div className="px-8 py-12">
      {/* Header */}
      <div className="mb-14">
        <p className="text-[9px] tracking-[0.3em] text-df-faint uppercase mb-2">
          Digital Florist
        </p>
        <h1 className="font-display text-[32px] tracking-[0.08em] text-df-text uppercase">
          Studio
        </h1>
      </div>

      {/* Stats row */}
      <div className="border-t border-df-border mb-14">
        <div className="grid grid-cols-5 divide-x divide-df-border">
          {stats.map((stat) => (
            <div key={stat.label} className="pt-6 pb-8 pr-6 first:pl-0 pl-6">
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-4">
                {stat.label}
              </p>
              <p className="font-display text-[40px] leading-none text-df-text">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-8">
        <Link
          href="/studio/blooms"
          className="text-[10px] tracking-[0.18em] text-df-text uppercase hover:text-df-muted transition-colors duration-200"
        >
          View All Blooms →
        </Link>
        <Link
          href="/studio/blooms/new"
          className="border border-df-text px-5 py-2 text-[10px] tracking-[0.18em] text-df-text uppercase hover:bg-df-text hover:text-df-black transition-all duration-300"
        >
          New Bloom
        </Link>
      </div>
    </div>
  );
}
