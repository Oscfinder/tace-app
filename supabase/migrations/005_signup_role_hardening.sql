-- ============================================================================
-- Security fix + Google sign-in support. Idempotent. Run after 004.
--
-- 1. handle_new_user() used to trust raw_user_meta_data->>'role', which any
--    caller of the public signup API controls — so anyone could create a
--    profile with role 'admin'. It now accepts only member / sponsor / mentor
--    and defaults to 'member'. (admin and beneficiary can never be
--    self-assigned; the Ticket 2B approval already sets role='beneficiary'
--    explicitly via a follow-up profile update, so it is unaffected.)
--
-- 2. profiles.profile_completed: users who arrive via OAuth (Google) skip our
--    signup forms, so their profile is created with profile_completed=false and
--    they are sent to /complete-profile. Email signups and all existing rows
--    are true.
-- ============================================================================

alter table public.profiles
  add column if not exists profile_completed boolean not null default true;

create or replace function public.handle_new_user() returns trigger as $$
declare
  requested_role text := new.raw_user_meta_data->>'role';
  safe_role text;
  is_oauth boolean :=
    coalesce(new.raw_app_meta_data->>'provider', 'email') <> 'email';
begin
  if requested_role in ('member', 'sponsor', 'mentor') and not is_oauth then
    safe_role := requested_role;
  else
    safe_role := 'member'; -- OAuth users choose a role later, via the server action
  end if;

  insert into public.profiles (id, full_name, email, phone, role, status, profile_completed)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    safe_role,
    'pending',
    not is_oauth
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

-- Trigger itself is unchanged (created in 001); re-assert for safety.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users must not be able to flip profile_completed back or set it themselves:
-- extend the existing privilege guard so non-admin edits revert it.
create or replace function public.prevent_profile_privilege_escalation() returns trigger as $$
begin
  if public.get_role() <> 'admin' then
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
