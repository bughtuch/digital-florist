-- ============================================================
-- Digital Florist — Gifting and Payments
-- Migration 003
-- Run this manually in Supabase Dashboard → SQL Editor.
-- ============================================================

-- ——————————————————————————————————————
-- GIFTS TABLE
-- ——————————————————————————————————————

create table public.gifts (
  id                          uuid primary key default gen_random_uuid(),
  bloom_id                    uuid not null references public.blooms(id),

  sender_name                 text not null,
  sender_email                text not null,

  recipient_name              text not null,
  recipient_email             text not null,

  private_message             text not null,
  locale                      text not null default 'en',

  edition_number              integer,

  amount_cents                integer not null default 2500,
  currency                    char(3) not null default 'USD',

  status                      text not null default 'draft',

  stripe_checkout_session_id  text unique,
  stripe_payment_intent_id    text unique,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),
  paid_at                     timestamptz,
  expired_at                  timestamptz
);

-- ——————————————————————————————————————
-- GIFTS CONSTRAINTS
-- ——————————————————————————————————————

alter table public.gifts
  add constraint gifts_private_message_length
    check (char_length(private_message) <= 320),
  add constraint gifts_amount_cents
    check (amount_cents = 2500),
  add constraint gifts_currency
    check (currency = 'USD'),
  add constraint gifts_edition_number_positive
    check (edition_number is null or edition_number > 0),
  add constraint gifts_status
    check (status in ('draft', 'checkout_created', 'paid', 'expired', 'cancelled', 'refunded'));

-- Unique edition per bloom — prevents duplicate editions at the database level
create unique index gifts_bloom_edition_unique
  on public.gifts (bloom_id, edition_number)
  where edition_number is not null;

-- Supporting indexes
create index gifts_bloom_id_idx        on public.gifts (bloom_id);
create index gifts_status_idx          on public.gifts (status);
create index gifts_session_id_idx      on public.gifts (stripe_checkout_session_id);

-- ——————————————————————————————————————
-- GIFTS UPDATED_AT TRIGGER
-- ——————————————————————————————————————

create trigger gifts_updated_at
  before update on public.gifts
  for each row execute function public.handle_updated_at();

-- ——————————————————————————————————————
-- STRIPE WEBHOOK EVENTS TABLE
-- (idempotency log — prevents double-processing retried webhooks)
-- ——————————————————————————————————————

create table public.stripe_webhook_events (
  id               uuid primary key default gen_random_uuid(),
  stripe_event_id  text unique not null,
  event_type       text not null,
  processed_at     timestamptz not null,
  created_at       timestamptz not null default now()
);

create index stripe_webhook_events_event_id_idx
  on public.stripe_webhook_events (stripe_event_id);

-- ——————————————————————————————————————
-- ROW LEVEL SECURITY
-- ——————————————————————————————————————

-- Enable RLS on both tables
alter table public.gifts                enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- Revoke all direct access from browser roles.
-- All writes happen server-side through the admin client (service_role),
-- which bypasses RLS automatically.
revoke all on public.gifts                from anon, authenticated;
revoke all on public.stripe_webhook_events from anon, authenticated;

-- No SELECT/INSERT/UPDATE/DELETE policies are created for anon or authenticated.
-- The absence of policies (combined with RLS enabled) means zero browser access.

-- service_role retains full access to both tables (Supabase default).

-- ——————————————————————————————————————
-- ATOMIC EDITION ALLOCATION FUNCTION
-- ——————————————————————————————————————
-- Called by:
--   1. The /api/stripe/webhook route after checkout.session.completed
--   2. The /[locale]/sent page as an idempotent fallback
--
-- Safe when called multiple times for the same paid gift.
-- Will never increment edition_sold more than once per gift.
-- ——————————————————————————————————————

create or replace function public.finalize_paid_gift(
  p_gift_id                    uuid,
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gift   gifts%rowtype;
  v_bloom  blooms%rowtype;
  v_next   integer;
begin

  -- Lock this gift row for the duration of the transaction.
  select * into v_gift from gifts where id = p_gift_id for update;

  if not found then
    raise exception 'finalize_paid_gift: gift not found — %', p_gift_id;
  end if;

  -- ── Idempotency guard ───────────────────────────────────────────────────
  -- If this gift is already paid and has an edition, return immediately.
  -- A Stripe webhook retry or a duplicate call from the /sent page will
  -- hit this branch and do nothing.
  if v_gift.status = 'paid' and v_gift.edition_number is not null then
    return jsonb_build_object(
      'success',        true,
      'edition_number', v_gift.edition_number,
      'idempotent',     true
    );
  end if;

  -- ── Lock the bloom row ──────────────────────────────────────────────────
  select * into v_bloom from blooms where id = v_gift.bloom_id for update;

  if not found then
    raise exception 'finalize_paid_gift: bloom not found — %', v_gift.bloom_id;
  end if;

  -- ── Inventory check ─────────────────────────────────────────────────────
  if v_bloom.edition_sold >= v_bloom.edition_total then
    raise exception 'finalize_paid_gift: bloom % is sold out (% / %)',
      v_bloom.slug, v_bloom.edition_sold, v_bloom.edition_total;
  end if;

  v_next := v_bloom.edition_sold + 1;

  -- Defensive ceiling check (should be impossible given constraint above)
  if v_next > v_bloom.edition_total then
    raise exception 'finalize_paid_gift: edition overflow for bloom %', v_bloom.slug;
  end if;

  -- ── Update bloom inventory ──────────────────────────────────────────────
  update blooms
  set
    edition_sold = v_next,
    -- Archive automatically when the last edition is sold
    status       = case
                     when v_next >= v_bloom.edition_total then 'archived'
                     else status
                   end,
    updated_at   = now()
  where id = v_bloom.id;

  -- ── Finalize gift ───────────────────────────────────────────────────────
  -- Both bloom and gift are updated in the same transaction.
  -- Either both succeed or both roll back — no partial state is possible.
  update gifts
  set
    edition_number             = v_next,
    status                     = 'paid',
    paid_at                    = now(),
    stripe_checkout_session_id = p_stripe_checkout_session_id,
    stripe_payment_intent_id   = p_stripe_payment_intent_id,
    updated_at                 = now()
  where id = p_gift_id;

  return jsonb_build_object(
    'success',        true,
    'edition_number', v_next,
    'idempotent',     false
  );

end;
$$;

-- Restrict direct execution.
-- Only service_role (used by the admin Supabase client in API routes) may call this.
-- anon and authenticated browser clients cannot invoke it directly.
revoke execute on function public.finalize_paid_gift from public, anon, authenticated;
grant  execute on function public.finalize_paid_gift to service_role;
