-- ============================================================================
-- 017_indexes_and_integrity.sql  (Phase 5, Ticket 5C)
--
-- PART 1: indexes for the queries the dashboards run (foreign keys, status
--         columns, created_at). Without them every list, count and per-child
--         lookup reads the whole table, which gets slow as the foundation grows.
--         Staff "created_by / reviewed_by / ..." columns are deliberately left
--         unindexed: those tables are small and are never searched by them.
-- PART 2: database rules that match the app's own rules, so they still hold if
--         the app is bypassed or two admins act at the same moment:
--           - a child can have only ONE open mentor match (pending, active or paused)
--           - a mentor can have at most 5 mentees open at once (pending or active)
--           - amounts are never negative (donations are above zero)
--         (Valid stage values were already enforced by a CHECK in migration 001.)
--
-- SAFE TO RUN: it first checks that the data already in the database obeys the new
-- rules. If anything does not, it STOPS with a message saying exactly what to fix
-- and changes nothing. Idempotent: safe to run more than once.
-- ============================================================================

-- ---- pre-flight: refuse to run if existing data would break a new rule --------
do $$
declare
  problems text := '';
  n bigint;
begin
  select count(*) into n from (
    select beneficiary_id from public.mentorship_matches
    where status in ('pending_consent', 'active', 'paused')
    group by beneficiary_id having count(*) > 1) x;
  if n > 0 then problems := problems || format(E'\n - %s child(ren) have more than one open mentor match (end all but one)', n); end if;

  select count(*) into n from (
    select mentor_id from public.mentorship_matches
    where status in ('pending_consent', 'active')
    group by mentor_id having count(*) > 5) x;
  if n > 0 then problems := problems || format(E'\n - %s mentor(s) have more than 5 mentees open (end or decline the extra matches)', n); end if;

  select count(*) into n from public.donations where amount <= 0;
  if n > 0 then problems := problems || format(E'\n - %s donation(s) have an amount of zero or less', n); end if;
  select count(*) into n from public.interventions where amount < 0;
  if n > 0 then problems := problems || format(E'\n - %s support record(s) have a negative amount', n); end if;
  select count(*) into n from public.projects where target_amount < 0;
  if n > 0 then problems := problems || format(E'\n - %s project(s) have a negative target amount', n); end if;
  select count(*) into n from public.project_beneficiaries where amount_needed < 0;
  if n > 0 then problems := problems || format(E'\n - %s project child link(s) have a negative amount needed', n); end if;
  select count(*) into n from public.sponsors where total_donated < 0;
  if n > 0 then problems := problems || format(E'\n - %s sponsor(s) have a negative total given', n); end if;

  if problems <> '' then
    raise exception E'017 stopped: existing data breaks a new rule. Fix these, then run it again (nothing was changed):%', problems;
  end if;
end $$;

-- ---- PART 1: indexes ----------------------------------------------------------
create index if not exists applications_status_created_idx on public.applications (status, created_at desc);

create index if not exists beneficiaries_profile_idx on public.beneficiaries (profile_id);
create index if not exists beneficiaries_sponsor_idx on public.beneficiaries (sponsor_id);
create index if not exists beneficiaries_mentor_idx on public.beneficiaries (mentor_id);
create index if not exists beneficiaries_application_idx on public.beneficiaries (application_id);
create index if not exists beneficiaries_stage_idx on public.beneficiaries (current_stage);
create index if not exists beneficiaries_status_idx on public.beneficiaries (status);

create index if not exists profiles_role_status_idx on public.profiles (role, status);

create index if not exists mentors_vetting_idx on public.mentors (vetting_status);

create index if not exists mentorship_matches_child_status_idx on public.mentorship_matches (beneficiary_id, status);
create index if not exists mentorship_matches_mentor_status_idx on public.mentorship_matches (mentor_id, status);

create index if not exists mentorship_messages_match_created_idx on public.mentorship_messages (match_id, created_at);
create index if not exists mentorship_messages_sender_created_idx on public.mentorship_messages (sender_id, created_at desc);
create index if not exists mentorship_messages_flagged_idx on public.mentorship_messages (created_at desc) where is_flagged;

create index if not exists mentorship_notes_match_idx on public.mentorship_notes (match_id, created_at desc);
create index if not exists mentorship_notes_mentor_idx on public.mentorship_notes (mentor_id);

create index if not exists progress_updates_child_created_idx on public.progress_updates (beneficiary_id, created_at desc);
create index if not exists interventions_child_given_idx on public.interventions (beneficiary_id, given_at desc);
create index if not exists thank_you_child_idx on public.thank_you_messages (beneficiary_id);
create index if not exists thank_you_sponsor_idx on public.thank_you_messages (sponsor_id);
create index if not exists thank_you_status_created_idx on public.thank_you_messages (status, created_at desc);

create index if not exists project_beneficiaries_child_idx on public.project_beneficiaries (beneficiary_id);
create index if not exists projects_published_status_idx on public.projects (is_published, status);
create index if not exists stories_published_idx on public.stories (is_published, published_at desc);
create index if not exists stories_child_idx on public.stories (beneficiary_id);
create index if not exists announcements_published_idx on public.announcements (is_published, published_at desc);
create index if not exists events_date_idx on public.events (event_date);
create index if not exists event_rsvps_profile_idx on public.event_rsvps (profile_id);

create index if not exists donations_child_idx on public.donations (beneficiary_id);

create index if not exists safeguarding_child_idx on public.safeguarding_concerns (beneficiary_id);
create index if not exists safeguarding_raised_by_idx on public.safeguarding_concerns (raised_by);
create index if not exists safeguarding_match_idx on public.safeguarding_concerns (match_id);

create index if not exists notifications_unread_idx on public.notifications (profile_id, type) where is_read = false;

-- ---- PART 2: rules that match the app ----------------------------------------
-- One open match per child. A partial unique index, so finished (completed or
-- terminated) matches can pile up as history.
create unique index if not exists mentorship_matches_one_open_per_child
  on public.mentorship_matches (beneficiary_id)
  where status in ('pending_consent', 'active', 'paused');

-- At most 5 mentees open (pending consent or active) per mentor. The app checks
-- this too (MAX_ACTIVE_MENTEES in lib/mentoring/constants.ts: change both). The
-- lock makes two admins matching the same mentor at the same moment safe.
create or replace function public.enforce_mentor_cap() returns trigger as $$
declare
  open_count int;
begin
  perform pg_advisory_xact_lock(hashtextextended('mentor-cap:' || new.mentor_id::text, 0));
  select count(*) into open_count
  from public.mentorship_matches
  where mentor_id = new.mentor_id and status in ('pending_consent', 'active');
  if open_count >= 5 then
    raise exception 'This mentor already has 5 mentees (the maximum).' using errcode = 'check_violation';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists c_enforce_mentor_cap on public.mentorship_matches;
create trigger c_enforce_mentor_cap
  before insert on public.mentorship_matches
  for each row execute function public.enforce_mentor_cap();

-- Money is never negative; a donation is always above zero.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'donations_amount_positive') then
    alter table public.donations add constraint donations_amount_positive check (amount > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'interventions_amount_non_negative') then
    alter table public.interventions add constraint interventions_amount_non_negative check (amount is null or amount >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'projects_target_non_negative') then
    alter table public.projects add constraint projects_target_non_negative check (target_amount is null or target_amount >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'project_beneficiaries_amount_non_negative') then
    alter table public.project_beneficiaries add constraint project_beneficiaries_amount_non_negative check (amount_needed is null or amount_needed >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sponsors_total_non_negative') then
    alter table public.sponsors add constraint sponsors_total_non_negative check (total_donated is null or total_donated >= 0);
  end if;
end $$;
