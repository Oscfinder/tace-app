-- ============================================================================
-- TACE Platform — Phase 3 Additions (Ticket 3.0)
-- Idempotent: safe to run multiple times in the Supabase SQL Editor.
-- Requires 001_initial_schema.sql (helpers get_role / get_mentor_id / get_sponsor_id).
-- ============================================================================

-- ============================================================================
-- 1. NEW TABLES
-- ============================================================================

create table if not exists public.committee_updates (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  committee text,
  update_month date not null default date_trunc('month', now())::date
    check (update_month = date_trunc('month', update_month)::date), -- always the 1st
  content text not null,
  created_at timestamptz default now(),
  unique (member_id, update_month) -- one update per member per month
);

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('attending', 'declined')),
  created_at timestamptz default now(),
  unique (event_id, profile_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  type text,
  is_read boolean not null default false,
  created_at timestamptz default now()
);
create index if not exists notifications_profile_idx on public.notifications (profile_id, created_at desc);

create table if not exists public.thank_you_messages (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  sponsor_id uuid references public.sponsors(id),
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.career_assessments (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.beneficiaries(id) on delete cascade,
  answers jsonb,
  scores jsonb,
  top_clusters text[],
  ai_narrative text,
  recommended_mentor_track text check (recommended_mentor_track in ('career', 'tech')),
  created_at timestamptz default now()
);
create index if not exists career_assessments_beneficiary_idx on public.career_assessments (beneficiary_id, created_at desc);

-- Rate limiting for the public /apply form. Service role only (RLS on, no policies).
create table if not exists public.application_submissions (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz default now()
);
create index if not exists application_submissions_ip_idx on public.application_submissions (ip_hash, created_at desc);

-- ============================================================================
-- 2. ALTER EXISTING TABLES
-- ============================================================================

alter table public.events add column if not exists minutes text;

-- ============================================================================
-- 3. NOTIFICATION COLUMN GUARD
-- Non-admins may only flip is_read; every other column silently reverts.
-- auth.uid() is null for the service role, so get_role() is null and the
-- guard is skipped (service role stays unrestricted).
-- ============================================================================

create or replace function public.prevent_notification_tampering() returns trigger as $$
begin
  if public.get_role() is distinct from 'admin' and auth.uid() is not null then
    new.profile_id := old.profile_id;
    new.title := old.title;
    new.body := old.body;
    new.type := old.type;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists protect_notification_fields on public.notifications;
create trigger protect_notification_fields
  before update on public.notifications
  for each row execute function public.prevent_notification_tampering();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

alter table public.committee_updates enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.notifications enable row level security;
alter table public.thank_you_messages enable row level security;
alter table public.career_assessments enable row level security;
alter table public.application_submissions enable row level security; -- no policies: service role only

-- committee_updates: admin all; member inserts/reads own. Update-own (this month only)
-- is added beyond the ticket text because Ticket 3A requires editing within the month.
drop policy if exists "committee_updates_admin_all" on public.committee_updates;
create policy "committee_updates_admin_all" on public.committee_updates for all
  using (public.get_role() = 'admin');

drop policy if exists "committee_updates_member_select" on public.committee_updates;
create policy "committee_updates_member_select" on public.committee_updates for select
  using (member_id = auth.uid());

drop policy if exists "committee_updates_member_insert" on public.committee_updates;
create policy "committee_updates_member_insert" on public.committee_updates for insert
  with check (member_id = auth.uid() and public.get_role() = 'member');

drop policy if exists "committee_updates_member_update" on public.committee_updates;
create policy "committee_updates_member_update" on public.committee_updates for update
  using (member_id = auth.uid() and update_month = date_trunc('month', now())::date)
  with check (member_id = auth.uid() and update_month = date_trunc('month', now())::date);

-- event_rsvps: admin all; user inserts/updates/reads own
drop policy if exists "event_rsvps_admin_all" on public.event_rsvps;
create policy "event_rsvps_admin_all" on public.event_rsvps for all
  using (public.get_role() = 'admin');

drop policy if exists "event_rsvps_own_select" on public.event_rsvps;
create policy "event_rsvps_own_select" on public.event_rsvps for select
  using (profile_id = auth.uid());

drop policy if exists "event_rsvps_own_insert" on public.event_rsvps;
create policy "event_rsvps_own_insert" on public.event_rsvps for insert
  with check (profile_id = auth.uid());

drop policy if exists "event_rsvps_own_update" on public.event_rsvps;
create policy "event_rsvps_own_update" on public.event_rsvps for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- notifications: admin all; user reads own; user updates own (trigger limits to is_read)
drop policy if exists "notifications_admin_all" on public.notifications;
create policy "notifications_admin_all" on public.notifications for all
  using (public.get_role() = 'admin');

drop policy if exists "notifications_own_select" on public.notifications;
create policy "notifications_own_select" on public.notifications for select
  using (profile_id = auth.uid());

drop policy if exists "notifications_own_update" on public.notifications;
create policy "notifications_own_update" on public.notifications for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- thank_you_messages: admin all; beneficiary inserts (pending only) and reads own;
-- sponsor reads approved messages from their own beneficiary
drop policy if exists "thank_you_admin_all" on public.thank_you_messages;
create policy "thank_you_admin_all" on public.thank_you_messages for all
  using (public.get_role() = 'admin');

drop policy if exists "thank_you_beneficiary_select" on public.thank_you_messages;
create policy "thank_you_beneficiary_select" on public.thank_you_messages for select
  using (exists (
    select 1 from public.beneficiaries b
    where b.id = thank_you_messages.beneficiary_id and b.profile_id = auth.uid()
  ));

drop policy if exists "thank_you_beneficiary_insert" on public.thank_you_messages;
create policy "thank_you_beneficiary_insert" on public.thank_you_messages for insert
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and exists (
      select 1 from public.beneficiaries b
      where b.id = thank_you_messages.beneficiary_id
        and b.profile_id = auth.uid()
        and (thank_you_messages.sponsor_id is null or thank_you_messages.sponsor_id = b.sponsor_id)
    )
  );

drop policy if exists "thank_you_sponsor_select" on public.thank_you_messages;
create policy "thank_you_sponsor_select" on public.thank_you_messages for select
  using (
    status = 'approved'
    and public.get_role() = 'sponsor'
    and exists (
      select 1 from public.beneficiaries b
      where b.id = thank_you_messages.beneficiary_id and b.sponsor_id = public.get_sponsor_id()
    )
  );

-- career_assessments: admin all; beneficiary inserts/reads own; linked mentor reads
drop policy if exists "career_assessments_admin_all" on public.career_assessments;
create policy "career_assessments_admin_all" on public.career_assessments for all
  using (public.get_role() = 'admin');

drop policy if exists "career_assessments_beneficiary_select" on public.career_assessments;
create policy "career_assessments_beneficiary_select" on public.career_assessments for select
  using (exists (
    select 1 from public.beneficiaries b
    where b.id = career_assessments.beneficiary_id and b.profile_id = auth.uid()
  ));

drop policy if exists "career_assessments_beneficiary_insert" on public.career_assessments;
create policy "career_assessments_beneficiary_insert" on public.career_assessments for insert
  with check (exists (
    select 1 from public.beneficiaries b
    where b.id = career_assessments.beneficiary_id and b.profile_id = auth.uid()
  ));

drop policy if exists "career_assessments_mentor_select" on public.career_assessments;
create policy "career_assessments_mentor_select" on public.career_assessments for select
  using (
    public.get_role() = 'mentor'
    and exists (
      select 1 from public.beneficiaries b
      where b.id = career_assessments.beneficiary_id and b.mentor_id = public.get_mentor_id()
    )
  );

-- applications: anonymous visitors may submit, but only as an untouched pending row.
-- (Replaces the original `with check (true)`.)
drop policy if exists "applications_public_insert" on public.applications;
create policy "applications_public_insert" on public.applications for insert
  with check (
    status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and admin_notes is null
  );

-- ============================================================================
-- 5. BENEFICIARY-FACING VIEWS
-- Security-definer (default: owned by the migration role, so they read
-- profiles/mentors/sponsors past RLS) but filtered to the calling user via
-- auth.uid(). Anyone who is not a beneficiary gets zero rows.
-- ============================================================================

drop view if exists public.my_mentor;
create view public.my_mentor as
select
  p.full_name,
  m.profession,
  m.mentor_track
from public.beneficiaries b
join public.mentorship_matches mm on mm.beneficiary_id = b.id and mm.status = 'active'
join public.mentors m on m.id = mm.mentor_id
join public.profiles p on p.id = m.profile_id
where b.profile_id = auth.uid();

drop view if exists public.my_sponsor;
create view public.my_sponsor as
select
  split_part(trim(p.full_name), ' ', 1) as first_name
from public.beneficiaries b
join public.sponsors s on s.id = b.sponsor_id
join public.profiles p on p.id = s.profile_id
where b.profile_id = auth.uid();

-- Supabase default privileges grant new objects to anon; strip that.
revoke all on public.my_mentor from public, anon, authenticated;
revoke all on public.my_sponsor from public, anon, authenticated;
grant select on public.my_mentor to authenticated;
grant select on public.my_sponsor to authenticated;

-- ============================================================================
-- 6. STORAGE
-- ============================================================================

-- resources: private bucket of foundation documents for members. Path: {category}/filename.ext
insert into storage.buckets (id, name, public)
values ('resources', 'resources', false)
on conflict (id) do nothing;

drop policy if exists "resources_admin_all" on storage.objects;
create policy "resources_admin_all" on storage.objects for all
  using (bucket_id = 'resources' and public.get_role() = 'admin')
  with check (bucket_id = 'resources' and public.get_role() = 'admin');

drop policy if exists "resources_member_select" on storage.objects;
create policy "resources_member_select" on storage.objects for select
  using (
    bucket_id = 'resources'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'member' and p.status = 'active'
    )
  );

-- beneficiary-photos: anonymous applicants may upload (insert only) under applications/.
-- No anon select/update/delete. Admin full access already exists from 001.
drop policy if exists "beneficiary_photos_anon_application_insert" on storage.objects;
create policy "beneficiary_photos_anon_application_insert" on storage.objects for insert
  to anon
  with check (bucket_id = 'beneficiary-photos' and name like 'applications/%');

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png']
where id = 'beneficiary-photos';
