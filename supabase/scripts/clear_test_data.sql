-- ============================================================================
-- clear_test_data.sql  (Phase 5, Ticket 5E: no test data in production)
--
-- Run by hand in the Supabase SQL editor, ONCE, before launch, only if the
-- production project is the same one used for testing. (A fresh production
-- project needs no clean-up: run migrations 001 to 017 instead.)
--
-- It deletes EVERY row of application data (applications, children, mentors,
-- sponsors, donations, messages, notes, stories, projects, events,
-- notifications, rate-limit records, the audit log, ...) and EVERY account
-- except the emails listed in keep_emails below. site_settings (bank details,
-- contact details) is kept.
--
-- Safety:
--  * It starts as a DRY RUN: it makes the changes, prints the counts, then
--    deliberately fails so everything is rolled back. Read the counts in the
--    error message. Nothing is deleted until you change `dry_run` to false.
--  * It refuses to run if no kept email matches an existing admin account, so
--    you can't lock yourself out.
--  * There is no undo after a real run. Take a backup first (Supabase,
--    Database, Backups, or the export in docs/RUNBOOK.md).
--
-- It cannot delete files: empty the storage buckets in the dashboard
-- (Storage, each bucket, select all, Delete) after running it.
-- ============================================================================

do $$
declare
  -- EDIT THESE TWO LINES -----------------------------------------------------
  keep_emails text[] := array['REPLACE-WITH-REAL-ADMIN-1@example.org', 'REPLACE-WITH-REAL-ADMIN-2@example.org'];
  dry_run boolean := true;
  -- --------------------------------------------------------------------------

  keep_ids uuid[];
  report text := '';
  t text;
  n bigint;
  tables text[] := array[
    'mentorship_messages', 'mentorship_notes', 'mentorship_matches',
    'safeguarding_concerns', 'thank_you_messages', 'progress_updates',
    'interventions', 'career_assessments', 'project_beneficiaries',
    'event_rsvps', 'notifications', 'committee_updates', 'announcements',
    'donations', 'stories', 'events', 'projects',
    'application_submissions', 'applications',
    'beneficiaries', 'mentors', 'sponsors',
    'rate_limit_events', 'audit_log'
  ];
begin
  select coalesce(array_agg(u.id), '{}') into keep_ids
  from auth.users u
  where lower(u.email) = any (select lower(e) from unnest(keep_emails) e);

  if not exists (
    select 1 from public.profiles p
    where p.id = any(keep_ids) and p.role = 'admin' and p.status = 'active'
  ) then
    raise exception 'Stopped: none of keep_emails is an active admin account. Nothing changed.';
  end if;

  report := report || format('Keeping %s account(s).' || E'\n', array_length(keep_ids, 1));

  foreach t in array tables loop
    execute format('select count(*) from public.%I', t) into n;
    report := report || format('  %-26s %s rows deleted' || E'\n', t, n);
    -- DELETE (not TRUNCATE) so row-level rules and foreign keys are respected.
    -- audit_log is append-only for everyone but the table owner, which this is.
    execute format('alter table public.%I disable trigger user', t);
    execute format('delete from public.%I', t);
    execute format('alter table public.%I enable trigger user', t);
  end loop;

  select count(*) into n from public.profiles where id <> all(keep_ids);
  report := report || format('  %-26s %s rows deleted' || E'\n', 'profiles', n);
  delete from public.profiles where id <> all(keep_ids);

  select count(*) into n from auth.users where id <> all(keep_ids);
  report := report || format('  %-26s %s rows deleted' || E'\n', 'auth.users', n);
  delete from auth.users where id <> all(keep_ids);

  -- Counts that should now all be zero (or only the kept admins).
  select count(*) into n from public.profiles;
  report := report || format('After: %s profile(s) remain.' || E'\n', n);
  select count(*) into n from auth.users;
  report := report || format('After: %s sign-in account(s) remain.' || E'\n', n);

  if dry_run then
    raise exception E'DRY RUN, nothing was changed. This is what a real run would do:\n%\nSet dry_run to false to do it.', report;
  end if;

  raise notice E'DONE. Deleted:\n%', report;
end
$$;
