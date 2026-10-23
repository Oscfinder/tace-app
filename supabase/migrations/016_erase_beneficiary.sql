-- ============================================================================
-- 016_erase_beneficiary.sql  (Phase 5, Ticket 5B: data protection)
--
-- Deletes everything held about ONE child in a single transaction, for a
-- deletion request. Called only by the admin "Delete this child's data" Server
-- Action, through the service role (nobody else can execute it).
--
-- What it removes: the child's record, their application (which holds the
-- guardian's contact details), mentor matches with every message and note in
-- them, career results, thank-you messages, progress updates, support records,
-- project links, and the child's notifications.
-- What it keeps, with the link to the child cut: donation records (the
-- foundation's financial records), and stories (which it also UNPUBLISHES, so a
-- story can't keep describing a child who has asked to be deleted).
-- Safeguarding concerns: it REFUSES to run if any exist for this child, unless
-- p_include_safeguarding is true. Whether those must be kept is a legal
-- question, so deleting them is a separate, deliberate choice.
--
-- It does not touch storage files or the sign-in account; the Server Action
-- removes those afterwards, using the ids this function returns.
-- Idempotent: safe to run more than once.
-- ============================================================================

create or replace function public.erase_beneficiary_records(
  p_beneficiary_id uuid,
  p_include_safeguarding boolean default false
) returns jsonb as $$
declare
  b public.beneficiaries%rowtype;
  match_ids uuid[];
  counts jsonb := '{}'::jsonb;
  n int;
begin
  select * into b from public.beneficiaries where id = p_beneficiary_id for update;
  if not found then
    raise exception 'beneficiary_not_found';
  end if;

  select coalesce(array_agg(id), '{}') into match_ids
  from public.mentorship_matches where beneficiary_id = b.id;

  if not p_include_safeguarding and exists (
    select 1 from public.safeguarding_concerns
    where beneficiary_id = b.id or (b.profile_id is not null and raised_by = b.profile_id)
  ) then
    raise exception 'safeguarding_records_exist';
  end if;

  if p_include_safeguarding then
    delete from public.safeguarding_concerns
    where beneficiary_id = b.id or (b.profile_id is not null and raised_by = b.profile_id);
    get diagnostics n = row_count;
    counts := counts || jsonb_build_object('safeguarding_concerns', n);
  end if;

  delete from public.mentorship_messages where match_id = any(match_ids);
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('mentorship_messages', n);

  delete from public.mentorship_notes where match_id = any(match_ids);
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('mentorship_notes', n);

  delete from public.mentorship_matches where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('mentorship_matches', n);

  delete from public.career_assessments where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('career_assessments', n);

  delete from public.thank_you_messages where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('thank_you_messages', n);

  delete from public.progress_updates where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('progress_updates', n);

  delete from public.interventions where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('interventions', n);

  delete from public.project_beneficiaries where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('project_beneficiaries', n);

  update public.stories set beneficiary_id = null, is_published = false where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('stories_unpublished_and_unlinked', n);

  update public.donations set beneficiary_id = null where beneficiary_id = b.id;
  get diagnostics n = row_count;
  counts := counts || jsonb_build_object('donations_unlinked', n);

  if b.profile_id is not null then
    delete from public.notifications where profile_id = b.profile_id;
    get diagnostics n = row_count;
    counts := counts || jsonb_build_object('notifications', n);
  end if;

  delete from public.beneficiaries where id = b.id;
  if b.application_id is not null then
    delete from public.applications where id = b.application_id;
    get diagnostics n = row_count;
    counts := counts || jsonb_build_object('applications', n);
  end if;

  return jsonb_build_object(
    'tace_id', b.tace_id,
    'profile_id', b.profile_id,
    'application_id', b.application_id,
    'counts', counts
  );
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

revoke all on function public.erase_beneficiary_records(uuid, boolean) from public, anon, authenticated;
grant execute on function public.erase_beneficiary_records(uuid, boolean) to service_role;
