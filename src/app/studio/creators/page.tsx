// src/app/studio/creators/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type CityRef = { id: string; name: string; code: string } | null;

type Creator = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  commission_bps: number;
  active: boolean;
  created_at: string;
  city: CityRef | CityRef[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

function getCity(city: Creator['city']): CityRef {
  if (!city) return null;
  if (Array.isArray(city)) return city[0] ?? null;
  return city;
}

function commissionDisplay(bps: number): string {
  return `${(bps / 100).toFixed(0)}%`;
}

export default async function StudioCreatorsPage() {
  const supabase = await createClient();

  // Guard: must be Studio admin
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/studio/sign-in');

  const { data: isAdmin } = await supabase.rpc('is_studio_admin');
  if (!isAdmin) redirect('/studio/sign-in');

  const { data: rows, error } = await supabase
    .from('creators')
    .select('id, name, slug, email, commission_bps, active, created_at, city:cities(id, name, code)')
    .order('created_at', { ascending: false });

  const creators = (rows ?? []) as Creator[];

  return (
    <div className="min-h-screen bg-df-black pt-16">
      <div className="max-w-4xl mx-auto px-8 py-12">

        <div className="mb-12">
          <p className="text-[9px] tracking-[0.28em] text-df-faint uppercase mb-2">
            Studio
          </p>
          <h1 className="font-display text-[28px] font-light tracking-[0.04em] text-df-text uppercase">
            Creators
          </h1>
        </div>

        {error && (
          <p className="text-[11px] tracking-[0.06em] text-df-muted mb-8">
            Could not load creators.
          </p>
        )}

        {!error && creators.length === 0 && (
          <p className="text-[11px] tracking-[0.18em] text-df-faint uppercase">
            No creators yet.
          </p>
        )}

        {creators.length > 0 && (
          <div className="border border-df-border">
            {/* Header row */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-3 border-b border-df-border">
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">Name</p>
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">Slug / Email</p>
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">City</p>
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">Commission</p>
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">Status</p>
              <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase">Added</p>
            </div>

            <div className="divide-y divide-df-border">
              {creators.map((creator) => {
                const city = getCity(creator.city);
                return (
                  <div
                    key={creator.id}
                    className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr] gap-4 px-5 py-4 items-center"
                  >
                    <p className="text-[13px] tracking-[0.04em] text-df-text truncate">
                      {creator.name}
                    </p>
                    <div>
                      <p className="text-[11px] tracking-[0.06em] text-df-muted font-mono truncate">
                        /c/{creator.slug}
                      </p>
                      {creator.email && (
                        <p className="text-[9px] tracking-[0.04em] text-df-faint truncate mt-0.5">
                          {creator.email}
                        </p>
                      )}
                    </div>
                    <p className="text-[11px] tracking-[0.1em] text-df-muted uppercase">
                      {city ? city.code : '—'}
                    </p>
                    <p className="text-[11px] tracking-[0.06em] text-df-muted">
                      {commissionDisplay(creator.commission_bps)}
                    </p>
                    <p className={`text-[9px] tracking-[0.18em] uppercase ${creator.active ? 'text-df-text' : 'text-df-faint'}`}>
                      {creator.active ? 'Active' : 'Inactive'}
                    </p>
                    <p className="text-[9px] tracking-[0.1em] text-df-faint">
                      {formatDate(creator.created_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Referral URL note */}
        <div className="mt-12 pt-8 border-t border-df-border">
          <p className="text-[9px] tracking-[0.22em] text-df-faint uppercase mb-3">
            Referral URLs
          </p>
          <p className="text-[11px] tracking-[0.04em] text-df-muted leading-relaxed">
            Each creator link takes the form{' '}
            <span className="font-mono text-df-text">https://digitalflorist.com/c/[slug]</span>.
            Visiting sets a 30-day{' '}
            <span className="font-mono text-df-text">df_ref</span> cookie and redirects to the gallery.
            Commission is calculated at checkout on confirmed payment only.
          </p>
        </div>

      </div>
    </div>
  );
}
