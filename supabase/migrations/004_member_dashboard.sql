-- ============================================================================
-- Ticket 3A support: member-dashboard views + avatars bucket.
-- Idempotent. Run after 002.
-- ============================================================================

-- project_funding: total raised per published, non-archived project. Members have
-- no RLS access to donations (rightly), so this exposes ONLY the sum — never
-- donor names, individual amounts or counts.
drop view if exists public.project_funding;
create view public.project_funding as
select
  p.id as project_id,
  coalesce(sum(d.amount), 0)::numeric(12, 2) as raised
from public.projects p
left join public.donations d on d.project_id = p.id
where p.is_published = true and p.status <> 'archived'
group by p.id;

revoke all on public.project_funding from public, anon, authenticated;
grant select on public.project_funding to authenticated;

-- committee_lead: the trustee in the caller's own committee — name only.
drop view if exists public.committee_lead;
create view public.committee_lead as
select t.full_name
from public.profiles me
join public.profiles t
  on t.committee = me.committee
 and t.member_type = 'trustee'
 and t.status = 'active'
where me.id = auth.uid()
  and me.committee is not null
  and me.role = 'member';

revoke all on public.committee_lead from public, anon, authenticated;
grant select on public.committee_lead to authenticated;

-- avatars: private bucket, path {user_id}/avatar.ext, users manage only their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_own_select" on storage.objects;
create policy "avatars_own_select" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_insert" on storage.objects;
create policy "avatars_own_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_own_update" on storage.objects;
create policy "avatars_own_update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_admin_all" on storage.objects;
create policy "avatars_admin_all" on storage.objects for all
  using (bucket_id = 'avatars' and public.get_role() = 'admin');

-- beneficiary-photos: active members may read ONLY photos that are already
-- exposed through public_beneficiaries (i.e. photography consent given), so
-- Campaign cards can show signed URLs without the service-role client.
drop policy if exists "beneficiary_photos_member_public_select" on storage.objects;
create policy "beneficiary_photos_member_public_select" on storage.objects for select to authenticated
  using (
    bucket_id = 'beneficiary-photos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'member' and p.status = 'active'
    )
    and name in (select photo_url from public.public_beneficiaries where photo_url is not null)
  );
