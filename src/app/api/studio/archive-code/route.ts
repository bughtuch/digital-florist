// src/app/api/studio/archive-code/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyStudioAdmin } from '@/lib/studio/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { supabase, error } = await verifyStudioAdmin();
  if (error) return error;

  const cityCode = request.nextUrl.searchParams.get('city_code');
  if (!cityCode) {
    return NextResponse.json({ error: 'city_code required' }, { status: 400 });
  }

  // Find the city
  const { data: city } = await supabase!
    .from('cities')
    .select('id, code')
    .eq('code', cityCode.toUpperCase())
    .maybeSingle();

  if (!city) {
    return NextResponse.json({ error: 'City not found' }, { status: 404 });
  }

  // Get all archive codes for blooms in that city
  const { data: blooms } = await supabase!
    .from('blooms')
    .select('archive_code')
    .eq('city_id', city.id);

  let maxNum = 0;

  if (blooms && blooms.length > 0) {
    for (const b of blooms) {
      if (!b.archive_code) continue;
      // Format: "LON / 004" — extract numeric part after "/"
      const parts = b.archive_code.split('/');
      if (parts.length >= 2) {
        const num = parseInt(parts[parts.length - 1].trim(), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(3, '0');
  const suggested = `${city.code} / ${padded}`;

  return NextResponse.json({ suggested });
}
