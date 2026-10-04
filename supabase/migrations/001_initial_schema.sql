-- ============================================================
-- Digital Florist — Initial Schema
-- Migration 001
-- Run this in your Supabase project SQL editor or via CLI.
-- ============================================================

-- Required extension
create extension if not exists "uuid-ossp";

-- ——————————————————————————————————————
-- TABLES
-- ——————————————————————————————————————

create table public.cities (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  code           char(3) not null unique,
  slug           text not null unique,
  display_order  smallint not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.collections (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  slug           text not null unique,
  display_order  smallint not null default 0,
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.blooms (
  id               uuid primary key default uuid_generate_v4(),
  slug             text not null unique,
  title            text not null,
  house_line       text,
  city_id          uuid not null references public.cities(id),
  collection_id    uuid not null references public.collections(id),
  archive_code     text not null,
  edition_total    integer not null,
  edition_sold     integer not null default 0,
  price_cents      integer not null default 2500,
  currency         char(3) not null default 'USD',
  status           text not null default 'draft'
                     check (status in ('draft', 'available', 'archived')),
  still_asset_url  text,
  motion_asset_url text,
  source_asset_url text,
  material_note    text,
  year             smallint not null default 2026,
  display_order    smallint not null default 0,
  featured         boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.bloom_translations (
  id                      uuid primary key default uuid_generate_v4(),
  bloom_id                uuid not null references public.blooms(id) on delete cascade,
  locale                  text not null,
  translated_title        text,
  translated_house_line   text,
  translated_material_note text,
  unique (bloom_id, locale)
);

-- ——————————————————————————————————————
-- INDEXES
-- ——————————————————————————————————————

create index blooms_city_id_idx         on public.blooms(city_id);
create index blooms_collection_id_idx   on public.blooms(collection_id);
create index blooms_status_idx          on public.blooms(status);
create index blooms_display_order_idx   on public.blooms(display_order);
create index bloom_translations_bloom_idx  on public.bloom_translations(bloom_id);
create index bloom_translations_locale_idx on public.bloom_translations(locale);

-- ——————————————————————————————————————
-- UPDATED_AT TRIGGER
-- ——————————————————————————————————————

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger blooms_updated_at
  before update on public.blooms
  for each row execute function public.handle_updated_at();

-- ——————————————————————————————————————
-- ROW LEVEL SECURITY
-- ——————————————————————————————————————

alter table public.cities             enable row level security;
alter table public.collections        enable row level security;
alter table public.blooms             enable row level security;
alter table public.bloom_translations enable row level security;

-- Public read: active cities
create policy "public_read_active_cities"
  on public.cities for select
  using (active = true);

-- Public read: active collections
create policy "public_read_active_collections"
  on public.collections for select
  using (active = true);

-- Public read: published available/archived blooms only
create policy "public_read_published_blooms"
  on public.blooms for select
  using (
    status in ('available', 'archived')
    and published_at is not null
  );

-- Public read: translations for published blooms only
create policy "public_read_bloom_translations"
  on public.bloom_translations for select
  using (
    exists (
      select 1 from public.blooms b
      where b.id = bloom_id
        and b.status in ('available', 'archived')
        and b.published_at is not null
    )
  );

-- No anonymous writes on any table (Studio will use service role)
