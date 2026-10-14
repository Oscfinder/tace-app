-- ============================================================================
-- Ticket 2F follow-up: archived projects must never be publicly visible,
-- regardless of is_published (an admin forgetting to unpublish before
-- archiving, or any future code path that sets both independently, must
-- not leak the row) — status <> 'archived' is the actual guarantee,
-- is_published alone wasn't.
--
-- Note: 002_phase3_additions.sql is reserved for Phase 3 — this is 003.
-- ============================================================================

drop policy if exists "projects_published_select" on public.projects;
create policy "projects_published_select" on public.projects for select
  using (is_published = true and status <> 'archived');

drop policy if exists "project_beneficiaries_published_select" on public.project_beneficiaries;
create policy "project_beneficiaries_published_select" on public.project_beneficiaries for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_beneficiaries.project_id
      and p.is_published = true
      and p.status <> 'archived'
  ));
