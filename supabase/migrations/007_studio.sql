-- ============================================================
-- Digital Florist — Studio
-- Migration 007
-- Run this manually in Supabase Dashboard → SQL Editor.
-- Migration 006 must be applied first.
-- ============================================================

-- ============================================================
-- SECTION 1: STUDIO ADMINS
-- ============================================================

-- ——————————————————————————————————————
-- studio_admins TABLE
-- ——————————————————————————————————————
-- Stores authorised House administrators who may access Studio.
-- Separate from Supabase auth — being authenticated is not enough.
-- Add admins manually: insert into public.studio_admins (email) values ('you@yourdomain.com');
-- ——————————————————————————————————————

create table public.studio_admins (
  id          uuid        primary key default gen_random_uuid(),
  email       text        not null,
  created_at  timestamptz not null default now(),
  active      boolean     not null default true
);

-- Unique index on normalised email — prevents case-variant duplicate admins.
create unique index studio_admins_email_idx
  on public.studio_admins (lower(trim(email)));

-- ——————————————————————————————————————
-- RLS on studio_admins
-- ——————————————————————————————————————
-- Normal users cannot read, insert, update, or delete admin records.
-- Management is done manually in SQL.
-- service_role retains full access (Supabase default).
-- ——————————————————————————————————————

alter table public.studio_admins enable row level security;
revoke all on public.studio_admins from anon, authenticated;


-- ============================================================
-- SECTION 2: IS_STUDIO_ADMIN()
-- ============================================================

-- ——————————————————————————————————————
-- is_studio_admin()
-- ——————————————————————————————————————
-- Returns true if the calling user is an active Studio administrator.
-- Fails closed: returns false for any missing/empty auth state.
-- SECURITY DEFINER so it can read studio_admins (which has no public RLS).
-- Called from RLS policies and application code alike.
-- Does NOT expose which emails are registered as admins.
-- ——————————————————————————————————————

create or replace function public.is_studio_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid;
  v_email text;
  v_exists boolean;
begin
  -- Require a valid session
  v_uid := auth.uid();
  if v_uid is null then
    return false;
  end if;

  -- Require a non-empty confirmed email in the JWT
  v_email := lower(trim((auth.jwt() ->> 'email')::text));
  if v_email is null or v_email = '' then
    return false;
  end if;

  -- Check for an active admin record
  select exists (
    select 1
    from studio_admins
    where lower(trim(email)) = v_email
      and active = true
  ) into v_exists;

  return coalesce(v_exists, false);
end;
$$;

-- Only authenticated users may call this function
revoke execute on function public.is_studio_admin() from public, anon;
grant  execute on function public.is_studio_admin() to authenticated;


-- ============================================================
-- SECTION 3: BLOOM RLS — STUDIO ADMIN POLICIES
-- ============================================================

-- ——————————————————————————————————————
-- The existing "public_read_published_blooms" policy remains unchanged.
-- Public visitors still only see available/archived published Blooms.
-- The policies below grant Studio admins additional access.
-- ——————————————————————————————————————

-- Studio admin: SELECT all Blooms (including drafts)
create policy "studio_admin_select_blooms"
  on public.blooms for select
  to authenticated
  using (public.is_studio_admin());

-- Studio admin: INSERT new Blooms
create policy "studio_admin_insert_blooms"
  on public.blooms for insert
  to authenticated
  with check (public.is_studio_admin());

-- Studio admin: UPDATE Blooms
-- Lifecycle trigger (Section 5) enforces immutability and valid transitions.
create policy "studio_admin_update_blooms"
  on public.blooms for update
  to authenticated
  using  (public.is_studio_admin())
  with check (public.is_studio_admin());

-- Studio admin: DELETE Blooms
-- Only draft Blooms with no gifts can be deleted (enforced by lifecycle trigger).
create policy "studio_admin_delete_blooms"
  on public.blooms for delete
  to authenticated
  using (public.is_studio_admin());


-- ============================================================
-- SECTION 4: BLOOM_TRANSLATIONS RLS — STUDIO ADMIN POLICIES
-- ============================================================

-- Studio admin: SELECT all translations (including for draft Blooms)
create policy "studio_admin_select_translations"
  on public.bloom_translations for select
  to authenticated
  using (public.is_studio_admin());

-- Studio admin: INSERT translations
create policy "studio_admin_insert_translations"
  on public.bloom_translations for insert
  to authenticated
  with check (public.is_studio_admin());

-- Studio admin: UPDATE translations
create policy "studio_admin_update_translations"
  on public.bloom_translations for update
  to authenticated
  using  (public.is_studio_admin())
  with check (public.is_studio_admin());

-- Studio admin: DELETE translations
create policy "studio_admin_delete_translations"
  on public.bloom_translations for delete
  to authenticated
  using (public.is_studio_admin());


-- ============================================================
-- SECTION 5: BLOOM LIFECYCLE TRIGGER
-- ============================================================

-- ——————————————————————————————————————
-- enforce_bloom_lifecycle()
-- ——————————————————————————————————————
-- Protects the database from invalid state transitions and
-- tampering with provenance data, regardless of how an update arrives.
--
-- On INSERT:
--   - price_cents must be 2500 and currency must be 'USD' (House price is fixed)
--   - edition_total must be positive
--   - edition_sold cannot exceed edition_total
--   - status/published_at must be consistent:
--       draft     → published_at must be NULL
--       available → published_at must NOT be NULL
--       archived  → published_at must NOT be NULL
--
-- On UPDATE:
--   - price_cents must be 2500 and currency must be 'USD' (House price is fixed)
--   - edition_sold cannot exceed edition_total
--   - published_at cannot be cleared once set
--   - archived Bloom cannot be reopened (archived → any other status)
--   - published Bloom cannot return to draft (available → draft)
--   - available → archived is the only allowed "forward" transition
--     (used by the finalize_paid_gift auto-archive path)
--   - status/published_at must be consistent (same rules as INSERT)
--   - Once published (published_at IS NOT NULL), these identity fields
--     are immutable: slug, city_id, archive_code, edition_total, year
--
-- On DELETE:
--   - Only drafts can be deleted
--   - Cannot delete if edition_sold > 0
--   - Cannot delete if any Gift references this Bloom
--
-- SECURITY DEFINER: runs as function owner so it can read gifts/cities
-- tables without depending on the caller's RLS context.
-- ——————————————————————————————————————

create or replace function public.enforce_bloom_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

  -- ── INSERT ────────────────────────────────────────────────────
  if tg_op = 'INSERT' then

    -- House price is permanent and fixed at $25 USD
    if new.price_cents != 2500 then
      raise exception 'price_cents must be 2500 — Digital Florist has one House price ($25 USD)';
    end if;
    if new.currency != 'USD' then
      raise exception 'currency must be USD — Digital Florist has one House price ($25 USD)';
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

    -- House price is permanent and fixed at $25 USD
    if new.price_cents != 2500 then
      raise exception 'price_cents must be 2500 — Digital Florist has one House price ($25 USD)';
    end if;
    if new.currency != 'USD' then
      raise exception 'currency must be USD — Digital Florist has one House price ($25 USD)';
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

    -- Immutable identity fields — locked once published
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
-- SECTION 6: ARCHIVE CODE UNIQUENESS
-- ============================================================

-- archive_code must be unique across all Blooms.
-- Existing codes (LON / 001, DXB / 001 etc.) are House identifiers
-- and must never collide.
-- Using a unique constraint on the column directly — all existing
-- seed data uses distinct codes so this is safe to apply.

alter table public.blooms
  add constraint blooms_archive_code_unique unique (archive_code);


-- ============================================================
-- SECTION 7: STUDIO ACTIVITY
-- ============================================================

-- ——————————————————————————————————————
-- studio_activity TABLE
-- ——————————————————————————————————————
-- Immutable audit log of key House actions on Blooms.
-- Records who did what and when.
-- Does NOT record customer data, private messages, or emails.
-- bloom_id is nullable (SET NULL) so deleting a draft doesn't
-- erase the activity record.
-- ——————————————————————————————————————

create table public.studio_activity (
  id            uuid        primary key default gen_random_uuid(),
  admin_user_id uuid        references auth.users(id) on delete set null,
  admin_email   text        not null,
  bloom_id      uuid        references public.blooms(id) on delete set null,
  action        text        not null
                              check (action in (
                                'created',
                                'published',
                                'archived',
                                'media_updated',
                                'translation_updated'
                              )),
  created_at    timestamptz not null default now()
);

create index studio_activity_bloom_id_idx  on public.studio_activity (bloom_id);
create index studio_activity_created_at_idx on public.studio_activity (created_at desc);

-- RLS: Studio admins can read all activity. Inserts happen server-side.
alter table public.studio_activity enable row level security;
revoke all on public.studio_activity from anon;

-- Authenticated admins can read activity log
create policy "studio_admin_read_activity"
  on public.studio_activity for select
  to authenticated
  using (public.is_studio_admin());

-- Authenticated admins can insert activity records
create policy "studio_admin_insert_activity"
  on public.studio_activity for insert
  to authenticated
  with check (public.is_studio_admin());

-- No delete — audit trail is permanent


-- ============================================================
-- SECTION 8: STORAGE BUCKETS
-- ============================================================

-- ——————————————————————————————————————
-- bloom-public bucket
-- ——————————————————————————————————————
-- Stores final public-facing still and motion assets.
-- Public read: yes (CDN-served).
-- Write: Studio admins only.
-- Size limit: 200 MB (covers motion assets; application validates still ≤ 50 MB).
-- ——————————————————————————————————————

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bloom-public',
  'bloom-public',
  true,
  209715200,  -- 200 MB (motion assets up to 200 MB)
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm']
)
on conflict (id) do nothing;

-- ——————————————————————————————————————
-- bloom-source bucket
-- ——————————————————————————————————————
-- Stores private House source photography and working files.
-- Public read: no.
-- Access: Studio admins only via signed URLs.
-- ——————————————————————————————————————

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bloom-source',
  'bloom-source',
  false,
  104857600,  -- 100 MB
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/tiff']
)
on conflict (id) do nothing;

-- ——————————————————————————————————————
-- Storage RLS policies
-- ——————————————————————————————————————
-- Public read for final assets only (bloom-public bucket).
-- Studio admin upload/update/delete for bloom-public.
-- Studio admin only for bloom-source (no public read ever).
-- ——————————————————————————————————————

-- Public SELECT on bloom-public (anon + authenticated)
create policy "bloom_public_assets_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'bloom-public');

-- Studio admin INSERT into bloom-public
create policy "studio_admin_bloom_public_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bloom-public'
    and public.is_studio_admin()
  );

-- Studio admin UPDATE in bloom-public
create policy "studio_admin_bloom_public_update"
  on storage.objects for update
  to authenticated
  using  (bucket_id = 'bloom-public' and public.is_studio_admin())
  with check (bucket_id = 'bloom-public' and public.is_studio_admin());

-- Studio admin DELETE from bloom-public
create policy "studio_admin_bloom_public_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'bloom-public' and public.is_studio_admin());

-- Studio admin full access to bloom-source (no public read)
create policy "studio_admin_bloom_source_all"
  on storage.objects for all
  to authenticated
  using  (bucket_id = 'bloom-source' and public.is_studio_admin())
  with check (bucket_id = 'bloom-source' and public.is_studio_admin());


-- ============================================================
-- SECTION 9: HOW TO ADD THE FIRST STUDIO ADMINISTRATOR
-- ============================================================
-- After applying this migration, run:
--
--   insert into public.studio_admins (email)
--   values ('YOUR-ADMIN-EMAIL');
--
-- Replace YOUR-ADMIN-EMAIL with the exact email address used
-- to sign in via Supabase Auth. Email matching is case-insensitive.
-- ============================================================
