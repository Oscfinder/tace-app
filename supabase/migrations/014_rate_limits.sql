-- ============================================================================
-- 014_rate_limits.sql  (Phase 5, Ticket 5B)
--
-- A small, shared rate limiter for public forms (login, signup, forgot
-- password, contact). It lives in the database because the site runs on many
-- short-lived servers, so an in-memory counter would not be shared between them.
--
-- Only hashes are stored (never an IP address or an email). Nobody but the
-- service role can read or call anything here: RLS is on with no policies, and
-- the function is revoked from public, anon and authenticated.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  bucket text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_limit_events_lookup_idx
  on public.rate_limit_events (bucket, key_hash, created_at desc);
create index if not exists rate_limit_events_created_idx
  on public.rate_limit_events (created_at);

alter table public.rate_limit_events enable row level security;

-- Returns true if this attempt is allowed (and records it), false if the key has
-- already used up p_max attempts within the last p_window_seconds.
create or replace function public.rate_limit_hit(
  p_bucket text,
  p_key_hash text,
  p_max int,
  p_window_seconds int
) returns boolean as $$
declare
  used int;
begin
  if p_max < 1 or p_window_seconds < 1 then
    return false;
  end if;

  -- One attempt at a time per bucket+key, so two simultaneous requests can't
  -- both slip under the limit.
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_key_hash, 0));

  select count(*) into used
  from public.rate_limit_events
  where bucket = p_bucket
    and key_hash = p_key_hash
    and created_at > now() - make_interval(secs => p_window_seconds);

  if used >= p_max then
    return false;
  end if;

  insert into public.rate_limit_events (bucket, key_hash) values (p_bucket, p_key_hash);

  -- Housekeeping: nothing here is needed after a day.
  delete from public.rate_limit_events where created_at < now() - interval '1 day';
  return true;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function public.rate_limit_hit(text, text, int, int) from public, anon, authenticated;
grant execute on function public.rate_limit_hit(text, text, int, int) to service_role;
