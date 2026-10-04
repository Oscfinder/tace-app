-- ============================================================================
-- TACE Platform — Initial Schema (Ticket 1B)
-- Idempotent: safe to run multiple times in the Supabase SQL Editor.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 1. TABLES (dependency order)
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('admin', 'member', 'sponsor', 'mentor', 'beneficiary')),
  status text not null default 'pending' check (status in ('pending', 'active', 'inactive', 'suspended')),
  member_type text check (member_type in ('trustee', 'member')),
  trustee_role text,
  committee text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  applicant_type text check (applicant_type in ('self', 'guardian', 'organisation')),
  -- Child
  child_first_name text not null,
  child_last_name text not null,
  child_dob date not null,
  child_gender text,
  child_nationality text,
  child_state text,
  child_address text,
  child_phone text,
  child_email text,
  child_photo_url text,
  -- Guardian
  guardian_name text,
  guardian_relationship text,
  guardian_phone text,
  guardian_email text,
  guardian_address text,
  guardian_occupation text,
  -- Organisation
  org_name text,
  org_contact_name text,
  org_contact_role text,
  org_phone text,
  org_email text,
  org_identification text,
  -- Education
  edu_status text,
  school_name text,
  class_level text,
  school_address text,
  academic_performance text,
  learning_difficulties text,
  -- Household
  living_situation text,
  siblings_count int,
  household_income text,
  challenges text[],
  -- Support
  support_types text[],
  support_description text,
  -- Aspirations
  interests text,
  aspirations text,
  subjects_skills text,
  talents text,
  -- Health
  health_conditions text,
  disabilities text,
  current_treatment text,
  -- Consent
  consent_information boolean default false,
  consent_contact boolean default false,
  consent_assessment boolean default false,
  consent_no_guarantee boolean default false,
  consent_photography boolean default false,
  declarant_name text,
  declared_at timestamptz,
  -- Status
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'flagged')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id),
  sponsorship_type text check (sponsorship_type in ('one_time', 'long_term')),
  total_donated numeric(12, 2) default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id),
  profession text,
  expertise text,
  availability text,
  mentor_track text check (mentor_track in ('career', 'tech')),
  preferred_age_group text,
  motivation text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  application_id uuid references public.applications(id),
  tace_id text unique,
  -- Personal
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  gender text check (gender in ('male', 'female', 'other')),
  state_of_origin text,
  address text,
  phone text,
  email text,
  photo_url text,
  -- Guardian
  guardian_name text,
  guardian_rel text,
  guardian_phone text,
  guardian_email text,
  -- Education
  edu_status text check (edu_status in ('in_school', 'out_of_school', 'never_attended')),
  school_name text,
  class_level text,
  -- Situation
  living_situation text,
  household_income text,
  challenges text[],
  -- Support
  support_needed text[],
  support_description text,
  -- Aspirations
  interests text,
  aspirations text,
  talents text,
  -- Health
  health_conditions text,
  disabilities text,
  -- Stage
  current_stage text default 'identified' check (current_stage in (
    'identified', 'assessed', 'education_support', 'vocational_training',
    'certification', 'apprenticeship', 'savings', 'employment', 'business_owner'
  )),
  stage_updated_at timestamptz,
  -- Relationships
  mentor_id uuid references public.mentors(id),
  sponsor_id uuid references public.sponsors(id),
  -- Meta
  status text default 'active' check (status in ('active', 'inactive', 'graduated', 'lost_contact')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.mentorship_matches (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id),
  beneficiary_id uuid not null references public.beneficiaries(id),
  status text default 'pending_consent' check (status in ('pending_consent', 'active', 'paused', 'completed', 'terminated')),
  consent_mentor boolean default false,
  consent_guardian boolean default false,
  consent_mentor_at timestamptz,
  consent_guardian_at timestamptz,
  started_at timestamptz,
  ends_at timestamptz,
  termination_reason text,
  created_at timestamptz default now()
);

create table if not exists public.mentorship_messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.mentorship_matches(id),
  sender_id uuid not null references public.profiles(id),
  sender_type text check (sender_type in ('mentor', 'beneficiary', 'guardian', 'admin')),
  content text not null,
  is_flagged boolean default false,
  flag_reason text,
  flagged_by uuid references public.profiles(id),
  flagged_at timestamptz,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.mentorship_notes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.mentorship_matches(id),
  mentor_id uuid not null references public.mentors(id),
  topics_discussed text,
  improvements text,
  concerns text,
  next_steps text,
  check_in_date date,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  target_amount numeric(12, 2),
  current_amount numeric(12, 2) default 0,
  start_date date,
  end_date date,
  status text default 'draft' check (status in ('draft', 'active', 'completed', 'archived')),
  is_published boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_beneficiaries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id),
  beneficiary_id uuid not null references public.beneficiaries(id),
  support_type text,
  amount_needed numeric(12, 2),
  unique (project_id, beneficiary_id)
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_name text not null,
  donor_email text,
  donor_phone text,
  sponsor_id uuid references public.sponsors(id),
  project_id uuid references public.projects(id),
  beneficiary_id uuid references public.beneficiaries(id),
  amount numeric(12, 2) not null,
  currency text default 'NGN',
  purpose text,
  bank_ref text,
  receipt_sent boolean default false,
  receipt_sent_at timestamptz,
  notes text,
  logged_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.interventions (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.beneficiaries(id),
  type text not null,
  amount numeric(12, 2),
  description text,
  notes text,
  given_by uuid references public.profiles(id),
  given_at date,
  created_at timestamptz default now()
);

create table if not exists public.progress_updates (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.beneficiaries(id),
  title text not null,
  content text not null,
  posted_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  is_published boolean default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  photo_url text,
  excerpt text,
  beneficiary_id uuid references public.beneficiaries(id),
  is_published boolean default false,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  event_date timestamptz,
  event_type text check (event_type in ('meeting', 'event', 'training', 'outreach')),
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz default now()
);

-- ============================================================================
-- 2. updated_at AUTO-UPDATE TRIGGER
-- ============================================================================

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql set search_path = public, pg_temp;

do $$
declare
  t text;
begin
  foreach t in array array['profiles', 'sponsors', 'mentors', 'beneficiaries', 'projects']
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

create or replace function public.get_role() returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable set search_path = public, pg_temp;

create or replace function public.get_mentor_id() returns uuid as $$
  select id from public.mentors where profile_id = auth.uid();
$$ language sql security definer stable set search_path = public, pg_temp;

create or replace function public.get_sponsor_id() returns uuid as $$
  select id from public.sponsors where profile_id = auth.uid();
$$ language sql security definer stable set search_path = public, pg_temp;

-- ============================================================================
-- 4. TACE ID AUTO-GENERATION
-- ============================================================================

create sequence if not exists public.tace_id_seq start 1;

create or replace function public.generate_tace_id() returns trigger as $$
begin
  new.tace_id := 'TACE-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.tace_id_seq')::text, 3, '0');
  return new;
end;
$$ language plpgsql set search_path = public, pg_temp;

drop trigger if exists set_tace_id on public.beneficiaries;
create trigger set_tace_id before insert on public.beneficiaries
  for each row when (new.tace_id is null)
  execute function public.generate_tace_id();

-- ============================================================================
-- 5. PROFILE PRIVILEGE PROTECTION
-- Non-admins may update their own profile, but may not change role/status/
-- member_type/trustee_role/committee on themselves (those fields silently
-- revert to their prior value). Admins are unrestricted.
-- ============================================================================

create or replace function public.prevent_profile_privilege_escalation() returns trigger as $$
begin
  if public.get_role() <> 'admin' then
    new.role := old.role;
    new.status := old.status;
    new.member_type := old.member_type;
    new.trustee_role := old.trustee_role;
    new.committee := old.committee;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists protect_privileged_fields on public.profiles;
create trigger protect_privileged_fields
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_escalation();

-- ============================================================================
-- 6. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================

create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.sponsors enable row level security;
alter table public.mentors enable row level security;
alter table public.beneficiaries enable row level security;
alter table public.mentorship_matches enable row level security;
alter table public.mentorship_messages enable row level security;
alter table public.mentorship_notes enable row level security;
alter table public.projects enable row level security;
alter table public.project_beneficiaries enable row level security;
alter table public.donations enable row level security;
alter table public.interventions enable row level security;
alter table public.progress_updates enable row level security;
alter table public.announcements enable row level security;
alter table public.stories enable row level security;
alter table public.events enable row level security;
alter table public.audit_log enable row level security;

-- profiles: users read/update own; admin reads/updates all
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles for select using (public.get_role() = 'admin');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "profiles_admin_update_all" on public.profiles;
create policy "profiles_admin_update_all" on public.profiles for update using (public.get_role() = 'admin');

-- applications: admin full access; public can insert
drop policy if exists "applications_admin_all" on public.applications;
create policy "applications_admin_all" on public.applications for all using (public.get_role() = 'admin');

drop policy if exists "applications_public_insert" on public.applications;
create policy "applications_public_insert" on public.applications for insert with check (true);

-- sponsors: admin full access; sponsor reads own record
drop policy if exists "sponsors_admin_all" on public.sponsors;
create policy "sponsors_admin_all" on public.sponsors for all using (public.get_role() = 'admin');

drop policy if exists "sponsors_self_select" on public.sponsors;
create policy "sponsors_self_select" on public.sponsors for select using (profile_id = auth.uid());

-- mentors: admin full access; mentor reads own record
drop policy if exists "mentors_admin_all" on public.mentors;
create policy "mentors_admin_all" on public.mentors for all using (public.get_role() = 'admin');

drop policy if exists "mentors_self_select" on public.mentors;
create policy "mentors_self_select" on public.mentors for select using (profile_id = auth.uid());

-- beneficiaries: admin full access; sponsor/mentor read linked child; beneficiary reads own
drop policy if exists "beneficiaries_admin_all" on public.beneficiaries;
create policy "beneficiaries_admin_all" on public.beneficiaries for all using (public.get_role() = 'admin');

drop policy if exists "beneficiaries_sponsor_select" on public.beneficiaries;
create policy "beneficiaries_sponsor_select" on public.beneficiaries for select
  using (public.get_role() = 'sponsor' and sponsor_id = public.get_sponsor_id());

drop policy if exists "beneficiaries_mentor_select" on public.beneficiaries;
create policy "beneficiaries_mentor_select" on public.beneficiaries for select
  using (public.get_role() = 'mentor' and mentor_id = public.get_mentor_id());

drop policy if exists "beneficiaries_self_select" on public.beneficiaries;
create policy "beneficiaries_self_select" on public.beneficiaries for select using (profile_id = auth.uid());

-- mentorship_matches: admin full access; mentor reads own matches
drop policy if exists "mentorship_matches_admin_all" on public.mentorship_matches;
create policy "mentorship_matches_admin_all" on public.mentorship_matches for all using (public.get_role() = 'admin');

drop policy if exists "mentorship_matches_mentor_select" on public.mentorship_matches;
create policy "mentorship_matches_mentor_select" on public.mentorship_matches for select
  using (mentor_id = public.get_mentor_id());

-- mentorship_messages: admin reads all; mentor/beneficiary read+write own match
drop policy if exists "mentorship_messages_admin_select" on public.mentorship_messages;
create policy "mentorship_messages_admin_select" on public.mentorship_messages for select
  using (public.get_role() = 'admin');

drop policy if exists "mentorship_messages_mentor_all" on public.mentorship_messages;
create policy "mentorship_messages_mentor_all" on public.mentorship_messages for all
  using (match_id in (select id from public.mentorship_matches where mentor_id = public.get_mentor_id()));

drop policy if exists "mentorship_messages_beneficiary_all" on public.mentorship_messages;
create policy "mentorship_messages_beneficiary_all" on public.mentorship_messages for all
  using (
    match_id in (
      select mm.id from public.mentorship_matches mm
      join public.beneficiaries b on b.id = mm.beneficiary_id
      where b.profile_id = auth.uid()
    )
  );

-- mentorship_notes: admin reads all; mentor reads/writes own notes
drop policy if exists "mentorship_notes_admin_select" on public.mentorship_notes;
create policy "mentorship_notes_admin_select" on public.mentorship_notes for select
  using (public.get_role() = 'admin');

drop policy if exists "mentorship_notes_mentor_all" on public.mentorship_notes;
create policy "mentorship_notes_mentor_all" on public.mentorship_notes for all
  using (mentor_id = public.get_mentor_id());

-- projects: admin full access; published projects publicly readable (landing page)
drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects for all using (public.get_role() = 'admin');

drop policy if exists "projects_published_select" on public.projects;
create policy "projects_published_select" on public.projects for select using (is_published = true);

-- project_beneficiaries: admin full access; rows of published projects publicly readable
drop policy if exists "project_beneficiaries_admin_all" on public.project_beneficiaries;
create policy "project_beneficiaries_admin_all" on public.project_beneficiaries for all
  using (public.get_role() = 'admin');

drop policy if exists "project_beneficiaries_published_select" on public.project_beneficiaries;
create policy "project_beneficiaries_published_select" on public.project_beneficiaries for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_beneficiaries.project_id and p.is_published = true
  ));

-- donations: admin full access; sponsor reads own donations
drop policy if exists "donations_admin_all" on public.donations;
create policy "donations_admin_all" on public.donations for all using (public.get_role() = 'admin');

drop policy if exists "donations_sponsor_select" on public.donations;
create policy "donations_sponsor_select" on public.donations for select
  using (public.get_role() = 'sponsor' and sponsor_id = public.get_sponsor_id());

-- interventions: admin full access; beneficiary reads own
drop policy if exists "interventions_admin_all" on public.interventions;
create policy "interventions_admin_all" on public.interventions for all using (public.get_role() = 'admin');

drop policy if exists "interventions_beneficiary_select" on public.interventions;
create policy "interventions_beneficiary_select" on public.interventions for select
  using (exists (
    select 1 from public.beneficiaries b
    where b.id = interventions.beneficiary_id and b.profile_id = auth.uid()
  ));

-- progress_updates: admin full access; beneficiary reads own; sponsor reads linked child's updates
drop policy if exists "progress_updates_admin_all" on public.progress_updates;
create policy "progress_updates_admin_all" on public.progress_updates for all using (public.get_role() = 'admin');

drop policy if exists "progress_updates_beneficiary_select" on public.progress_updates;
create policy "progress_updates_beneficiary_select" on public.progress_updates for select
  using (exists (
    select 1 from public.beneficiaries b
    where b.id = progress_updates.beneficiary_id and b.profile_id = auth.uid()
  ));

drop policy if exists "progress_updates_sponsor_select" on public.progress_updates;
create policy "progress_updates_sponsor_select" on public.progress_updates for select
  using (exists (
    select 1 from public.beneficiaries b
    where b.id = progress_updates.beneficiary_id
      and public.get_role() = 'sponsor'
      and b.sponsor_id = public.get_sponsor_id()
  ));

-- announcements: admin full access; published announcements readable by members
drop policy if exists "announcements_admin_all" on public.announcements;
create policy "announcements_admin_all" on public.announcements for all using (public.get_role() = 'admin');

drop policy if exists "announcements_member_select" on public.announcements;
create policy "announcements_member_select" on public.announcements for select
  using (is_published = true and public.get_role() = 'member');

-- stories: admin full access; published stories readable by everyone (including anon)
drop policy if exists "stories_admin_all" on public.stories;
create policy "stories_admin_all" on public.stories for all using (public.get_role() = 'admin');

drop policy if exists "stories_public_select" on public.stories;
create policy "stories_public_select" on public.stories for select using (is_published = true);

-- events: admin full access; readable by authenticated users
drop policy if exists "events_admin_all" on public.events;
create policy "events_admin_all" on public.events for all using (public.get_role() = 'admin');

drop policy if exists "events_authenticated_select" on public.events;
create policy "events_authenticated_select" on public.events for select using (auth.role() = 'authenticated');

-- audit_log: admin only, insert and read
drop policy if exists "audit_log_admin_all" on public.audit_log;
create policy "audit_log_admin_all" on public.audit_log for all using (public.get_role() = 'admin');

-- ============================================================================
-- 8. PUBLIC-SAFE BENEFICIARY VIEW
-- The `beneficiaries` table holds guardian contact, health, address and
-- other sensitive child PII and must never be directly readable by
-- anonymous visitors — RLS on beneficiaries grants anon no access, and
-- that stays true. This view is the only anon-readable surface: it
-- exposes only id, first_name (never last_name), a computed age (never
-- the raw date_of_birth), current_stage, support_needed, photo_url — and
-- it inner-joins to applications so a child whose guardian did not tick
-- consent_photography on the application is excluded entirely, regardless
-- of status. It is owned by the migration role (not security_invoker), so
-- it is evaluated against the view owner's privileges rather than the
-- querying (anon) role's RLS — the standard Supabase pattern for a safe
-- public projection over a locked-down table.
-- ============================================================================

drop view if exists public.public_beneficiaries;
create view public.public_beneficiaries as
select
  b.id,
  b.first_name,
  date_part('year', age(b.date_of_birth))::int as age,
  b.current_stage,
  b.support_needed,
  b.photo_url
from public.beneficiaries b
join public.applications a on a.id = b.application_id
where b.status = 'active'
  and a.consent_photography = true;

grant select on public.public_beneficiaries to anon, authenticated;

-- ============================================================================
-- 9. STORAGE BUCKETS
-- ============================================================================

insert into storage.buckets (id, name, public)
values
  ('beneficiary-photos', 'beneficiary-photos', false),
  ('documents', 'documents', false),
  ('certificates', 'certificates', false),
  ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

-- beneficiary-photos: private — admin + linked sponsor/mentor.
-- Convention: object path is "{beneficiary_id}/filename.ext".
drop policy if exists "beneficiary_photos_admin_all" on storage.objects;
create policy "beneficiary_photos_admin_all" on storage.objects for all
  using (bucket_id = 'beneficiary-photos' and public.get_role() = 'admin');

drop policy if exists "beneficiary_photos_linked_select" on storage.objects;
create policy "beneficiary_photos_linked_select" on storage.objects for select
  using (
    bucket_id = 'beneficiary-photos'
    and exists (
      select 1 from public.beneficiaries b
      where b.id::text = (storage.foldername(name))[1]
        and (
          (public.get_role() = 'sponsor' and b.sponsor_id = public.get_sponsor_id())
          or (public.get_role() = 'mentor' and b.mentor_id = public.get_mentor_id())
        )
    )
  );

-- documents: private — admin only
drop policy if exists "documents_admin_all" on storage.objects;
create policy "documents_admin_all" on storage.objects for all
  using (bucket_id = 'documents' and public.get_role() = 'admin');

-- certificates: private — admin + beneficiary.
-- Convention: object path is "{beneficiary_id}/filename.ext".
drop policy if exists "certificates_admin_all" on storage.objects;
create policy "certificates_admin_all" on storage.objects for all
  using (bucket_id = 'certificates' and public.get_role() = 'admin');

drop policy if exists "certificates_beneficiary_select" on storage.objects;
create policy "certificates_beneficiary_select" on storage.objects for select
  using (
    bucket_id = 'certificates'
    and exists (
      select 1 from public.beneficiaries b
      where b.id::text = (storage.foldername(name))[1] and b.profile_id = auth.uid()
    )
  );

-- public-assets: public read; admin manages writes
drop policy if exists "public_assets_select" on storage.objects;
create policy "public_assets_select" on storage.objects for select
  using (bucket_id = 'public-assets');

drop policy if exists "public_assets_admin_manage" on storage.objects;
create policy "public_assets_admin_manage" on storage.objects for all
  using (bucket_id = 'public-assets' and public.get_role() = 'admin');
