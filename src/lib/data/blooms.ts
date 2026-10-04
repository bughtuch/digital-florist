// Data access layer — Blooms
// Falls back to seed data when Supabase is not configured.
// In production (env vars present), uses Supabase and does NOT fake data on failure.

import type { BloomWithRelations, DbCollection } from '@/types';
import { SEED_BLOOMS, SEED_COLLECTIONS } from './seed';

const BLOOM_SELECT = `
  *,
  city:cities(*),
  collection:collections(*)
` as const;

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// ——————————————————————————————————————
// getAllBlooms
// Returns all published blooms ordered for gallery display.
// ——————————————————————————————————————
export async function getAllBlooms(): Promise<BloomWithRelations[]> {
  if (!isSupabaseConfigured()) return SEED_BLOOMS;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blooms')
    .select(BLOOM_SELECT)
    .in('status', ['available', 'archived'])
    .not('published_at', 'is', null)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch blooms: ${error.message}`);
  return (data ?? []) as BloomWithRelations[];
}

// ——————————————————————————————————————
// getBloomBySlug
// ——————————————————————————————————————
export async function getBloomBySlug(
  slug: string,
): Promise<BloomWithRelations | null> {
  if (!isSupabaseConfigured()) {
    return SEED_BLOOMS.find((b) => b.slug === slug) ?? null;
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blooms')
    .select(BLOOM_SELECT)
    .eq('slug', slug)
    .in('status', ['available', 'archived'])
    .not('published_at', 'is', null)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch bloom "${slug}": ${error.message}`);
  return (data as BloomWithRelations | null);
}

// ——————————————————————————————————————
// getAllCollections
// ——————————————————————————————————————
export async function getAllCollections(): Promise<DbCollection[]> {
  if (!isSupabaseConfigured()) return SEED_COLLECTIONS;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch collections: ${error.message}`);
  return data ?? [];
}

// ——————————————————————————————————————
// Edition display helper
// "edition_sold = 18, edition_total = 250" → "019 / 250"
// ——————————————————————————————————————
export function getEditionDisplay(
  sold: number,
  total: number,
): { isArchived: boolean; label: string } {
  if (sold >= total) {
    return { isArchived: true, label: 'ARCHIVED' };
  }
  const next = sold + 1;
  return {
    isArchived: false,
    label: `${String(next).padStart(3, '0')} / ${total}`,
  };
}
