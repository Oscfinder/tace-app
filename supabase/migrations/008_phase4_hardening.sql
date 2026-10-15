-- ============================================================================
-- Ticket 4.0 — Phase 4 schema & privacy hardening. Idempotent (safe to run
-- twice). New file; earlier migrations are untouched.
--
-- WHY: row-level security works per ROW, not per column. A sponsor or mentor
-- allowed to SELECT a beneficiaries row could read every column (address,
-- guardian phone, household income, health). They now get narrow views only.
--
-- To see what policies exist before/after running this:
--   select policyname, cmd, qual from pg_policies where tablename = 'beneficiaries';
-- ============================================================================

-- ============================================================================
-- 1. STOP FULL-ROW ACCESS FOR SPONSORS AND MENTORS
-- ============================================================================

-- Drop every SELECT/ALL policy on beneficiaries except the two we keep
-- (admin, and the beneficiary's own record). This catches the sponsor and
-- mentor policies from 001 whatever they are called.
do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'beneficiaries'
      and cmd in ('SELECT', 'ALL')
      and policyname not in ('beneficiaries_admin_all', 'beneficiaries_self_select')
  loop
    execute format('drop policy %I on public.beneficiaries', r.policyname);
    raise notice 'Dropped beneficiaries policy: %', r.policyname;
  end loop;
end $$;

-- mentee_profiles needs subjects_skills, which exists on applications but was
-- never copied onto beneficiaries. Add it and backfill from the application.
alter table public.beneficiaries add column if not exists subjects_skills text;
update public.beneficiaries b
set subjects_skills = a.subjects_skills
from public.applications a
where a.id = b.application_id and b.subjects_skills is null and a.subjects_skills is not null;

-- (Views use CREATE OR REPLACE, not DROP: policies below depend on them, so a
-- second run would otherwise fail.)
-- sponsor_children: the calling sponsor's linked children, safe columns only.
-- Security-definer (owned by the migration role) and filtered by auth.uid().
-- NO surname, address, phone, email, guardian data, income, health, disabilities.
create or replace view public.sponsor_children as
select
  b.id,
  b.first_name,
  date_part('year', age(b.date_of_birth))::int as age,
  b.current_stage,
  b.stage_updated_at,
  b.photo_url,
  b.support_needed,
  b.interests,
  b.aspirations,
  b.class_level
from public.beneficiaries b
where b.sponsor_id in (select s.id from public.sponsors s where s.profile_id = auth.uid());

-- mentee_profiles: the calling mentor's children with an ACTIVE match.
create or replace view public.mentee_profiles as
select
  b.id,
  b.first_name,
  date_part('year', age(b.date_of_birth))::int as age,
  b.current_stage,
  b.stage_updated_at,
  b.photo_url,
  b.support_needed,
  b.interests,
  b.aspirations,
  b.class_level,
  b.edu_status,
  b.talents,
  b.subjects_skills,
  mm.id as match_id
from public.beneficiaries b
join public.mentorship_matches mm
  on mm.beneficiary_id = b.id and mm.status = 'active'
where mm.mentor_id in (select m.id from public.mentors m where m.profile_id = auth.uid());

-- sponsor_child_support: interventions for the calling sponsor's children.
-- beneficiary_id is included (the same id sponsor_children exposes) so a
-- sponsor with several children can tell whose support is whose.
create or replace view public.sponsor_child_support as
select
  i.beneficiary_id,
  i.type,
  i.description,
  i.amount,
  i.given_at
from public.interventions i
join public.beneficiaries b on b.id = i.beneficiary_id
where b.sponsor_id in (select s.id from public.sponsors s where s.profile_id = auth.uid());

do $$
declare v text;
begin
  foreach v in array array['sponsor_children', 'mentee_profiles', 'sponsor_child_support']
  loop
    execute format('revoke all on public.%I from public, anon, authenticated', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;

-- ---- Policies that used to rely on the sponsor/mentor beneficiaries access.
-- They query beneficiaries UNDER THE CALLER'S RLS, so without a rewrite they
-- would silently return nothing. Each now goes through the narrow views.

-- progress_updates: a sponsor sees only their linked child's rows.
drop policy if exists "progress_updates_sponsor_select" on public.progress_updates;
create policy "progress_updates_sponsor_select" on public.progress_updates for select
  using (exists (
    select 1 from public.sponsor_children sc where sc.id = progress_updates.beneficiary_id
  ));

-- thank-you messages: sponsor reads APPROVED messages from their own child.
drop policy if exists "thank_you_sponsor_select" on public.thank_you_messages;
create policy "thank_you_sponsor_select" on public.thank_you_messages for select
  using (
    status = 'approved'
    and exists (
      select 1 from public.sponsor_children sc where sc.id = thank_you_messages.beneficiary_id
    )
  );

-- career assessments: a mentor reads the result of a child they actively mentor.
drop policy if exists "career_assessments_mentor_select" on public.career_assessments;
create policy "career_assessments_mentor_select" on public.career_assessments for select
  using (exists (
    select 1 from public.mentee_profiles mp where mp.id = career_assessments.beneficiary_id
  ));

-- beneficiary-photos: sponsors and mentors may read ONLY their own linked
-- child's folder ({beneficiary_id}/...). Admin, the child's own, and the
-- consented-member policies are separate and unchanged.
drop policy if exists "beneficiary_photos_linked_select" on storage.objects;
create policy "beneficiary_photos_linked_select" on storage.objects for select
  using (
    bucket_id = 'beneficiary-photos'
    and (
      exists (
        select 1 from public.sponsor_children sc
        where sc.id::text = (storage.foldername(name))[1]
      )
      or exists (
        select 1 from public.mentee_profiles mp
        where mp.id::text = (storage.foldername(name))[1]
      )
    )
  );

-- ============================================================================
-- 2. MENTOR VETTING
-- ============================================================================

alter table public.mentors
  add column if not exists vetting_status text not null default 'pending',
  add column if not exists vetting_notes text,
  add column if not exists vetted_by uuid references public.profiles(id),
  add column if not exists vetted_at timestamptz,
  add column if not exists code_of_conduct_accepted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mentors_vetting_status_check'
  ) then
    alter table public.mentors
      add constraint mentors_vetting_status_check
      check (vetting_status in ('pending', 'cleared', 'rejected'));
  end if;
end $$;

-- A mentor can edit their own row (availability, expertise, accepting the code
-- of conduct) — but the guard trigger below locks everything that matters.
drop policy if exists "mentors_self_update" on public.mentors;
create policy "mentors_self_update" on public.mentors for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- Only an admin may change vetting. Everyone else's changes to those columns
-- (and to profile_id / mentor_track) silently revert. The code-of-conduct
-- timestamp can be set once, by the server clock, and never changed or cleared.
-- auth.uid() is null for the service role, which stays unrestricted.
create or replace function public.guard_mentor_update() returns trigger as $$
begin
  if auth.uid() is null or public.get_role() = 'admin' then
    return new;
  end if;
  new.profile_id := old.profile_id;
  new.mentor_track := old.mentor_track;
  new.created_at := old.created_at;
  new.vetting_status := old.vetting_status;
  new.vetting_notes := old.vetting_notes;
  new.vetted_by := old.vetted_by;
  new.vetted_at := old.vetted_at;
  if old.code_of_conduct_accepted_at is not null then
    new.code_of_conduct_accepted_at := old.code_of_conduct_accepted_at;
  elsif new.code_of_conduct_accepted_at is not null then
    new.code_of_conduct_accepted_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists a_guard_mentor_update on public.mentors;
create trigger a_guard_mentor_update
  before update on public.mentors
  for each row execute function public.guard_mentor_update();

-- ============================================================================
-- 3. MATCHES AND CONSENT
-- ============================================================================

alter table public.mentorship_matches
  add column if not exists next_check_in timestamptz;

-- The child's account (the guardian holds the login) can read and consent on
-- its own child's match. Mentors can already select their own matches (001).
drop policy if exists "mentorship_matches_beneficiary_select" on public.mentorship_matches;
create policy "mentorship_matches_beneficiary_select" on public.mentorship_matches for select
  using (exists (
    select 1 from public.beneficiaries b
    where b.id = mentorship_matches.beneficiary_id and b.profile_id = auth.uid()
  ));

drop policy if exists "mentorship_matches_mentor_update" on public.mentorship_matches;
create policy "mentorship_matches_mentor_update" on public.mentorship_matches for update
  using (mentor_id = public.get_mentor_id())
  with check (mentor_id = public.get_mentor_id());

drop policy if exists "mentorship_matches_beneficiary_update" on public.mentorship_matches;
create policy "mentorship_matches_beneficiary_update" on public.mentorship_matches for update
  using (exists (
    select 1 from public.beneficiaries b
    where b.id = mentorship_matches.beneficiary_id and b.profile_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.beneficiaries b
    where b.id = mentorship_matches.beneficiary_id and b.profile_id = auth.uid()
  ));

-- INSERT guard (everyone, including admin): a match can only be created for a
-- CLEARED mentor, always starts as 'pending_consent' with no consents, and can
-- never be created already 'active'. Activation happens only below.
create or replace function public.guard_match_insert() returns trigger as $$
declare v text;
begin
  select vetting_status into v from public.mentors where id = new.mentor_id;
  if v is distinct from 'cleared' then
    raise exception 'This mentor has not been cleared by vetting.'
      using errcode = 'check_violation';
  end if;
  new.status := 'pending_consent';
  new.consent_mentor := false;
  new.consent_guardian := false;
  new.consent_mentor_at := null;
  new.consent_guardian_at := null;
  new.started_at := null;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists a_guard_match_insert on public.mentorship_matches;
create trigger a_guard_match_insert
  before insert on public.mentorship_matches
  for each row execute function public.guard_match_insert();

-- UPDATE guard: who may change what.
--   admin / service role : anything (pause, resume, terminate, ...)
--   the match's mentor   : consent_mentor(+_at, once, false->true only), next_check_in
--   the child's account  : consent_guardian(+_at, once, false->true only)
--   either of them       : may also DECLINE (pending_consent -> terminated)
-- Everything else reverts. Nobody but an admin can set status 'active', paused, etc.
create or replace function public.guard_match_update() returns trigger as $$
declare
  is_mentor boolean;
  is_guardian boolean;
  pending boolean := (old.status = 'pending_consent');
begin
  if auth.uid() is null or public.get_role() = 'admin' then
    return new;
  end if;

  is_mentor := old.mentor_id is not distinct from public.get_mentor_id();
  is_guardian := exists (
    select 1 from public.beneficiaries b
    where b.id = old.beneficiary_id and b.profile_id = auth.uid()
  );
  if not is_mentor and not is_guardian then
    raise exception 'Not allowed to change this match.' using errcode = 'insufficient_privilege';
  end if;

  -- Immutable for non-admins.
  new.mentor_id := old.mentor_id;
  new.beneficiary_id := old.beneficiary_id;
  new.created_at := old.created_at;
  new.started_at := old.started_at;
  new.ends_at := old.ends_at;

  -- Status: the only non-admin change is declining a pending request.
  if pending and new.status = 'terminated' then
    new.termination_reason := case when is_mentor then 'Declined by mentor' else 'Declined by guardian' end;
  else
    new.status := old.status;
    new.termination_reason := old.termination_reason;
  end if;

  -- Consent: each side controls only their own, only while pending, only once.
  if is_mentor and pending then
    if old.consent_mentor then
      new.consent_mentor := true;
      new.consent_mentor_at := old.consent_mentor_at;
    elsif new.consent_mentor then
      new.consent_mentor_at := now();
    else
      new.consent_mentor_at := null;
    end if;
  else
    new.consent_mentor := old.consent_mentor;
    new.consent_mentor_at := old.consent_mentor_at;
  end if;

  if is_guardian and pending then
    if old.consent_guardian then
      new.consent_guardian := true;
      new.consent_guardian_at := old.consent_guardian_at;
    elsif new.consent_guardian then
      new.consent_guardian_at := now();
    else
      new.consent_guardian_at := null;
    end if;
  else
    new.consent_guardian := old.consent_guardian;
    new.consent_guardian_at := old.consent_guardian_at;
  end if;

  -- Next check-in: the mentor only, and only on an active match.
  if not (is_mentor and old.status = 'active') then
    new.next_check_in := old.next_check_in;
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists a_guard_match_update on public.mentorship_matches;
create trigger a_guard_match_update
  before update on public.mentorship_matches
  for each row execute function public.guard_match_update();

-- ACTIVATION (runs after the guard, by trigger name order): when both consents
-- are true AND the mentor is cleared, the match becomes 'active'. Never from
-- client code.
create or replace function public.activate_match() returns trigger as $$
begin
  if new.status = 'pending_consent'
     and new.consent_mentor and new.consent_guardian
     and exists (
       select 1 from public.mentors m
       where m.id = new.mentor_id and m.vetting_status = 'cleared'
     )
  then
    new.status := 'active';
    new.started_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists b_activate_match on public.mentorship_matches;
create trigger b_activate_match
  before update on public.mentorship_matches
  for each row execute function public.activate_match();

-- If a mentor is cleared AFTER both sides already consented, activate then.
create or replace function public.activate_matches_on_clearance() returns trigger as $$
begin
  if new.vetting_status = 'cleared' and old.vetting_status is distinct from 'cleared' then
    update public.mentorship_matches
    set status = 'active', started_at = now()
    where mentor_id = new.id
      and status = 'pending_consent'
      and consent_mentor and consent_guardian;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists c_activate_on_clearance on public.mentors;
create trigger c_activate_on_clearance
  after update of vetting_status on public.mentors
  for each row execute function public.activate_matches_on_clearance();

-- ============================================================================
-- 4. MESSAGING RULES (mentorship_messages)
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'mentorship_messages_content_length'
  ) then
    alter table public.mentorship_messages
      add constraint mentorship_messages_content_length
      check (char_length(content) between 1 and 1000);
  end if;
end $$;

-- Replace the broad "for all" policies from 001 with explicit ones.
drop policy if exists "mentorship_messages_mentor_all" on public.mentorship_messages;
drop policy if exists "mentorship_messages_beneficiary_all" on public.mentorship_messages;

-- READ: the match's mentor, the match's child account, and admin (001 policy).
drop policy if exists "mentorship_messages_mentor_select" on public.mentorship_messages;
create policy "mentorship_messages_mentor_select" on public.mentorship_messages for select
  using (match_id in (
    select id from public.mentorship_matches where mentor_id = public.get_mentor_id()
  ));

drop policy if exists "mentorship_messages_beneficiary_select" on public.mentorship_messages;
create policy "mentorship_messages_beneficiary_select" on public.mentorship_messages for select
  using (match_id in (
    select mm.id from public.mentorship_matches mm
    join public.beneficiaries b on b.id = mm.beneficiary_id
    where b.profile_id = auth.uid()
  ));

-- INSERT: you are the sender, the match is ACTIVE, and sender_type matches who
-- you are (mentor, or beneficiary for the child/guardian account). A pending,
-- paused or terminated match therefore blocks sending immediately.
drop policy if exists "mentorship_messages_insert" on public.mentorship_messages;
create policy "mentorship_messages_insert" on public.mentorship_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.mentorship_matches m
      where m.id = mentorship_messages.match_id
        and m.status = 'active'
        and (
          (mentorship_messages.sender_type = 'mentor'
            and m.mentor_id = public.get_mentor_id())
          or (mentorship_messages.sender_type = 'beneficiary'
            and exists (
              select 1 from public.beneficiaries b
              where b.id = m.beneficiary_id and b.profile_id = auth.uid()
            ))
        )
    )
  );

-- UPDATE: admin only (and the trigger below limits admin to the flag fields).
-- DELETE: no policy for anyone, so nobody can delete.
drop policy if exists "mentorship_messages_admin_update" on public.mentorship_messages;
create policy "mentorship_messages_admin_update" on public.mentorship_messages for update
  using (public.get_role() = 'admin')
  with check (public.get_role() = 'admin');

-- Backstop: runs on INSERT. Resets fields a sender must not control, then flags
-- anything that looks like contact details (the app blocks these first; this
-- catches anything that slips past). It flags rather than rejects so the
-- message is kept for the admin to review.
create or replace function public.flag_contact_details() returns trigger as $$
declare c text := new.content;
begin
  if auth.uid() is not null and public.get_role() is distinct from 'admin' then
    new.is_flagged := false;
    new.flag_reason := null;
    new.flagged_by := null;
    new.flagged_at := null;
    new.read_at := null;
  end if;

  if c ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'          -- email
     or c ~ '(\+?\d[\s().-]?){9,}'                                  -- phone number
     or c ~* '(https?://|www\.)\S+'                                 -- link
     or c ~* '\m[a-z0-9-]+\.(com|ng|org|net|co|io|me|app|info|biz|xyz)\M' -- bare domain
     or c ~* '(^|\s)@[a-z0-9._]{3,}'                                -- social handle
     or c ~* '\m(whatsapp|telegram|instagram|snapchat|facebook|tiktok)\M.{0,30}\d' -- app + number
  then
    new.is_flagged := true;
    new.flag_reason := 'contact details';
    new.flagged_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists a_flag_contact_details on public.mentorship_messages;
create trigger a_flag_contact_details
  before insert on public.mentorship_messages
  for each row execute function public.flag_contact_details();

-- Immutability. The words, sender, match and time can NEVER change (not even by
-- admin). Admin may change only the flag fields; "mark read" may change only
-- read_at, and only through mark_thread_read() below.
create or replace function public.guard_message_update() returns trigger as $$
begin
  new.content := old.content;
  new.match_id := old.match_id;
  new.sender_id := old.sender_id;
  new.sender_type := old.sender_type;
  new.created_at := old.created_at;

  if current_setting('tace.mark_read', true) = '1' then
    new.is_flagged := old.is_flagged;
    new.flag_reason := old.flag_reason;
    new.flagged_by := old.flagged_by;
    new.flagged_at := old.flagged_at;
  elsif auth.uid() is null or public.get_role() = 'admin' then
    new.read_at := old.read_at;
  else
    raise exception 'Messages cannot be edited.' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists a_guard_message_update on public.mentorship_messages;
create trigger a_guard_message_update
  before update on public.mentorship_messages
  for each row execute function public.guard_message_update();

-- Read tracking without giving anyone UPDATE: a party to the match marks the
-- OTHER side's messages as read.
create or replace function public.mark_thread_read(p_match_id uuid) returns void as $$
begin
  if not exists (
    select 1 from public.mentorship_matches m
    where m.id = p_match_id
      and (
        m.mentor_id = public.get_mentor_id()
        or exists (
          select 1 from public.beneficiaries b
          where b.id = m.beneficiary_id and b.profile_id = auth.uid()
        )
      )
  ) then
    return;
  end if;
  perform set_config('tace.mark_read', '1', true);
  update public.mentorship_messages
  set read_at = now()
  where match_id = p_match_id and sender_id <> auth.uid() and read_at is null;
  perform set_config('tace.mark_read', '0', true);
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function public.mark_thread_read(uuid) from public, anon;
grant execute on function public.mark_thread_read(uuid) to authenticated;

-- Realtime: RLS decides who receives each row.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public' and tablename = 'mentorship_messages'
     )
  then
    alter publication supabase_realtime add table public.mentorship_messages;
  end if;
end $$;

-- ============================================================================
-- 5. SAFEGUARDING CONCERNS
-- ============================================================================

create table if not exists public.safeguarding_concerns (
  id uuid primary key default gen_random_uuid(),
  raised_by uuid not null references public.profiles(id),
  match_id uuid references public.mentorship_matches(id),
  beneficiary_id uuid not null references public.beneficiaries(id),
  description text not null check (char_length(description) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'closed')),
  handled_by uuid references public.profiles(id),
  handled_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists safeguarding_concerns_status_idx
  on public.safeguarding_concerns (status, created_at desc);

alter table public.safeguarding_concerns enable row level security;

drop policy if exists "safeguarding_admin_all" on public.safeguarding_concerns;
create policy "safeguarding_admin_all" on public.safeguarding_concerns for all
  using (public.get_role() = 'admin');

-- Mentors, sponsors and children's accounts can raise a concern about a child
-- they are actually connected to, as themselves, and read back only their own.
drop policy if exists "safeguarding_insert_own" on public.safeguarding_concerns;
create policy "safeguarding_insert_own" on public.safeguarding_concerns for insert
  with check (
    raised_by = auth.uid()
    and status = 'open'
    and handled_by is null
    and handled_at is null
    and (
      (public.get_role() = 'mentor' and exists (
        select 1 from public.mentee_profiles mp where mp.id = safeguarding_concerns.beneficiary_id))
      or (public.get_role() = 'sponsor' and exists (
        select 1 from public.sponsor_children sc where sc.id = safeguarding_concerns.beneficiary_id))
      or (public.get_role() = 'beneficiary' and exists (
        select 1 from public.beneficiaries b
        where b.id = safeguarding_concerns.beneficiary_id and b.profile_id = auth.uid()))
    )
  );

drop policy if exists "safeguarding_select_own" on public.safeguarding_concerns;
create policy "safeguarding_select_own" on public.safeguarding_concerns for select
  using (raised_by = auth.uid());
