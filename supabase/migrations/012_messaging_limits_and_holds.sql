-- ============================================================================
-- 012 (Ticket 4D): message rate limit + hold flagged messages. Idempotent.
-- New file; earlier migrations are untouched.
-- ============================================================================

-- 1. RATE LIMIT: at most 30 messages per sender per rolling hour.
-- The app checks this first to give a friendly message, but it is enforced
-- here too, because RLS lets a signed-in user insert straight through the API.
-- auth.uid() is null for the service role, which is not limited.
create or replace function public.limit_message_rate() returns trigger as $$
declare recent int;
begin
  if auth.uid() is null then
    return new;
  end if;
  select count(*) into recent
  from public.mentorship_messages
  where sender_id = new.sender_id
    and created_at > now() - interval '1 hour';
  if recent >= 30 then
    raise exception 'Message limit reached: 30 messages per hour.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, pg_temp;

drop trigger if exists a_limit_message_rate on public.mentorship_messages;
create trigger a_limit_message_rate
  before insert on public.mentorship_messages
  for each row execute function public.limit_message_rate();

-- 2. HOLD FLAGGED MESSAGES. The contact-details trigger (008) flags rather than
-- rejects, so a message with a phone number can still get through the app's own
-- check. Until now the other side could read it. Now a flagged message is
-- visible only to its SENDER (shown to them as "held for review") and to admin;
-- the recipient never sees it unless an admin reviews and un-flags it.
-- This applies equally when an admin flags a message by hand.
drop policy if exists "mentorship_messages_mentor_select" on public.mentorship_messages;
create policy "mentorship_messages_mentor_select" on public.mentorship_messages for select
  using (
    match_id in (select id from public.mentorship_matches where mentor_id = public.get_mentor_id())
    and (coalesce(is_flagged, false) = false or sender_id = auth.uid())
  );

drop policy if exists "mentorship_messages_beneficiary_select" on public.mentorship_messages;
create policy "mentorship_messages_beneficiary_select" on public.mentorship_messages for select
  using (
    match_id in (
      select mm.id from public.mentorship_matches mm
      join public.beneficiaries b on b.id = mm.beneficiary_id
      where b.profile_id = auth.uid()
    )
    and (coalesce(is_flagged, false) = false or sender_id = auth.uid())
  );

-- 3. mark_thread_read (008) must not mark a HELD message as read by someone who
-- was never shown it. Same function as before, but it skips flagged messages.
create or replace function public.mark_thread_read(p_match_id uuid) returns void as $$
begin
  if not exists (
    select 1 from public.mentorship_matches m
    where m.id = p_match_id
      and (
        m.mentor_id = public.get_mentor_id()
        or exists (
          select 1 from public.beneficiaries b
          where b.id = m.beneficiary_id and b.profile_id = auth.uid()
        )
      )
  ) then
    return;
  end if;
  perform set_config('tace.mark_read', '1', true);
  update public.mentorship_messages
  set read_at = now()
  where match_id = p_match_id
    and sender_id <> auth.uid()
    and read_at is null
    and coalesce(is_flagged, false) = false;
  perform set_config('tace.mark_read', '0', true);
end;
$$ language plpgsql security definer set search_path = public, pg_temp;
