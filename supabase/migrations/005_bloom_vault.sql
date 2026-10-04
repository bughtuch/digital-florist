-- ============================================================
-- Digital Florist — BloomVault
-- Migration 005
-- Run this manually in Supabase Dashboard → SQL Editor.
-- Migration 004 must be applied first.
-- ============================================================

-- ——————————————————————————————————————
-- VAULT ENTRIES TABLE
-- ——————————————————————————————————————
-- Stores Blooms that have been claimed to a user's private vault.
-- One entry per gift (unique on gift_id).
-- user_id references auth.users — set at claim time, never changes.
-- ——————————————————————————————————————

create table public.vault_entries (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  gift_id        uuid        not null references public.gifts(id)  on delete restrict,
  bloom_id       uuid        not null references public.blooms(id),
  edition_number integer     not null,
  claimed_at     timestamptz not null default now(),

  constraint vault_entries_gift_unique      unique (gift_id),
  constraint vault_entries_edition_positive check  (edition_number > 0)
);

create index vault_entries_user_id_idx  on public.vault_entries (user_id);
create index vault_entries_bloom_id_idx on public.vault_entries (bloom_id);

-- ——————————————————————————————————————
-- ROW LEVEL SECURITY
-- ——————————————————————————————————————
-- No direct browser access — all reads/writes happen through SECURITY DEFINER
-- functions that enforce auth.uid() ownership checks internally.
-- ——————————————————————————————————————

alter table public.vault_entries enable row level security;
revoke all on public.vault_entries from anon, authenticated;

-- service_role retains full access (Supabase default).

-- ——————————————————————————————————————
-- CLAIM BLOOM TO VAULT
-- ——————————————————————————————————————
-- Atomically claims a Bloom to the calling authenticated user's vault.
-- Verifies the gift recipient_email matches the caller's JWT email.
-- Idempotent: if the calling user has already claimed this gift, returns ok=true.
--
-- Return values:
--   { "ok": true,  "entry_id": "<uuid>" }         — claimed successfully
--   { "error": "unauthenticated" }                — no authenticated user
--   { "error": "not_found" }                      — token or gift not found
--   { "error": "gift_not_ready" }                 — gift not paid / no edition
--   { "error": "wrong_email" }                    — email mismatch
--   { "error": "already_claimed" }                — claimed by a different user
-- ——————————————————————————————————————

create or replace function public.claim_bloom_to_vault(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id    uuid;
  v_user_email text;
  v_token      reveal_tokens%rowtype;
  v_gift       gifts%rowtype;
  v_entry_id   uuid;
begin
  -- 1. Identify the authenticated caller
  v_user_id    := auth.uid();
  v_user_email := lower(trim((auth.jwt() ->> 'email')::text));

  if v_user_id is null then
    return jsonb_build_object('error', 'unauthenticated');
  end if;

  -- 2. Look up and lock the reveal token
  select * into v_token
  from reveal_tokens
  where token_hash = p_token_hash
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- 3. Already claimed?
  if v_token.claimed_at is not null then
    -- If it was claimed by this same user, return success (idempotent)
    select id into v_entry_id
    from vault_entries
    where gift_id = v_token.gift_id
      and user_id = v_user_id;

    if found then
      return jsonb_build_object('ok', true, 'entry_id', v_entry_id);
    end if;

    -- Claimed by someone else
    return jsonb_build_object('error', 'already_claimed');
  end if;

  -- 4. Load and lock the gift
  select * into v_gift
  from gifts
  where id = v_token.gift_id
  for update;

  if not found then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- 5. Gift must be paid and have a finalized edition
  if v_gift.status <> 'paid' or v_gift.edition_number is null then
    return jsonb_build_object('error', 'gift_not_ready');
  end if;

  -- 6. Email verification — recipient must match the signed-in user
  if lower(trim(v_gift.recipient_email)) <> v_user_email then
    return jsonb_build_object('error', 'wrong_email');
  end if;

  -- 7. Insert vault entry
  insert into vault_entries (user_id, gift_id, bloom_id, edition_number)
  values (v_user_id, v_gift.id, v_gift.bloom_id, v_gift.edition_number)
  returning id into v_entry_id;

  -- 8. Mark reveal token as claimed
  update reveal_tokens
  set claimed_at = now()
  where id = v_token.id;

  return jsonb_build_object('ok', true, 'entry_id', v_entry_id);
end;
$$;

-- Only authenticated users may call this function
revoke execute on function public.claim_bloom_to_vault(text) from public, anon;
grant  execute on function public.claim_bloom_to_vault(text) to authenticated;


-- ——————————————————————————————————————
-- GET MY VAULT
-- ——————————————————————————————————————
-- Returns all vault entries for the calling authenticated user.
-- Orders by claimed_at descending (most recently claimed first).
-- ——————————————————————————————————————

create or replace function public.get_my_vault()
returns table (
  entry_id        uuid,
  bloom_id        uuid,
  edition_number  integer,
  claimed_at      timestamptz,
  bloom_title     text,
  bloom_slug      text,
  still_asset_url text,
  city_code       text,
  city_name       text,
  collection_slug text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ve.id           as entry_id,
    b.id            as bloom_id,
    ve.edition_number,
    ve.claimed_at,
    b.title         as bloom_title,
    b.slug          as bloom_slug,
    b.still_asset_url,
    ci.code         as city_code,
    ci.name         as city_name,
    col.slug        as collection_slug
  from vault_entries ve
  join blooms      b   on b.id   = ve.bloom_id
  join cities      ci  on ci.id  = b.city_id
  join collections col on col.id = b.collection_id
  where ve.user_id = auth.uid()
  order by ve.claimed_at desc;
end;
$$;

revoke execute on function public.get_my_vault() from public, anon;
grant  execute on function public.get_my_vault() to authenticated;


-- ——————————————————————————————————————
-- GET MY VAULT ENTRY
-- ——————————————————————————————————————
-- Returns a single vault entry for the calling user.
-- Returns no rows if the entry does not belong to the caller —
-- ownership is enforced by the auth.uid() predicate, not by RLS.
-- ——————————————————————————————————————

create or replace function public.get_my_vault_entry(p_entry_id uuid)
returns table (
  entry_id        uuid,
  bloom_id        uuid,
  edition_number  integer,
  claimed_at      timestamptz,
  bloom_title     text,
  bloom_slug      text,
  still_asset_url text,
  city_code       text,
  city_name       text,
  collection_slug text,
  bloom_material  text,
  bloom_year      smallint,
  edition_total   integer,
  sender_name     text,
  private_message text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ve.id             as entry_id,
    b.id              as bloom_id,
    ve.edition_number,
    ve.claimed_at,
    b.title           as bloom_title,
    b.slug            as bloom_slug,
    b.still_asset_url,
    ci.code           as city_code,
    ci.name           as city_name,
    col.slug          as collection_slug,
    b.material_note   as bloom_material,
    b.year            as bloom_year,
    b.edition_total,
    g.sender_name,
    g.private_message
  from vault_entries ve
  join blooms      b   on b.id   = ve.bloom_id
  join cities      ci  on ci.id  = b.city_id
  join collections col on col.id = b.collection_id
  join gifts       g   on g.id   = ve.gift_id
  where ve.id      = p_entry_id
    and ve.user_id = auth.uid();
end;
$$;

revoke execute on function public.get_my_vault_entry(uuid) from public, anon;
grant  execute on function public.get_my_vault_entry(uuid) to authenticated;
