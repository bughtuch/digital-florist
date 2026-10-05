// src/app/api/studio/blooms/[id]/archive/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { admin, supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { id } = await params;

  // Fetch the bloom
  const { data: bloom, error: fetchError } = await supabase!
    .from('blooms')
    .select('id, status, title')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !bloom) {
    return NextResponse.json({ error: 'Bloom not found' }, { status: 404 });
  }

  // Validate current status
  if (bloom.status !== 'available') {
    return NextResponse.json(
      { error: `Cannot archive a bloom with status '${bloom.status}'` },
      { status: 422 },
    );
  }

  const now = new Date().toISOString();

  // Archive
  const { error: updateError } = await supabase!
    .from('blooms')
    .update({
      status: 'archived',
      updated_at: now,
    })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log to studio_activity
  await supabase!
    .from('studio_activity')
    .insert({
      bloom_id: id,
      action: 'archived',
      admin_id: admin!.id,
      created_at: now,
    })
    .then(() => {}); // non-blocking, ignore errors

  return NextResponse.json({ ok: true });
}
