-- ============================================================================
-- 007: member Home count, committee-linked events, resources upload limits.
-- Idempotent. Run after 006. Does not modify earlier migrations.
-- ============================================================================

-- 1. active_children_count: ONE number — beneficiaries with status = 'active'.
-- The old Home count read public_beneficiaries, which only includes children
-- whose guardians agreed to photography consent, so it under-counted.
-- Owned by the migration role (not security_invoker), so members can read the
-- total without any access to the beneficiaries table itself. Exposes a
-- count and nothing else — no ids, names or other columns.
drop view if exists public.active_children_count;
create view public.active_children_count as
select count(*)::int as total
from public.beneficiaries
where status = 'active';

revoke all on public.active_children_count from public, anon, authenticated;
grant select on public.active_children_count to authenticated;

-- 2. Events can belong to a committee. NULL = a general event for everyone.
-- Values match profiles.committee (the 9 committee names), so a member's
-- committee meeting is found by equality, not by guessing from the title.
alter table public.events add column if not exists committee text;
create index if not exists events_committee_date_idx
  on public.events (committee, event_date);

-- 3. Resources bucket: enforce the upload rules in storage itself (5MB;
-- PDF, JPG, PNG), so they hold even if a request bypasses the app's checks.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png']
where id = 'resources';
