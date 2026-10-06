import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from('creators')
    .select('*, city:cities(id, name, code)')
    .order('created_at', { ascending: false });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, slug, city_id, email, commission_bps, active } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
  }

  const { data, error: dbError } = await supabase!
    .from('creators')
    .insert({
      name: (name as string).trim(),
      slug: (slug as string).trim().toLowerCase(),
      city_id: city_id ?? null,
      email: email ?? null,
      commission_bps: Number(commission_bps ?? 4000),
      active: active !== false,
    })
    .select('*')
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
