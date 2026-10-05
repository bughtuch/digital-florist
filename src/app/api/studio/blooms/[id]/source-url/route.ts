// src/app/api/studio/blooms/[id]/source-url/route.ts
//
// Returns a short-lived signed URL for a private source asset.
// Requires Studio admin authentication.
// Uses the admin client to access the private bloom-source bucket.
// URL expires in 300 seconds (5 minutes). Never persisted.

import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const { id } = await params;

  // Get the bloom's source storage path
  const { data: bloom, error: bloomError } = await supabase!
    .from('blooms')
    .select('source_asset_url')
    .eq('id', id)
    .maybeSingle();

  if (bloomError) {
    return NextResponse.json({ error: bloomError.message }, { status: 500 });
  }

  if (!bloom?.source_asset_url) {
    return NextResponse.json({ error: 'No source asset' }, { status: 404 });
  }

  // Generate signed URL via admin client (bypasses RLS, can sign private bucket objects)
  const admin = createAdminClient();
  const { data: signedData, error: signedError } = await admin.storage
    .from('bloom-source')
    .createSignedUrl(bloom.source_asset_url, 300);

  if (signedError || !signedData?.signedUrl) {
    return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
  }

  return NextResponse.json({
    signedUrl: signedData.signedUrl,
    expiresIn: 300,
  });
}
