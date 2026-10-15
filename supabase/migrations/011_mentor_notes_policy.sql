-- ============================================================================
-- 011 (Ticket 4C): tighten who can write mentoring notes. Idempotent.
-- New file; earlier migrations are untouched.
--
-- WHY: the original policy ("for all using (mentor_id = get_mentor_id())") only
-- checked that the note carries the mentor's own id. Nothing checked that the
-- match_id belonged to that mentor, so a mentor could attach a note to ANOTHER
-- mentor's match (a child they don't mentor), or to a paused/ended one.
--
-- NOW:
--   read   : a mentor reads their own notes; admin reads all (policy from 001).
--   insert : only for the mentor's OWN match, and only while it is ACTIVE.
--   update / delete : nobody. Notes are an append-only record (they are part of
--            how TACE keeps children safe), so they can't be edited or removed.
-- ============================================================================

drop policy if exists "mentorship_notes_mentor_all" on public.mentorship_notes;

drop policy if exists "mentorship_notes_mentor_select" on public.mentorship_notes;
create policy "mentorship_notes_mentor_select" on public.mentorship_notes for select
  using (mentor_id = public.get_mentor_id());

drop policy if exists "mentorship_notes_mentor_insert" on public.mentorship_notes;
create policy "mentorship_notes_mentor_insert" on public.mentorship_notes for insert
  with check (
    mentor_id = public.get_mentor_id()
    and exists (
      select 1 from public.mentorship_matches m
      where m.id = mentorship_notes.match_id
        and m.mentor_id = public.get_mentor_id()
        and m.status = 'active'
    )
  );
