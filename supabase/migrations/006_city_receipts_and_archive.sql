-- ============================================================
-- Digital Florist — City Receipts and House Archive
-- Migration 006
-- Run this manually in Supabase Dashboard → SQL Editor.
-- Migration 005 must be applied first.
-- ============================================================

-- ——————————————————————————————————————
-- CITY RECEIPTS TABLE
-- ——————————————————————————————————————
-- Immutable provenance record created for every paid, kept Bloom.
-- Snapshots bloom/city/gift data at creation time — future edits
-- to blooms or cities do not alter issued receipts.
-- One receipt per gift (unique on gift_id).
-- receipt_code format: DF-{CITY_CODE}-{ARCHIVE_NUM}-{EDITION}
--   e.g. DF-LON-001-019
-- ——————————————————————————————————————

create table public.city_receipts (
  id             uuid        primary key default gen_random_uuid(),
  gift_id        uuid        not null references public.gifts(id) on delete restrict,
  receipt_code   text        not null,
  bloom_title    text        not null,
  city_code      text        not null,
  city_name      text        not null,
  archive_code   text        not null,
  edition_number integer     not null,
  edition_total  integer     not null,
  sender_name    text        not null,
  created_at     timestamptz not null default now(),

  constraint city_receipts_gift_unique    unique (gift_id),
  constraint city_receipts_code_unique    unique (receipt_code),
  constraint city_receipts_edition_pos    check  (edition_number > 0),
  constraint city_receipts_total_pos      check  (edition_total  > 0)
);

create index city_receipts_city_code_idx on public.city_receipts (city_code);

-- ——————————————————————————————————————
-- ROW LEVEL SECURITY
-- ——————————————————————————————————————
-- No direct browser access — all reads happen through SECURITY DEFINER
-- functions that enforce auth.uid() ownership via vault_entries.
-- ——————————————————————————————————————

alter table public.city_receipts enable row level security;
revoke all on public.city_receipts from anon, authenticated;

-- service_role retains full access (Supabase default).

-- ——————————————————————————————————————
-- ENSURE CITY RECEIPT
-- ——————————————————————————————————————
-- Creates a City Receipt for a paid gift.
-- Idempotent: safe to call multiple times for the same gift_id.
-- Called from the Stripe webhook handler after finalize_paid_gift.
-- Restricted to service_role — never callable from the browser.
--
-- The receipt_code is built deterministically from immutable DB data:
--   DF-{city.code}-{archive_num_3d}-{edition_number_3d}
--   e.g. DF-LON-001-019
-- archive_num is extracted from bloom.archive_code ('LON / 001' → '001').
--
-- Return values:
--   { "ok": true,  "receipt_code": "DF-LON-001-019" }
--   { "error": "not_found" }    — gift not found
--   { "error": "not_paid" }     — gift not in paid status
--   { "error": "no_edition" }   — gift has no edition_number yet
-- ——————————————————————————————————————

create or replace function public.ensure_city_receipt(p_gift_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gift       gifts%rowtype;
  v_bloom      blooms%rowtype;
  v_city       cities%rowtype;
  v_code       text;
  v_archive_num text;
  v_existing   city_receipts%rowtype;
begin
  -- 1. Load the gift
  select * into v_gift
  from gifts
  where id = p_gift_id;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- 2. Gift must be paid
  if v_gift.status <> 'paid' then
    return jsonb_build_object('error', 'not_paid');
  end if;

  -- 3. Gift must have a finalised edition
  if v_gift.edition_number is null then
    return jsonb_build_object('error', 'no_edition');
  end if;

  -- 4. Idempotency — return existing receipt if already issued
  select * into v_existing
  from city_receipts
  where gift_id = p_gift_id;

  if found then
    return jsonb_build_object('ok', true, 'receipt_code', v_existing.receipt_code);
  end if;

  -- 5. Load bloom and city for snapshot data
  select * into v_bloom
  from blooms
  where id = v_gift.bloom_id;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  select * into v_city
  from cities
  where id = v_bloom.city_id;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- 6. Build receipt code: DF-{CITY}-{ARCHIVE_NUM_3D}-{EDITION_3D}
  --    archive_code format is e.g. 'LON / 001' — extract and pad the number part.
  v_archive_num := lpad(trim(split_part(v_bloom.archive_code, '/', 2)), 3, '0');
  v_code := 'DF-' || v_city.code || '-' || v_archive_num || '-' || lpad(v_gift.edition_number::text, 3, '0');

  -- 7. Insert the receipt (snapshot)
  insert into city_receipts (
    gift_id,
    receipt_code,
    bloom_title,
    city_code,
    city_name,
    archive_code,
    edition_number,
    edition_total,
    sender_name
  )
  values (
    v_gift.id,
    v_code,
    v_bloom.title,
    v_city.code,
    v_city.name,
    v_bloom.archive_code,
    v_gift.edition_number,
    v_bloom.edition_total,
    v_gift.sender_name
  );

  return jsonb_build_object('ok', true, 'receipt_code', v_code);
end;
$$;

-- Only service_role may call this — never callable from the browser
revoke execute on function public.ensure_city_receipt(uuid) from public, anon, authenticated;


-- ——————————————————————————————————————
-- GET RECEIPT FOR VAULT ENTRY
-- ——————————————————————————————————————
-- Returns the City Receipt for a vault entry.
-- Ownership is enforced: vault_entries.user_id must match auth.uid().
-- Returns no rows if the entry does not belong to the caller,
-- or if no receipt has been issued for the gift yet.
-- Safe data only — no email addresses exposed.
-- ——————————————————————————————————————

create or replace function public.get_receipt_for_vault_entry(p_entry_id uuid)
returns table (
  receipt_code   text,
  bloom_title    text,
  city_code      text,
  city_name      text,
  archive_code   text,
  edition_number integer,
  edition_total  integer,
  sender_name    text,
  issued_at      timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    cr.receipt_code,
    cr.bloom_title,
    cr.city_code,
    cr.city_name,
    cr.archive_code,
    cr.edition_number,
    cr.edition_total,
    cr.sender_name,
    cr.created_at   as issued_at
  from vault_entries ve
  join city_receipts cr on cr.gift_id = ve.gift_id
  where ve.id      = p_entry_id
    and ve.user_id = auth.uid();
end;
$$;

revoke execute on function public.get_receipt_for_vault_entry(uuid) from public, anon;
grant  execute on function public.get_receipt_for_vault_entry(uuid) to authenticated;
