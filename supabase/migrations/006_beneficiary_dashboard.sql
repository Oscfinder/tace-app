-- ============================================================================
-- Ticket 3C support: a beneficiary can read their OWN photo. Idempotent.
-- Path convention is {beneficiary_id}/photo.ext (see movePhotoToBeneficiary).
-- Sponsors/mentors/admin already have read policies from 001.
-- ============================================================================

drop policy if exists "beneficiary_photos_self_select" on storage.objects;
create policy "beneficiary_photos_self_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'beneficiary-photos'
    and exists (
      select 1 from public.beneficiaries b
      where b.id::text = (storage.foldername(name))[1]
        and b.profile_id = auth.uid()
    )
  );
