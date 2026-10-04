// ——————————————————————————————————————
// Digital Florist — core application types
// ——————————————————————————————————————

export type DbCity = {
  id: string;
  name: string;
  code: string;
  slug: string;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type DbCollection = {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  active: boolean;
  created_at: string;
};

export type BloomStatus = 'draft' | 'available' | 'archived';

export type DbBloom = {
  id: string;
  slug: string;
  title: string;
  house_line: string | null;
  city_id: string;
  collection_id: string;
  archive_code: string;
  edition_total: number;
  edition_sold: number;
  price_cents: number;
  currency: string;
  status: BloomStatus;
  still_asset_url: string | null;
  motion_asset_url: string | null;
  source_asset_url: string | null;
  material_note: string | null;
  year: number;
  display_order: number;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DbBloomTranslation = {
  id: string;
  bloom_id: string;
  locale: string;
  translated_title: string | null;
  translated_house_line: string | null;
  translated_material_note: string | null;
};

// Application type — bloom with resolved relations
export type BloomWithRelations = DbBloom & {
  city: DbCity;
  collection: DbCollection;
};

// Edition display helper output
export type EditionDisplay = {
  isArchived: boolean;
  label: string; // e.g. "019 / 250" or "ARCHIVED"
};
