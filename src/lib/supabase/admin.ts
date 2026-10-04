// Server-only Supabase admin client.
// Uses SUPABASE_SECRET_KEY — never expose this to the browser.
// This client bypasses Row Level Security, for use in API routes and webhooks only.

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase admin credentials not configured. ' +
        'Set SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.',
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
