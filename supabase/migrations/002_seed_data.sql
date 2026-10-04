-- ============================================================
-- Digital Florist — Seed Data
-- Migration 002 — Run after 001_initial_schema.sql
-- 15 launch Blooms across 5 cities (3 per city)
-- ============================================================

-- ——————————————————————————————————————
-- CITIES
-- ——————————————————————————————————————
insert into public.cities (name, code, slug, display_order) values
  ('London',  'LON', 'london',  1),
  ('Dubai',   'DXB', 'dubai',   2),
  ('Milano',  'MIL', 'milano',  3),
  ('Seoul',   'SEL', 'seoul',   4),
  ('Tokyo',   'TYO', 'tokyo',   5);

-- ——————————————————————————————————————
-- COLLECTIONS
-- ——————————————————————————————————————
insert into public.collections (name, slug, display_order) values
  ('AFTERHOURS', 'afterhours', 1),
  ('MORNING',    'morning',    2),
  ('MEMORY',     'memory',     3),
  ('RITUAL',     'ritual',     4),
  ('CITY',       'city',       5);

-- ——————————————————————————————————————
-- BLOOMS
-- Using subselects to reference cities/collections by slug
-- ——————————————————————————————————————
insert into public.blooms
  (slug, title, house_line, city_id, collection_id, archive_code,
   edition_total, edition_sold, price_cents, currency, status,
   material_note, year, display_order, featured, published_at)
values

  -- LONDON (LON)
  (
    'black-calla', 'BLACK CALLA',
    'For what I couldn''t say properly.',
    (select id from public.cities where slug = 'london'),
    (select id from public.collections where slug = 'memory'),
    'LON / 001', 250, 18, 2500, 'USD', 'available',
    'Obsidian / velvet field study',
    2026, 1, true, now()
  ),
  (
    'crimson-study', 'CRIMSON STUDY',
    'Saturated hours.',
    (select id from public.cities where slug = 'london'),
    (select id from public.collections where slug = 'afterhours'),
    'LON / 002', 100, 7, 2500, 'USD', 'available',
    'Carmine / oxide surface',
    2026, 2, false, now()
  ),
  (
    'after-rain', 'AFTER RAIN',
    'The city, after the weather.',
    (select id from public.cities where slug = 'london'),
    (select id from public.collections where slug = 'morning'),
    'LON / 003', 500, 34, 2500, 'USD', 'available',
    'Slate / morning diffusion',
    2026, 3, false, now()
  ),

  -- DUBAI (DXB)
  (
    'white-heat', 'WHITE HEAT',
    'Light that touches nothing.',
    (select id from public.cities where slug = 'dubai'),
    (select id from public.collections where slug = 'city'),
    'DXB / 001', 250, 12, 2500, 'USD', 'available',
    'Alabaster / bleached aperture',
    2026, 4, false, now()
  ),
  (
    'glass-orchid', 'GLASS ORCHID',
    'Something worth keeping.',
    (select id from public.cities where slug = 'dubai'),
    (select id from public.collections where slug = 'ritual'),
    'DXB / 002', 100, 3, 2500, 'USD', 'available',
    'Crystal / refraction study',
    2026, 5, false, now()
  ),
  (
    'midnight-ivory', 'MIDNIGHT IVORY',
    'After the guests have gone.',
    (select id from public.cities where slug = 'dubai'),
    (select id from public.collections where slug = 'afterhours'),
    'DXB / 003', 500, 61, 2500, 'USD', 'available',
    'Bone / late atmosphere',
    2026, 6, false, now()
  ),

  -- MILANO (MIL)
  (
    'rosa-nera', 'ROSA NERA',
    'No occasion. Just you.',
    (select id from public.cities where slug = 'milano'),
    (select id from public.collections where slug = 'memory'),
    'MIL / 001', 250, 22, 2500, 'USD', 'available',
    'Midnight rose / archive pigment',
    2026, 7, false, now()
  ),
  (
    'oxblood', 'OXBLOOD',
    'For a table that meant something.',
    (select id from public.cities where slug = 'milano'),
    (select id from public.collections where slug = 'ritual'),
    'MIL / 002', 100, 9, 2500, 'USD', 'available',
    'Deep garnet / cold press',
    2026, 8, false, now()
  ),
  (
    'sculpture-i', 'SCULPTURE I',
    'First light on cold stone.',
    (select id from public.cities where slug = 'milano'),
    (select id from public.collections where slug = 'morning'),
    'MIL / 003', 500, 44, 2500, 'USD', 'available',
    'Marble ground / natural diffusion',
    2026, 9, false, now()
  ),

  -- SEOUL (SEL)
  (
    'clear-peony', 'CLEAR PEONY',
    'Eight in the morning. Already perfect.',
    (select id from public.cities where slug = 'seoul'),
    (select id from public.collections where slug = 'morning'),
    'SEL / 001', 250, 15, 2500, 'USD', 'available',
    'Silk / morning aperture',
    2026, 10, false, now()
  ),
  (
    'chrome-petal', 'CHROME PETAL',
    'Everything speeds up. This stays still.',
    (select id from public.cities where slug = 'seoul'),
    (select id from public.collections where slug = 'city'),
    'SEL / 002', 100, 6, 2500, 'USD', 'available',
    'Metallic / urban pressure',
    2026, 11, false, now()
  ),
  (
    'soft-signal', 'SOFT SIGNAL',
    'After midnight.',
    (select id from public.cities where slug = 'seoul'),
    (select id from public.collections where slug = 'afterhours'),
    'SEL / 003', 500, 88, 2500, 'USD', 'available',
    'Charcoal / distilled hour',
    2026, 12, false, now()
  ),

  -- TOKYO (TYO)
  (
    'paper-camellia', 'PAPER CAMELLIA',
    'The ceremony is the point.',
    (select id from public.cities where slug = 'tokyo'),
    (select id from public.collections where slug = 'ritual'),
    'TYO / 001', 250, 31, 2500, 'USD', 'available',
    'Washi / ceremony trace',
    2026, 13, false, now()
  ),
  (
    'ink-bloom', 'INK BLOOM',
    'Left behind, but not forgotten.',
    (select id from public.cities where slug = 'tokyo'),
    (select id from public.collections where slug = 'memory'),
    'TYO / 002', 100, 0, 2500, 'USD', 'available',
    'Sumi / memory suspension',
    2026, 14, false, now()
  ),
  (
    'still-stem', 'STILL STEM',
    'Before anything has been decided.',
    (select id from public.cities where slug = 'tokyo'),
    (select id from public.collections where slug = 'morning'),
    'TYO / 003', 500, 127, 2500, 'USD', 'available',
    'Rice field / held moment',
    2026, 15, false, now()
  );
