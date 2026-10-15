// src/app/studio/blooms/page.tsx

import { createClient } from '@/lib/supabase/server';
import BloomListClient from '@/components/studio/BloomListClient';
import type { DbCity } from '@/types';

type StudioBloomRow = {
  id: string; slug: string; title: string;
  status: 'draft' | 'available' | 'archived';
  archive_code: string; edition_sold: number; edition_total: number;
  display_order: number; year: number; featured: boolean;
  city: { name: string; code: string } | null;
  collection: { name: string; slug: string } | null;
};

export const dynamic = 'force-dynamic';

export default async function StudioBloomsPage() {
  const supabase = await createClient();

  const { data: blooms } = await supabase
    .from('blooms')
    .select(
      'id, slug, title, status, city_id, archive_code, edition_sold, edition_total, display_order, year, featured, city:cities(name, code), collection:collections(name, slug)',
    )
    .order('display_order', { ascending: true });

  const { data: cities } = await supabase
    .from('cities')
    .select('*')
    .order('display_order', { ascending: true });

  return (
    <BloomListClient
      blooms={(blooms ?? []) as unknown as StudioBloomRow[]}
      cities={(cities ?? []) as DbCity[]}
    />
  );
}
