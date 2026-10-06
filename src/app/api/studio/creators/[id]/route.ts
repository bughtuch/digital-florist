import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const allowed = ['name', 'slug', 'city_id', 'email', 'commission_bps', 'active'];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  if (patch.slug) patch.slug = (patch.slug as string).trim().toLowerCase();
  if (patch.name) patch.name = (patch.name as string).trim();
  if (patch.commission_bps !== undefined) patch.commission_bps = Number(patch.commission_bps);

  const { data, error: dbError } = await supabase!
    .from('creators')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data);
}
