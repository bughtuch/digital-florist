// src/app/api/studio/blooms/[id]/publish/route.ts

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
    .select('*, city:cities(code)')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !bloom) {
    return NextResponse.json({ error: 'Bloom not found' }, { status: 404 });
  }

  // Validate current status
  if (bloom.status !== 'draft') {
    return NextResponse.json(
      { error: `Cannot publish a bloom with status '${bloom.status}'` },
      { status: 422 },
    );
  }

  // Validate required fields
  const missing: string[] = [];
  if (!bloom.title?.trim()) missing.push('title');
  if (!bloom.slug?.trim()) missing.push('slug');
  if (!bloom.city_id) missing.push('city_id');
  if (!bloom.collection_id) missing.push('collection_id');
  if (!bloom.archive_code?.trim()) missing.push('archive_code');
  if (!bloom.edition_total || bloom.edition_total <= 0) missing.push('edition_total');
  if (!bloom.year) missing.push('year');

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 422 },
    );
  }

  // Check archive_code uniqueness among OTHER published/available/archived blooms
  const { data: duplicates } = await supabase!
    .from('blooms')
    .select('id')
    .eq('archive_code', bloom.archive_code)
    .neq('id', id)
    .in('status', ['available', 'archived']);

  if (duplicates && duplicates.length > 0) {
    return NextResponse.json(
      { error: `Archive code '${bloom.archive_code}' is already in use` },
      { status: 422 },
    );
  }

  // Publish
  const now = new Date().toISOString();
  const { error: updateError } = await supabase!
    .from('blooms')
    .update({
      status: 'available',
      published_at: bloom.published_at ?? now,
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
      action: 'published',
      admin_id: admin!.id,
      created_at: now,
    })
    .then(() => {}); // non-blocking, ignore errors

  return NextResponse.json({ ok: true });
}
