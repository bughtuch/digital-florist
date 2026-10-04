// Data access layer — Cities and Archive
// Falls back to seed data when Supabase is not configured.
// In production (env vars present), uses Supabase and does NOT fake data on failure.

import type { BloomWithRelations, DbCity } from '@/types';
import { SEED_BLOOMS, SEED_CITIES } from './seed';

const CITY_SELECT = '*' as const;

const BLOOM_SELECT = `
  *,
  city:cities(*),
  collection:collections(*)
` as const;

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL;
}

// ——————————————————————————————————————
// getAllCities
// Returns all active cities ordered by display_order.
// ——————————————————————————————————————
export async function getAllCities(): Promise<DbCity[]> {
  if (!isSupabaseConfigured()) return SEED_CITIES;

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cities')
    .select(CITY_SELECT)
    .eq('active', true)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch cities: ${error.message}`);
  return (data ?? []) as DbCity[];
}

// ——————————————————————————————————————
// getCityBySlug
// ——————————————————————————————————————
export async function getCityBySlug(slug: string): Promise<DbCity | null> {
  if (!isSupabaseConfigured()) {
    return SEED_CITIES.find((c) => c.slug === slug) ?? null;
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cities')
    .select(CITY_SELECT)
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();

  if (error) throw new Error(`Failed to fetch city "${slug}": ${error.message}`);
  return (data as DbCity | null);
}

// ——————————————————————————————————————
// getBloomsByCity
// Returns published blooms for a given city_id, ordered for display.
// ——————————————————————————————————————
export async function getBloomsByCity(cityId: string): Promise<BloomWithRelations[]> {
  if (!isSupabaseConfigured()) {
    return SEED_BLOOMS.filter((b) => b.city_id === cityId);
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('blooms')
    .select(BLOOM_SELECT)
    .eq('city_id', cityId)
    .in('status', ['available', 'archived'])
    .not('published_at', 'is', null)
    .order('display_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch blooms for city: ${error.message}`);
  return (data ?? []) as BloomWithRelations[];
}
