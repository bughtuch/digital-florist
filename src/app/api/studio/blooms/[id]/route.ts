// src/app/api/studio/blooms/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from('blooms')
    .select('*, city:cities(*), collection:collections(*)')
    .eq('id', id)
    .maybeSingle();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Also fetch translations
  const { data: translations } = await supabase!
    .from('bloom_translations')
    .select('*')
    .eq('bloom_id', id);

  return NextResponse.json({ ...data, translations: translations ?? [] });
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Only allow editing of safe fields — never overwrite status, published_at, edition_sold
  const allowed = [
    'title',
    'house_line',
    'slug',
    'city_id',
    'collection_id',
    'archive_code',
    'edition_total',
    'material_note',
    'year',
    'display_order',
    'featured',
    'still_asset_url',
    'motion_asset_url',
    'source_asset_url',
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) {
      update[key] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  update.updated_at = new Date().toISOString();

  const { data, error: dbError } = await supabase!
    .from('blooms')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
