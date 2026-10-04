-- ============================================================
-- Digital Florist — Reveal Tokens
-- Migration 004
-- Run this manually in Supabase Dashboard → SQL Editor.
-- Migration 003 must be applied first.
-- ============================================================

-- ——————————————————————————————————————
-- REVEAL TOKENS TABLE
-- ——————————————————————————————————————
-- Stores SHA-256 hashes of reveal tokens only.
-- The raw reveal token is NEVER stored — it is generated server-side,
-- emailed to the recipient (Build 05), and then discarded.
-- Lookup is performed by hashing the token from the URL and matching against token_hash.
-- ——————————————————————————————————————

create table public.reveal_tokens (
  id              uuid        primary key default gen_random_uuid(),
  gift_id         uuid        unique not null references public.gifts(id),

  -- SHA-256 hex of the raw token. Raw token never stored.
  token_hash      text        unique not null,

  created_at      timestamptz not null default now(),
  first_opened_at timestamptz,
  last_opened_at  timestamptz,
  open_count      integer     not null default 0,
  claimed_at      timestamptz,
  revoked_at      timestamptz
);

alter table public.reveal_tokens
  add constraint reveal_tokens_open_count_non_negative
    check (open_count >= 0);

create index reveal_tokens_token_hash_idx on public.reveal_tokens (token_hash);
create index reveal_tokens_gift_id_idx    on public.reveal_tokens (gift_id);

-- ——————————————————————————————————————
-- ROW LEVEL SECURITY
-- ——————————————————————————————————————

alter table public.reveal_tokens enable row level security;

-- No browser access — all reads/writes happen through the server admin client.
revoke all on public.reveal_tokens from anon, authenticated;

-- service_role retains full access (Supabase default).

-- ——————————————————————————————————————
-- TRACK REVEAL OPEN
-- ——————————————————————————————————————
-- Atomically records each view of a reveal link.
-- Sets first_opened_at on the first call, updates last_opened_at on every call,
-- increments open_count. Silently does nothing for revoked tokens.
-- ——————————————————————————————————————

create or replace function public.track_reveal_open(p_token_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update reveal_tokens
  set
    first_opened_at = coalesce(first_opened_at, now()),
    last_opened_at  = now(),
    open_count      = open_count + 1
  where token_hash  = p_token_hash
    and revoked_at  is null;
end;
$$;

revoke execute on function public.track_reveal_open from public, anon, authenticated;
grant  execute on function public.track_reveal_open to service_role;
