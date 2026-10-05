// src/app/studio/activity/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type ActivityRow = {
  id: string;
  action: string;
  admin_email: string;
  created_at: string;
  bloom: { title: string } | { title: string }[] | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-GB', { month: 'short' }).toUpperCase();
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year} · ${hh}:${mm}`;
}

function getBloomTitle(bloom: ActivityRow['bloom']): string | null {
  if (!bloom) return null;
  if (Array.isArray(bloom)) return bloom[0]?.title ?? null;
  return bloom.title ?? null;
}

function actionLabel(action: string): string {
  return action.replace(/_/g, ' ').toUpperCase();
}

export default async function StudioActivityPage() {
  const supabase = await createClient();

  // Guard: must be Studio admin
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/studio/login');

  const { data: isAdmin } = await supabase.rpc('is_studio_admin');
  if (!isAdmin) redirect('/studio/login');

  const { data: rows, error } = await supabase
    .from('studio_activity')
    .select('id, action, admin_email, created_at, bloom:blooms(title)')
    .order('created_at', { ascending: false })
    .limit(200);

  const activity = (rows ?? []) as ActivityRow[];

  return (
    <div className="min-h-screen bg-df-black pt-16">
      <div className="max-w-2xl mx-auto px-8 py-12">

        <div className="mb-12">
          <p className="text-[9px] tracking-[0.28em] text-df-faint uppercase mb-2">
            Studio
          </p>
          <h1 className="font-display text-[28px] font-light tracking-[0.04em] text-df-text uppercase">
            Activity
          </h1>
        </div>

        {error && (
          <p className="text-[11px] tracking-[0.06em] text-df-muted mb-8">
            Could not load activity log.
          </p>
        )}

        {!error && activity.length === 0 && (
          <p className="text-[11px] tracking-[0.1em] text-df-faint uppercase tracking-[0.18em]">
            No activity recorded yet.
          </p>
        )}

        {activity.length > 0 && (
          <div className="divide-y divide-df-border">
            {activity.map((row) => {
              const title = getBloomTitle(row.bloom);
              return (
                <div key={row.id} className="py-5">
                  <p className="text-[9px] tracking-[0.22em] text-df-muted uppercase mb-1">
                    {actionLabel(row.action)}
                  </p>
                  {title ? (
                    <p className="text-[13px] tracking-[0.06em] text-df-text mb-1">
                      {title}
                    </p>
                  ) : (
                    <p className="text-[11px] tracking-[0.06em] text-df-faint italic mb-1">
                      Bloom deleted
                    </p>
                  )}
                  <p className="text-[9px] tracking-[0.12em] text-df-faint">
                    {formatDate(row.created_at)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
