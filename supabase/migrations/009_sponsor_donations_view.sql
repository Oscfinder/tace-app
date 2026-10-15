-- ============================================================================
-- 009: sponsors read their own gifts through a narrow view, not the table.
-- Idempotent. New file; earlier migrations are untouched.
--
-- WHY: row-level security works per ROW. The old "donations_sponsor_select"
-- policy let a sponsor read every COLUMN of their own donation rows through the
-- API — including the internal `notes`, the bank reference (`bank_ref`), who
-- logged it (`logged_by`), the donor's email/phone, and project/beneficiary ids.
--
-- Who still reads `donations` (checked in the code before this change):
--   - admin pages, the 2E receipt sender, sponsors.total_donated recompute:
--       all run as admin -> covered by donations_admin_all, unchanged
--   - public landing page: service-role client -> bypasses RLS, unchanged
--   - project_funding view (004): security-definer view -> unchanged
--   - sponsor dashboard: switched to sponsor_donations in the same release
-- ============================================================================

-- A sponsor's own gifts, safe columns only. Security-definer (owned by the
-- migration role, so it can read the table) and filtered by get_sponsor_id(),
-- which is the calling sponsor's id (null for everyone else -> no rows).
-- EXCLUDED: bank_ref, notes, logged_by, donor_name/email/phone, sponsor_id,
-- project_id, beneficiary_id.
create or replace view public.sponsor_donations as
select
  d.id,
  d.amount,
  d.currency,
  d.purpose,
  d.receipt_sent,
  d.receipt_sent_at,
  d.created_at
from public.donations d
where d.sponsor_id = public.get_sponsor_id();

revoke all on public.sponsor_donations from public, anon, authenticated;
grant select on public.sponsor_donations to authenticated;

-- Remove the sponsor's direct read of the table. The admin policy stays.
drop policy if exists "donations_sponsor_select" on public.donations;

-- sponsors.total_donated is unchanged: the admin action recomputes it from a
-- SUM over the donations table (no read-then-write). A sponsor's own total on
-- the dashboard is a SUM over this view.
