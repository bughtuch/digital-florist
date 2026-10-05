// src/lib/studio/auth.ts

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function verifyStudioAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      admin: null,
      supabase: null,
      error: NextResponse.json({ error: 'unauthenticated' }, { status: 401 }),
    };
  }

  const { data: isAdmin } = await supabase.rpc('is_studio_admin');

  if (!isAdmin) {
    return {
      admin: null,
      supabase: null,
      error: NextResponse.json({ error: 'forbidden' }, { status: 403 }),
    };
  }

  return { admin: user, supabase, error: null };
}
