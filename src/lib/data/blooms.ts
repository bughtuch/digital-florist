// Data access layer — Blooms
// Falls back to seed data when Supabase is not configured.
// In production (env vars present), uses Supabase and does NOT fake data on failure.

import type { BloomWithRelations, DbCollection, DbBloomTranslation } from '@/types';
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
// getFeaturedBloom
// Returns the featured Bloom for the homepage hero.
// Prefers: featured=true, status=available, published.
// Falls back to first available published Bloom.
// ——————————————————————————————————————
export async function getFeaturedBloom(): Promise<BloomWithRelations | null> {
  if (!isSupabaseConfigured()) return null;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // First: featured + available + published
  const { data: featured } = await supabase
    .from('blooms')
    .select(BLOOM_SELECT)
    .eq('status', 'available')
    .not('published_at', 'is', null)
    .eq('featured', true)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (featured) return featured as BloomWithRelations;

  // Fallback: any available published bloom
  const { data: fallback } = await supabase
    .from('blooms')
    .select(BLOOM_SELECT)
    .eq('status', 'available')
    .not('published_at', 'is', null)
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  return (fallback as BloomWithRelations | null);
}

// ——————————————————————————————————————
// getBloomTranslations
// Fetches translations for a set of bloom IDs in a given locale.
// Returns empty map for English (uses canonical fields).
// ——————————————————————————————————————
export async function getBloomTranslations(
  locale: string,
  bloomIds: string[],
): Promise<Map<string, DbBloomTranslation>> {
  if (!isSupabaseConfigured() || locale === 'en' || bloomIds.length === 0) {
    return new Map();
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data } = await supabase
    .from('bloom_translations')
    .select('id, bloom_id, locale, translated_title, translated_house_line, translated_material_note')
    .eq('locale', locale)
    .in('bloom_id', bloomIds);

  const map = new Map<string, DbBloomTranslation>();
  for (const t of data ?? []) {
    map.set(t.bloom_id, t as DbBloomTranslation);
  }
  return map;
}

