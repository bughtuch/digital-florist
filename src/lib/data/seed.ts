// Local seed data — mirrors 002_seed_data.sql
// Used as fallback when NEXT_PUBLIC_SUPABASE_URL is not set (local dev / CI).
// Do NOT use as production data when Supabase is available.

import type { BloomWithRelations, DbCity, DbCollection } from '@/types';

const CITIES: Record<string, DbCity> = {
  london:  { id: 'city-1', name: 'London',  code: 'LON', slug: 'london',  display_order: 1, active: true, created_at: '' },
  dubai:   { id: 'city-2', name: 'Dubai',   code: 'DXB', slug: 'dubai',   display_order: 2, active: true, created_at: '' },
  milano:  { id: 'city-3', name: 'Milano',  code: 'MIL', slug: 'milano',  display_order: 3, active: true, created_at: '' },
  seoul:   { id: 'city-4', name: 'Seoul',   code: 'SEL', slug: 'seoul',   display_order: 4, active: true, created_at: '' },
  tokyo:   { id: 'city-5', name: 'Tokyo',   code: 'TYO', slug: 'tokyo',   display_order: 5, active: true, created_at: '' },
};

const COLLECTIONS: Record<string, DbCollection> = {
  afterhours: { id: 'col-1', name: 'AFTERHOURS', slug: 'afterhours', display_order: 1, active: true, created_at: '' },
  morning:    { id: 'col-2', name: 'MORNING',    slug: 'morning',    display_order: 2, active: true, created_at: '' },
  memory:     { id: 'col-3', name: 'MEMORY',     slug: 'memory',     display_order: 3, active: true, created_at: '' },
  ritual:     { id: 'col-4', name: 'RITUAL',     slug: 'ritual',     display_order: 4, active: true, created_at: '' },
  city:       { id: 'col-5', name: 'CITY',       slug: 'city',       display_order: 5, active: true, created_at: '' },
};

function b(
  slug: string, title: string, houseLine: string,
  citySlug: string, collectionSlug: string, archiveCode: string,
  editionTotal: number, editionSold: number,
  materialNote: string, displayOrder: number, featured: boolean,
): BloomWithRelations {
  return {
    id: `bloom-${displayOrder}`,
    slug, title,
    house_line: houseLine,
    city_id: CITIES[citySlug].id,
    collection_id: COLLECTIONS[collectionSlug].id,
    archive_code: archiveCode,
    edition_total: editionTotal,
    edition_sold: editionSold,
    price_cents: 2500,
    currency: 'USD',
    status: editionSold >= editionTotal ? 'archived' : 'available',
    still_asset_url: null,
    motion_asset_url: null,
    source_asset_url: null,
    material_note: materialNote,
    year: 2026,
    display_order: displayOrder,
    featured,
    published_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    city: CITIES[citySlug],
    collection: COLLECTIONS[collectionSlug],
  };
}

export const SEED_BLOOMS: BloomWithRelations[] = [
  // LONDON
  b('black-calla',    'BLACK CALLA',    "For what I couldn't say properly.", 'london', 'memory',     'LON / 001', 250, 18,  'Obsidian / velvet field study',    1, true),
  b('crimson-study',  'CRIMSON STUDY',  'Saturated hours.',                   'london', 'afterhours', 'LON / 002', 100,  7,  'Carmine / oxide surface',          2, false),
  b('after-rain',     'AFTER RAIN',     'The city, after the weather.',        'london', 'morning',    'LON / 003', 500, 34,  'Slate / morning diffusion',        3, false),
  // DUBAI
  b('white-heat',     'WHITE HEAT',     'Light that touches nothing.',         'dubai',  'city',       'DXB / 001', 250, 12,  'Alabaster / bleached aperture',    4, false),
  b('glass-orchid',   'GLASS ORCHID',   'Something worth keeping.',            'dubai',  'ritual',     'DXB / 002', 100,  3,  'Crystal / refraction study',       5, false),
  b('midnight-ivory', 'MIDNIGHT IVORY', 'After the guests have gone.',         'dubai',  'afterhours', 'DXB / 003', 500, 61,  'Bone / late atmosphere',           6, false),
  // MILANO
  b('rosa-nera',      'ROSA NERA',      'No occasion. Just you.',              'milano', 'memory',     'MIL / 001', 250, 22,  'Midnight rose / archive pigment',  7, false),
  b('oxblood',        'OXBLOOD',        'For a table that meant something.',   'milano', 'ritual',     'MIL / 002', 100,  9,  'Deep garnet / cold press',         8, false),
  b('sculpture-i',    'SCULPTURE I',    'First light on cold stone.',          'milano', 'morning',    'MIL / 003', 500, 44,  'Marble ground / natural diffusion',9, false),
  // SEOUL
  b('clear-peony',    'CLEAR PEONY',    'Eight in the morning. Already perfect.', 'seoul', 'morning', 'SEL / 001', 250, 15,  'Silk / morning aperture',         10, false),
  b('chrome-petal',   'CHROME PETAL',   'Everything speeds up. This stays still.','seoul', 'city',    'SEL / 002', 100,  6,  'Metallic / urban pressure',       11, false),
  b('soft-signal',    'SOFT SIGNAL',    'After midnight.',                     'seoul',  'afterhours', 'SEL / 003', 500, 88,  'Charcoal / distilled hour',       12, false),
  // TOKYO
  b('paper-camellia', 'PAPER CAMELLIA', 'The ceremony is the point.',          'tokyo',  'ritual',     'TYO / 001', 250, 31,  'Washi / ceremony trace',          13, false),
  b('ink-bloom',      'INK BLOOM',      'Left behind, but not forgotten.',     'tokyo',  'memory',     'TYO / 002', 100,  0,  'Sumi / memory suspension',        14, false),
  b('still-stem',     'STILL STEM',     'Before anything has been decided.',   'tokyo',  'morning',    'TYO / 003', 500, 127, 'Rice field / held moment',        15, false),
];

export const SEED_COLLECTIONS = Object.values(COLLECTIONS);
