-- ============================================================
-- Digital Florist — Delivery Engine
-- Migration 009
-- Run this manually in Supabase Dashboard → SQL Editor.
-- Migration 007 must be applied first.
-- ============================================================


-- ============================================================
-- SECTION 1: REVEAL TOKEN VERSIONING
-- ============================================================

-- ——————————————————————————————————————
-- token_scheme column
-- ——————————————————————————————————————
-- Distinguishes the generation mechanism for each Reveal token.
--
-- random_v1  — Build 04 mechanism: cryptographically random bytes.
--              Raw token is gone after generation; cannot be reproduced.
--              Retained for any existing development rows.
--
-- hmac_v1    — Build 09 mechanism: deterministic HMAC-SHA256 derived from
--              REVEAL_TOKEN_SECRET + gift_id. Allows idempotent email retry
--              without storing the raw credential.
--
-- Existing rows receive the default 'random_v1' — they remain valid and
-- the Reveal route is unaffected (lookup is always: SHA-256(raw) → token_hash).
-- ——————————————————————————————————————

alter table public.reveal_tokens
  add column token_scheme text not null default 'random_v1'
    check (token_scheme in ('random_v1', 'hmac_v1'));


-- ============================================================
-- SECTION 2: EMAIL DELIVERIES
-- ============================================================

-- ——————————————————————————————————————
-- email_deliveries TABLE
-- ——————————————————————————————————————
-- Immutable-ish audit log of transactional email delivery attempts.
-- Tracks delivery state without storing customer personal data.
--
-- What this table does NOT store:
--   - recipient email address   (canonical: gifts.recipient_email)
--   - sender email address      (canonical: gifts.sender_email)
--   - private message           (canonical: gifts.private_message)
--   - raw Reveal token          (never stored anywhere)
--   - Reveal URL                (never stored)
--   - full provider error dumps (may contain personal data)
--   - API keys
--
-- (gift_id, kind) UNIQUE enforces one delivery record per email type per Gift.
-- ——————————————————————————————————————

create table public.email_deliveries (
  id                   uuid        primary key default gen_random_uuid(),

  gift_id              uuid        not null
                                   references public.gifts(id)
                                   on delete restrict,

  kind                 text        not null
                                   check (kind in (
                                     'recipient_bloom',
                                     'sender_confirmation'
                                   )),

  status               text        not null default 'pending'
                                   check (status in (
                                     'pending',
                                     'sent',
                                     'failed'
                                   )),

  provider             text        not null default 'resend',

  provider_message_id  text,

  attempt_count        integer     not null default 0,
  last_attempt_at      timestamptz,
  sent_at              timestamptz,

  -- Sanitised error category only — never a full provider dump
  last_error_code      text,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (gift_id, kind)
);

create index email_deliveries_gift_id_idx on public.email_deliveries (gift_id);
create index email_deliveries_status_idx  on public.email_deliveries (status);
create index email_deliveries_kind_idx    on public.email_deliveries (kind);

-- ——————————————————————————————————————
-- updated_at trigger
-- ——————————————————————————————————————
-- Reuse handle_updated_at() from migration 001 if present;
-- create a local fallback only if needed.
-- ——————————————————————————————————————

do $$
begin
  if not exists (
    select 1 from pg_proc
    where proname = 'handle_updated_at'
      and pronamespace = (select oid from pg_namespace where nspname = 'public')
  ) then
    execute $func$
      create or replace function public.handle_updated_at()
      returns trigger language plpgsql as $t$
      begin new.updated_at = now(); return new; end;
      $t$;
    $func$;
  end if;
end;
$$;

create trigger email_deliveries_updated_at
  before update on public.email_deliveries
  for each row execute function public.handle_updated_at();

-- ——————————————————————————————————————
-- RLS on email_deliveries
-- ——————————————————————————————————————
-- No browser access at all — reads/writes happen through the server admin
-- client (service_role). Customers cannot query delivery state; no customer
-- can learn whether another customer's email was delivered.
-- ——————————————————————————————————————

alter table public.email_deliveries enable row level security;
revoke all on public.email_deliveries from anon, authenticated;

-- service_role retains full access (Supabase default).


-- ============================================================
-- SECTION 3: NOTES
-- ============================================================

-- After applying this migration:
--   - Existing reveal_tokens rows now have token_scheme = 'random_v1'
--   - New production delivery tokens will use token_scheme = 'hmac_v1'
--   - The Reveal route is unchanged: raw token → SHA-256 → token_hash lookup
--   - email_deliveries is populated by fulfillPaidGift() server function
--
-- To inspect delivery state (service_role only):
--   select * from email_deliveries order by created_at desc limit 50;
-- ============================================================
