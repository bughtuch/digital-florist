-- ============================================================
-- Digital Florist — Commercial Architecture
-- Migration 010
-- Run this manually in Supabase Dashboard → SQL Editor.
-- Migration 009 must be applied first.
-- ============================================================
-- This migration:
--   1. Adds default_currency to cities
--   2. Inserts New York (NYC)
--   3. Renames blooms.price_cents → price_minor; drops obsolete default
--   4. Renames gifts.amount_cents → amount_minor; drops obsolete constraints
--      and defaults; adds correct multi-currency constraints
--   5. Drops old bloom_lifecycle_guard trigger
--   6. Reprices the 15 live published Blooms to origin-city local pricing
--      (must run while trigger is dropped — price/currency are immutable
--      after publication in the new trigger)
--   7. Creates new enforce_bloom_lifecycle trigger (multi-currency rules)
--   8. Creates creators table with normalised-slug unique index
--   9. Creates creator_attributions table
--  10. Applies RLS
--  11. Creates resolve_creator_ref RPC
-- ============================================================


-- ============================================================
-- SECTION 1: CITIES — ADD DEFAULT CURRENCY
-- ============================================================

alter table public.cities
  add column if not exists default_currency char(3);

update public.cities set default_currency = 'GBP' where code = 'LON';
update public.cities set default_currency = 'AED' where code = 'DXB';
update public.cities set default_currency = 'EUR' where code = 'MIL';
update public.cities set default_currency = 'KRW' where code = 'SEL';
update public.cities set default_currency = 'JPY' where code = 'TYO';

-- Set a safe default for any unmatched rows (will be set explicitly after)
update public.cities set default_currency = 'USD' where default_currency is null;

alter table public.cities alter column default_currency set not null;

alter table public.cities
  add constraint cities_default_currency_supported
    check (default_currency in ('GBP', 'EUR', 'USD', 'JPY', 'KRW', 'AED'));


-- ============================================================
-- SECTION 2: NEW YORK
-- ============================================================

insert into public.cities (name, code, slug, display_order, active, default_currency)
values ('New York', 'NYC', 'new-york', 6, true, 'USD')
on conflict (code) do nothing;


-- ============================================================
-- SECTION 3: BLOOMS — RENAME price_cents → price_minor
-- ============================================================
-- PostgreSQL preserves all data and automatically updates
-- CHECK constraint expressions that reference the renamed column.
-- The bloom_lifecycle_guard trigger is replaced in Section 7
-- because the function body uses dynamic SQL referencing column names.
-- ============================================================

alter table public.blooms
  rename column price_cents to price_minor;

-- Remove the obsolete $25 default — application must now supply explicit price
alter table public.blooms
  alter column price_minor drop default,
  alter column currency    drop default;

-- Add supported-currency constraint
alter table public.blooms
  add constraint blooms_currency_supported
    check (currency in ('GBP', 'EUR', 'USD', 'JPY', 'KRW', 'AED'));


-- ============================================================
-- SECTION 4: GIFTS — RENAME amount_cents → amount_minor
-- ============================================================

alter table public.gifts
  rename column amount_cents to amount_minor;

-- Drop old "$25 USD only" amount constraint (named in migration 003)
alter table public.gifts
  drop constraint if exists gifts_amount_cents;

-- Drop old USD-only currency constraint (created in migration 003)
alter table public.gifts
  drop constraint if exists gifts_currency;

-- Remove the obsolete $25/USD defaults — application must now supply explicit values
alter table public.gifts
  alter column amount_minor drop default,
  alter column currency     drop default;

-- New constraint: must be a positive amount
alter table public.gifts
  add constraint gifts_amount_minor_positive
    check (amount_minor > 0);

-- Add supported-currency constraint
alter table public.gifts
  add constraint gifts_currency_supported
    check (currency in ('GBP', 'EUR', 'USD', 'JPY', 'KRW', 'AED'));


-- ============================================================
-- SECTION 5: DROP OLD BLOOM LIFECYCLE TRIGGER
-- ============================================================
-- Must drop before repricing live Blooms in Section 6.
-- The old trigger enforced price_cents = 2500 / currency = 'USD'
-- and would reject the repricing updates.
-- ============================================================

drop trigger if exists bloom_lifecycle_guard on public.blooms;


-- ============================================================
-- SECTION 6: REPRICE LIVE PUBLISHED BLOOMS
-- ============================================================
-- The 15 Blooms inserted by migration 002 are real DB rows.
-- They were published at 2500 USD. Now that the old lifecycle
-- trigger is dropped, reprice them to origin-city launch rates
-- before the new immutable-price trigger is recreated.
--
-- After Section 7 the trigger will enforce that price_minor and
-- currency are immutable once published_at is set — so this
-- window is the only safe time to make these corrections.
--
-- City launch defaults:
--   LON  GBP  5000   (£50.00)
--   DXB  AED  75000  (AED 750.00)
--   MIL  EUR  5900   (€59.00)
--   SEL  KRW  189000 (₩189,000)
--   TYO  JPY  19800  (¥19,800)
--   NYC  USD  — (no published Blooms yet)
-- ============================================================

update public.blooms
set price_minor = 5000, currency = 'GBP'
where city_id = (select id from public.cities where code = 'LON');

update public.blooms
set price_minor = 75000, currency = 'AED'
where city_id = (select id from public.cities where code = 'DXB');

update public.blooms
set price_minor = 5900, currency = 'EUR'
where city_id = (select id from public.cities where code = 'MIL');

update public.blooms
set price_minor = 189000, currency = 'KRW'
where city_id = (select id from public.cities where code = 'SEL');

update public.blooms
set price_minor = 19800, currency = 'JPY'
where city_id = (select id from public.cities where code = 'TYO');


-- ============================================================
-- SECTION 7: CREATE NEW BLOOM LIFECYCLE TRIGGER
-- ============================================================
-- New rules:
--   - price_minor > 0  (any positive amount)
--   - currency must be in supported set
--   - Once published: price_minor and currency are immutable
--   - (All other lifecycle rules preserved unchanged)
-- ============================================================

create or replace function public.enforce_bloom_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- ── INSERT ────────────────────────────────────────────────────
  if tg_op = 'INSERT' then

    -- House list price must be positive
    if new.price_minor <= 0 then
      raise exception 'price_minor must be greater than zero';
    end if;

    -- Currency must be a supported House currency
    if new.currency not in ('GBP', 'EUR', 'USD', 'JPY', 'KRW', 'AED') then
      raise exception 'currency % is not a supported House currency', new.currency;
    end if;

    -- Edition invariants
    if new.edition_total <= 0 then
      raise exception 'edition_total must be greater than zero';
    end if;
    if new.edition_sold > new.edition_total then
      raise exception 'edition_sold (%) cannot exceed edition_total (%)',
        new.edition_sold, new.edition_total;
    end if;

    -- status / published_at must be consistent
    if new.status = 'draft' and new.published_at is not null then
      raise exception 'A draft Bloom must have published_at = NULL';
    end if;
    if new.status in ('available', 'archived') and new.published_at is null then
      raise exception 'A % Bloom must have published_at set', new.status;
    end if;

    return new;
  end if;

  -- ── UPDATE ────────────────────────────────────────────────────
  if tg_op = 'UPDATE' then

    -- House list price must be positive
    if new.price_minor <= 0 then
      raise exception 'price_minor must be greater than zero';
    end if;

    -- Currency must be a supported House currency
    if new.currency not in ('GBP', 'EUR', 'USD', 'JPY', 'KRW', 'AED') then
      raise exception 'currency % is not a supported House currency', new.currency;
    end if;

    -- edition_sold cannot exceed edition_total
    if new.edition_sold > new.edition_total then
      raise exception 'edition_sold (%) cannot exceed edition_total (%)',
        new.edition_sold, new.edition_total;
    end if;

    -- published_at cannot be cleared once set
    if old.published_at is not null and new.published_at is null then
      raise exception 'published_at cannot be cleared after publication';
    end if;

    -- archived cannot be reopened
    if old.status = 'archived' and new.status != 'archived' then
      raise exception 'An archived Bloom cannot be reopened';
    end if;

    -- published Bloom cannot return to draft
    if old.status = 'available' and new.status = 'draft' then
      raise exception 'A published Bloom cannot return to draft';
    end if;

    -- status / published_at must be consistent
    if new.status = 'draft' and new.published_at is not null then
      raise exception 'A draft Bloom must have published_at = NULL';
    end if;
    if new.status in ('available', 'archived') and new.published_at is null then
      raise exception 'A % Bloom must have published_at set', new.status;
    end if;

    -- Immutable identity and commercial fields — locked once published
    if old.published_at is not null then
      if new.slug is distinct from old.slug then
        raise exception 'slug cannot change after publication';
      end if;
      if new.city_id is distinct from old.city_id then
        raise exception 'city_id cannot change after publication';
      end if;
      if new.archive_code is distinct from old.archive_code then
        raise exception 'archive_code cannot change after publication';
      end if;
      if new.edition_total is distinct from old.edition_total then
        raise exception 'edition_total cannot change after publication';
      end if;
      if new.year is distinct from old.year then
        raise exception 'year cannot change after publication';
      end if;
      -- Price and currency are commercial terms — immutable after publication
      if new.price_minor is distinct from old.price_minor then
        raise exception 'price_minor cannot change after publication';
      end if;
      if new.currency is distinct from old.currency then
        raise exception 'currency cannot change after publication';
      end if;
    end if;

    return new;
  end if;

  -- ── DELETE ────────────────────────────────────────────────────
  if tg_op = 'DELETE' then
    -- Only draft Blooms can be deleted
    if old.status != 'draft' then
      raise exception 'Only draft Blooms can be deleted (status: %)', old.status;
    end if;
    -- Cannot delete if any editions have been issued
    if old.edition_sold > 0 then
      raise exception 'Cannot delete a Bloom that has issued editions';
    end if;
    -- Cannot delete if any Gift references this Bloom
    if exists (
      select 1 from gifts where bloom_id = old.id limit 1
    ) then
      raise exception 'Cannot delete a Bloom that has associated Gifts';
    end if;
    return old;
  end if;

  return null;
end;
$$;

create trigger bloom_lifecycle_guard
  before insert or update or delete on public.blooms
  for each row execute function public.enforce_bloom_lifecycle();


-- ============================================================
-- SECTION 8: CREATORS TABLE
-- ============================================================

create table public.creators (
  id              uuid        primary key default gen_random_uuid(),

  name            text        not null,

  slug            text        not null unique,

  city_id         uuid        references public.cities(id) on delete set null,

  -- Operational contact — never exposed publicly
  email           text,

  -- Commission in basis points: 4000 = 40%
  commission_bps  integer     not null default 4000
                                check (commission_bps >= 0 and commission_bps <= 10000),

  active          boolean     not null default true,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index creators_slug_idx    on public.creators (slug);
create index creators_active_idx  on public.creators (active);

-- Case-insensitive normalised uniqueness: prevents "Maya" and "maya" coexisting
create unique index creators_slug_normalized_unique
  on public.creators (lower(trim(slug)));

create trigger creators_updated_at
  before update on public.creators
  for each row execute function public.handle_updated_at();

-- ──────────────────────────────────────────────────────────────
-- RLS: Studio admins manage creators. Public sees nothing.
-- ──────────────────────────────────────────────────────────────
alter table public.creators enable row level security;
revoke all on public.creators from anon;
revoke all on public.creators from authenticated;

-- Studio admins can read all creators
create policy "studio_admin_select_creators"
  on public.creators for select
  to authenticated
  using (public.is_studio_admin());

-- Studio admins can insert creators
create policy "studio_admin_insert_creators"
  on public.creators for insert
  to authenticated
  with check (public.is_studio_admin());

-- Studio admins can update creators
create policy "studio_admin_update_creators"
  on public.creators for update
  to authenticated
  using  (public.is_studio_admin())
  with check (public.is_studio_admin());


-- ============================================================
-- SECTION 9: CREATOR ATTRIBUTIONS TABLE
-- ============================================================
-- Immutable commission snapshot at time of sale.
-- commission_bps and commission_amount_minor are snapshotted
-- and must never be recalculated from current creator rate.
-- ============================================================

create table public.creator_attributions (
  id                      uuid        primary key default gen_random_uuid(),

  creator_id              uuid        not null references public.creators(id),

  gift_id                 uuid        not null unique references public.gifts(id),

  -- Snapshot of commission rate at time of attribution — immutable
  commission_bps          integer     not null
                                        check (commission_bps >= 0 and commission_bps <= 10000),

  -- Integer commission: floor(amount_minor * commission_bps / 10000)
  commission_amount_minor integer     not null
                                        check (commission_amount_minor >= 0),

  currency                char(3)     not null,

  -- pending → approved (on payment) → paid (after payout)
  -- cancelled if gift is refunded/cancelled
  status                  text        not null default 'pending'
                                        check (status in (
                                          'pending', 'approved', 'paid', 'cancelled'
                                        )),

  created_at              timestamptz not null default now()
);

create index creator_attributions_creator_id_idx on public.creator_attributions (creator_id);
create index creator_attributions_gift_id_idx    on public.creator_attributions (gift_id);
create index creator_attributions_status_idx     on public.creator_attributions (status);

-- RLS: no direct access — server admin client only
alter table public.creator_attributions enable row level security;
revoke all on public.creator_attributions from anon, authenticated;


-- ============================================================
-- SECTION 10: resolve_creator_ref RPC
-- ============================================================
-- Safe server-side lookup: returns only creator_id, slug, active.
-- Does NOT return email or commission rate.
-- Called server-side during checkout to resolve referral cookie.
-- Uses normalised slug comparison consistent with the unique index.
-- ============================================================

create or replace function public.resolve_creator_ref(p_slug text)
returns table (
  creator_id uuid,
  slug       text,
  active     boolean
)
language sql
security definer
set search_path = public
as $$
  select id, slug, active
  from creators
  where lower(trim(slug)) = lower(trim(p_slug))
  limit 1;
$$;

-- Restrict: only service_role (server admin client) may call this
revoke execute on function public.resolve_creator_ref from public, anon, authenticated;
grant  execute on function public.resolve_creator_ref to service_role;


-- ============================================================
-- SECTION 11: NOTES
-- ============================================================
-- After applying this migration:
--
--   All 15 live published Blooms are now priced in their origin-city
--   currency (LON GBP, DXB AED, MIL EUR, SEL KRW, TYO JPY).
--   This repricing ran in Section 6 while the old trigger was
--   dropped — the new trigger now enforces price immutability.
--
--   New York is available as a city (empty — no Blooms yet).
--   Studio can create Blooms with any supported currency.
--   Creator referral architecture is in place.
--
--   The application no longer has implicit $25 USD defaults:
--   price_minor and currency defaults have been dropped from
--   both blooms and gifts — values must be supplied explicitly.
--
-- To add a creator:
--   insert into public.creators (name, slug, commission_bps, active)
--   values ('Maya Chen', 'maya', 4000, true);
-- ============================================================
