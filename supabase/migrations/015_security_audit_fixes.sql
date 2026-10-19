-- ============================================================================
-- 015_security_audit_fixes.sql  (Phase 5, Ticket 5B: security & privacy audit)
--
-- Findings from the row-level security audit, each fixed here. Idempotent.
--
-- 1. get_role(), get_mentor_id(), get_sponsor_id() ignored profiles.status. A
--    SUSPENDED or INACTIVE admin (or a pending user) kept their full database
--    powers through the API, because the web app's checks were the only thing
--    stopping them. They now return a value only for an ACTIVE account.
--    This makes get_role() null for non-active users, and the profile
--    privilege guard compared it with `<> 'admin'` (null = guard skipped), which
--    would have let a pending user promote themselves. The guard is rewritten
--    so only the service role / SQL editor (auth.uid() is null) skips it.
-- 2. events were readable by every signed-in account, including children,
--    sponsors and mentors, and rows hold meeting minutes. Members and admins only.
-- 3. A child's account could read the internal staff notes on its own support
--    records (interventions.notes). It now reads a view without that column.
-- 4. Table/view privileges: anon and authenticated had INSERT/UPDATE/DELETE on
--    the public_beneficiaries view and TRUNCATE (which skips row-level security)
--    on every table. Removed, and removed for future tables too.
-- 5. Storage buckets 'documents', 'certificates' and 'public-assets' had no size
--    or file-type limit.
-- ============================================================================

-- 1 ---------------------------------------------------------------------------
create or replace function public.get_role() returns text as $$
  select role from public.profiles where id = auth.uid() and status = 'active';
$$ language sql security definer stable set search_path = public, pg_temp;

create or replace function public.get_mentor_id() returns uuid as $$
  select m.id
  from public.mentors m
  join public.profiles p on p.id = m.profile_id
  where m.profile_id = auth.uid() and p.status = 'active';
$$ language sql security definer stable set search_path = public, pg_temp;

create or replace function public.get_sponsor_id() returns uuid as $$
  select s.id
  from public.sponsors s
  join public.profiles p on p.id = s.profile_id
  where s.profile_id = auth.uid() and p.status = 'active';
$$ language sql security definer stable set search_path = public, pg_temp;

create or replace function public.prevent_profile_privilege_escalation() returns trigger as $$
begin
  -- auth.uid() is null for the service role and the SQL editor: those are
  -- trusted server-side paths and are not guarded. Everyone else is, unless they
  -- are an active admin.
  if auth.uid() is not null and public.get_role() is distinct from 'admin' then
    new.role := old.role;
    new.status := old.status;
    new.member_type := old.member_type;
    new.trustee_role := old.trustee_role;
    new.committee := old.committee;
    new.profile_completed := old.profile_completed;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- 2 ---------------------------------------------------------------------------
drop policy if exists "events_authenticated_select" on public.events;
drop policy if exists "events_member_select" on public.events;
create policy "events_member_select" on public.events
  for select using (public.get_role() = 'member');

-- 3 ---------------------------------------------------------------------------
drop policy if exists "interventions_beneficiary_select" on public.interventions;

create or replace view public.my_support as
  select i.id, i.beneficiary_id, i.type, i.amount, i.description, i.given_at, i.created_at
  from public.interventions i
  join public.beneficiaries b on b.id = i.beneficiary_id
  where b.profile_id = auth.uid();

-- 4 ---------------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.relname, c.relkind
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v')
  loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', r.relname);
    if r.relkind = 'v' then
      execute format('revoke insert, update, delete on public.%I from anon, authenticated', r.relname);
    end if;
  end loop;
end $$;

grant select on public.my_support to authenticated;
revoke all on public.my_support from anon;

alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

-- 5 ---------------------------------------------------------------------------
update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
  where id in ('documents', 'certificates');

update storage.buckets
  set file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
  where id = 'public-assets';
