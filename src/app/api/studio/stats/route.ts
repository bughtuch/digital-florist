// src/app/api/studio/stats/route.ts

import { NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { data: blooms } = await supabase!
    .from('blooms')
    .select('status, edition_sold');

  type BloomRow = { status: string; edition_sold: number };
  const rows = (blooms ?? []) as BloomRow[];
  const total = rows.length;
  const draft = rows.filter((b) => b.status === 'draft').length;
  const available = rows.filter((b) => b.status === 'available').length;
  const archived = rows.filter((b) => b.status === 'archived').length;
  const editions_issued = rows.reduce((sum, b) => sum + (b.edition_sold ?? 0), 0);

  return NextResponse.json({ total, draft, available, archived, editions_issued });
}
