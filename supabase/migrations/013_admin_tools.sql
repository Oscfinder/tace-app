-- ============================================================================
-- 013_admin_tools.sql  (Phase 5, Ticket 5A)
--
-- 1. site_settings: one source for the foundation's details and bank account,
--    read by the donate page and the sponsor bank card. Admin write; anyone may
--    read rows marked is_public (no secrets belong here, ever).
-- 2. audit_log becomes append-only: admins can read and add rows, nobody can
--    edit or delete one. New rows must carry the writer's own user id.
-- 3. Indexes for the audit viewer and the finance filters.
-- Idempotent: safe to run more than once.
-- ============================================================================

create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  is_public boolean not null default true,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_select" on public.site_settings;
create policy "site_settings_public_select" on public.site_settings
  for select to anon, authenticated
  using (is_public);

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings
  for all to authenticated
  using (public.get_role() = 'admin')
  with check (public.get_role() = 'admin');

insert into public.site_settings (key, value) values
  ('foundation_name', 'TACE Welfare Foundation'),
  ('cac_number', ''),
  ('bank_name', ''),
  ('bank_account_name', 'TACE Welfare Foundation'),
  ('bank_account_number', ''),
  ('contact_email', '')
on conflict (key) do nothing;

-- Only the six known keys may exist, so a stray row can never be exposed.
alter table public.site_settings drop constraint if exists site_settings_known_keys;
alter table public.site_settings add constraint site_settings_known_keys check (
  key in ('foundation_name', 'cac_number', 'bank_name', 'bank_account_name',
          'bank_account_number', 'contact_email')
);

-- ---- audit_log: append-only --------------------------------------------------
drop policy if exists "audit_log_admin_all" on public.audit_log;
drop policy if exists "audit_log_admin_select" on public.audit_log;
drop policy if exists "audit_log_admin_insert" on public.audit_log;

create policy "audit_log_admin_select" on public.audit_log
  for select to authenticated
  using (public.get_role() = 'admin');

create policy "audit_log_admin_insert" on public.audit_log
  for insert to authenticated
  with check (public.get_role() = 'admin' and user_id = auth.uid());

-- ---- indexes ----------------------------------------------------------------
create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_user_idx on public.audit_log (user_id);
create index if not exists audit_log_action_idx on public.audit_log (action);
create index if not exists donations_created_at_idx on public.donations (created_at desc);
create index if not exists donations_sponsor_idx on public.donations (sponsor_id);
create index if not exists donations_project_idx on public.donations (project_id);
