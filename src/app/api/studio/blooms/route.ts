// src/app/api/studio/blooms/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from('blooms')
    .select('*, city:cities(*), collection:collections(*)')
    .order('display_order', { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    title,
    house_line,
    slug,
    city_id,
    collection_id,
    archive_code,
    edition_total,
    material_note,
    year,
    display_order,
    featured,
    price_minor,
    currency,
    still_asset_url,
    motion_asset_url,
    source_asset_url,
  } = body;

  // Required field validation
  if (!title || !slug || !city_id || !collection_id || !price_minor || !currency) {
    return NextResponse.json(
      { error: 'title, slug, city_id, collection_id, price_minor, and currency are required' },
      { status: 400 },
    );
  }

  const { data, error: dbError } = await supabase!
    .from('blooms')
    .insert({
      title: (title as string).trim(),
      house_line: house_line ?? null,
      slug: (slug as string).trim(),
      city_id,
      collection_id,
      archive_code: (archive_code as string | undefined)?.trim() ?? '',
      edition_total: Number(edition_total) || 250,
      edition_sold: 0,
      material_note: material_note ?? null,
      year: Number(year) || new Date().getFullYear(),
      display_order: Number(display_order) || 0,
      featured: Boolean(featured),
      status: 'draft',
      price_minor: Number(price_minor),
      currency: (currency as string).toUpperCase(),
      still_asset_url: still_asset_url ?? null,
      motion_asset_url: motion_asset_url ?? null,
      source_asset_url: source_asset_url ?? null,
    })
    .select('*')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
