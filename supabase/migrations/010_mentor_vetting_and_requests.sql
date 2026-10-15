-- ============================================================================
-- 010 (Ticket 4B): vetting checklist + views for pending mentor requests.
-- Idempotent. New file; earlier migrations are untouched.
-- ============================================================================

-- 1. Vetting checklist (identity checked, two references, character/background
--    check, interview done). Stored as JSON so the admin can tick items and save
--    progress before deciding. Only an admin may change it (see the guard).
alter table public.mentors
  add column if not exists vetting_checklist jsonb not null default '{}'::jsonb;

-- Same guard as 008, plus vetting_checklist. A mentor can never alter it.
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
  new.vetting_checklist := old.vetting_checklist;
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

-- 2. mentor_requests: the calling mentor's PENDING requests. mentee_profiles
--    (008) only covers ACTIVE matches, so a mentor could not see who is asking
--    them. Safe columns only: first name, age, interests, aspirations, class.
create or replace view public.mentor_requests as
select
  mm.id as match_id,
  b.id as beneficiary_id,
  b.first_name,
  date_part('year', age(b.date_of_birth))::int as age,
  b.interests,
  b.aspirations,
  b.class_level,
  mm.consent_mentor,
  mm.consent_guardian,
  mm.created_at
from public.mentorship_matches mm
join public.beneficiaries b on b.id = mm.beneficiary_id
where mm.status = 'pending_consent'
  and mm.mentor_id in (select m.id from public.mentors m where m.profile_id = auth.uid());

-- 3. my_mentor_request: for the child's account (the guardian), the mentor who
--    is asking, with NO contact details: name, profession, track only.
create or replace view public.my_mentor_request as
select
  mm.id as match_id,
  p.full_name,
  m.profession,
  m.mentor_track,
  mm.consent_mentor,
  mm.consent_guardian,
  mm.created_at
from public.mentorship_matches mm
join public.beneficiaries b on b.id = mm.beneficiary_id
join public.mentors m on m.id = mm.mentor_id
join public.profiles p on p.id = m.profile_id
where mm.status = 'pending_consent'
  and b.profile_id = auth.uid();

do $$
declare v text;
begin
  foreach v in array array['mentor_requests', 'my_mentor_request']
  loop
    execute format('revoke all on public.%I from public, anon, authenticated', v);
    execute format('grant select on public.%I to authenticated', v);
  end loop;
end $$;
