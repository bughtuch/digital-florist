// src/app/api/studio/blooms/[id]/translations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

const VALID_LOCALES = ['en', 'ar', 'it', 'ko', 'ja'];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from('bloom_translations')
    .select('*')
    .eq('bloom_id', id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
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

  const { locale, translated_title, translated_house_line, translated_material_note } =
    body;

  if (!locale || !VALID_LOCALES.includes(locale as string)) {
    return NextResponse.json(
      { error: `locale must be one of: ${VALID_LOCALES.join(', ')}` },
      { status: 400 },
    );
  }

  // Check the bloom exists
  const { data: bloom } = await supabase!
    .from('blooms')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!bloom) {
    return NextResponse.json({ error: 'Bloom not found' }, { status: 404 });
  }

  // Upsert translation
  const { data, error: dbError } = await supabase!
    .from('bloom_translations')
    .upsert(
      {
        bloom_id: id,
        locale,
        translated_title: translated_title ?? null,
        translated_house_line: translated_house_line ?? null,
        translated_material_note: translated_material_note ?? null,
      },
      { onConflict: 'bloom_id,locale' },
    )
    .select('*')
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
