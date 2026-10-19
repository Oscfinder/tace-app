# TACE Platform — Phase 4 Agent Prompts (Sponsor & Mentor)

## How to Use These Prompts

Each prompt is a self-contained brief for one agent and one ticket. Phases 1–3 must be complete first.

### Build Order

1. **4.0 — Schema & Privacy Hardening** (new migration)
2. **4A — Sponsor Dashboard**
3. **4B — Mentor Vetting, Matching & Consent** (includes the admin Mentors module)
4. **4C — Mentor Dashboard**
5. **4D — Monitored Messaging**

### Repo Conventions (all agents)

- No src/ directory. Next.js 16, root file is proxy.ts
- Dashboards: app/dashboard/sponsor/..., app/dashboard/mentor/...
- shadcn/ui uses Field, not Form. TypeScript strict. Zod on client and server. Server Components by default
- Use the authenticated server client so RLS stays active. Service role only where a ticket says so, only in Server Actions
- New SQL goes in a NEW numbered migration. Never edit old ones. Paste only the new file into the SQL Editor
- Use the next free migration number (check supabase/migrations/)
- Update docs/UPDATES.md after each ticket. Never put tokens or secrets in commands or files

### Issues in the original design, fixed here

- **Sponsors and mentors could read a child's whole record.** Row-level security works per row, not per column, so a sponsor or mentor logged in could query the beneficiaries table and get the address, guardian phone, household income and health details. Ticket 4.0 removes that and gives them narrow views instead
- **No mentor vetting.** Mentors would work with children after only an email signup. 4.0 and 4B add a vetting step that must be cleared before any match
- **Messaging safeguards were missing.** The child is a minor, and the guardian holds the login. 4D adds contact-detail blocking, immutability, instant admin pause and a concern button

---

## Ticket 4.0 — Schema & Privacy Hardening

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Database Agent. Output one idempotent migration, runnable twice in the Supabase SQL Editor. Enable RLS on every new table. Use existing helpers get_role(), get_mentor_id(), get_sponsor_id().

**1. Stop full-row access for sponsors and mentors**

- First list the current policies: `select policyname, cmd, qual from pg_policies where tablename = 'beneficiaries'`. Drop the sponsor and mentor SELECT policies on beneficiaries. Keep admin and the beneficiary's own-record policy
- Create security-definer views, filtered by auth.uid(), granted to authenticated only:
  - `sponsor_children` — for the calling sponsor's linked children: id, first_name, age (computed), current_stage, stage_updated_at, photo_url, support_needed, interests, aspirations, class_level. NO surname, address, phone, email, guardian data, household income, health, disabilities
  - `mentee_profiles` — for the calling mentor's children with an ACTIVE match: the same columns plus edu_status, talents, subjects_skills, match_id. Same exclusions
  - `sponsor_child_support` — interventions (type, description, amount, given_at) for the calling sponsor's linked children
- Check the existing progress_updates policy for sponsors still limits them to their linked child's rows. Check the beneficiary-photos read policy for sponsors and mentors only matches their own linked child's folder

**2. Mentor vetting**

- Add to `mentors`: vetting_status text default 'pending' check (pending, cleared, rejected), vetting_notes, vetted_by, vetted_at, code_of_conduct_accepted_at
- Add a column-guard trigger so only an admin can change vetting_status, vetting_notes, vetted_by or vetted_at (same pattern as the profiles trigger)

**3. Matches and consent**

- Add `next_check_in timestamptz` to mentorship_matches
- Column-guard trigger: a mentor can change only consent_mentor and consent_mentor_at on their own match; the beneficiary account (guardian) can change only consent_guardian and consent_guardian_at on their own child's match; only admin can change status
- Trigger: when both consents are true AND the mentor's vetting_status = 'cleared', set the match status to 'active' and started_at to now(). Never from client code
- Admin pause/terminate: setting status to 'paused' or 'terminated' must immediately block new messages (see 4)

**4. Messaging rules (mentorship_messages)**

- Insert policy: sender_id = auth.uid(), the match status = 'active', and sender_type matches the sender's role (mentor, or beneficiary for the child/guardian account)
- Messages cannot be updated or deleted by users. Admin may only update is_flagged, flag_reason, flagged_by and flagged_at
- Read: the match's mentor, the match's beneficiary account, and admin
- Backstop trigger: if content contains a phone number, email address, URL or social handle, set is_flagged = true and flag_reason = 'contact details'
- Add the table to the supabase_realtime publication so RLS-filtered realtime works

**5. New table `safeguarding_concerns`**

- id, raised_by (profiles), match_id (nullable), beneficiary_id, description not null, status default 'open' check (open, reviewing, closed), handled_by, handled_at, created_at
- RLS: admin all; mentor, sponsor and beneficiary accounts can insert with raised_by = auth.uid() and select their own

**ACCEPTANCE CRITERIA:**

- [ ] Migration runs twice cleanly; RLS on safeguarding_concerns
- [ ] A test sponsor and a test mentor querying `beneficiaries` directly get zero rows
- [ ] The views return only the listed columns, and only for the caller's own linked children
- [ ] A mentor cannot set their own vetting_status
- [ ] The match becomes active only when both consents are true and the mentor is cleared
- [ ] A message insert fails when the match is pending, paused or terminated
- [ ] A message containing a phone number or email is flagged by the trigger

**DO NOT:** change public_beneficiaries; build any frontend.

---

## Ticket 4A — Sponsor Dashboard

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Frontend Agent building the Sponsor Dashboard under app/dashboard/sponsor/.

**CONTEXT:** A sponsor has been activated by an admin and linked to one or more children (beneficiaries.sponsor_id). They see their child's progress and their own giving. They never see PII. Query only the views from 4.0 and their own donations.

**PREREQUISITES:** Phases 1–3, Ticket 4.0.

**DELIVERABLES:**

1. **Layout:** simple sidebar or top nav, notification bell (existing notifications table)
2. **Home:** card per linked child (photo via signed URL, first name, age, current stage), total given, latest update
3. **My Child:** profile from sponsor_children; 9-step journey tracker (reuse the component from the beneficiary dashboard); interests and aspirations
4. **Progress:** progress_updates for the child, newest first
5. **How my support is used:** from sponsor_child_support — type, description, amount, date
6. **My Giving:** the sponsor's own donations (date, amount, purpose), receipt status, total donated, and a card with the bank details and `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` for giving again. Show only donations where sponsor_id is theirs
7. **Thank-you messages:** list the approved messages from their child (status = 'approved' only)
8. **My Profile:** edit name, phone
9. **Extra notification:** when an admin changes a linked child's stage (Ticket 2C), also insert a notification for the child's sponsor
10. **No linked child yet:** a friendly state explaining that an admin links the child after the first transfer is confirmed

**ACCEPTANCE CRITERIA:**

- [ ] A sponsor sees only their own child and their own donations (test with two sponsors)
- [ ] No page queries beneficiaries or applications directly
- [ ] A pending thank-you message is invisible to the sponsor
- [ ] A pending or inactive sponsor cannot reach any page (proxy.ts)
- [ ] Empty states everywhere; works at 375px

**DO NOT:** add a Paystack or card payment flow (bank transfer only for now); let a sponsor pick or switch children; show the child's surname, address, school address, guardian details or health information.

---

## Ticket 4B — Mentor Vetting, Matching & Consent

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Full-Stack Agent building the admin Mentors module and the two-sided consent flow. A mentor works with a child, so this ticket decides who is allowed to.

**PREREQUISITES:** Phases 1–3, Ticket 4.0.

**DELIVERABLES:**

1. **Admin Mentors list** at /dashboard/admin/mentors (this is the sidebar link that 404s today): name, profession, track, vetting status, account status, number of active mentees. Filters for track, vetting status and status
2. **Admin mentor detail:** the signup details, then a **vetting panel**: checklist (identity checked, two references, character or background check, interview done), notes, and the buttons Clear and Reject. Only Clear sets vetting_status = 'cleared' and vetted_by, vetted_at. Activating the mentor account (profiles.status = 'active') is a separate button and is allowed only when cleared. Send the mentor an email either way
3. **Mentor code of conduct:** on a mentor's first login, a screen with the code of conduct (draft text, marked for legal review: no private contact outside the platform, no gifts or money, report concerns, follow the guardian's wishes, no photos of the child, you will be monitored). A required tick plus the typed full name saves code_of_conduct_accepted_at. Nothing else is available until accepted
4. **Match creation (admin):** from a beneficiary profile or the mentor detail, choose a mentor who is cleared, active and not over a cap of 5 active mentees (a constant), and show the suggested matches: same preferred age group, and a mentor_track suggestion from the child's latest career_assessments.recommended_mentor_track. This creates a mentorship_matches row with status 'pending_consent' and notifies both sides
5. **Mentor consent:** the mentor sees the request (child's first name, age, interests, aspirations) and accepts or declines. Accepting sets consent_mentor and consent_mentor_at. Declining sets the match to 'terminated'
6. **Guardian consent:** the beneficiary dashboard (Ticket 3C) gets a "Mentor request" card with the mentor's name, profession and track, a plain explanation of how messaging is monitored, and Accept or Decline. Accepting sets consent_guardian and consent_guardian_at. Declining ends the match
7. **Activation:** only by the database trigger from 4.0 once both consents are true and the mentor is cleared. The UI never sets status 'active'
8. **Admin controls on a match:** pause, resume, terminate with a reason. Each notifies the mentor and the guardian. A paused or terminated match must stop all messaging immediately

**ACCEPTANCE CRITERIA:**

- [ ] A mentor with vetting pending or rejected cannot be matched or activated
- [ ] Both consents are needed before the match turns active, and the status cannot be set from client code
- [ ] A guardian cannot consent on another child's match, and a mentor cannot consent for the guardian (test both)
- [ ] A mentor cannot reach any mentor page until the code of conduct is accepted
- [ ] Pausing a match stops new messages straight away
- [ ] The Mentors sidebar link now works

**DO NOT:** let an admin tick consent on anyone's behalf; skip the vetting check in the UI as well as the database; build the messaging screen (4D) or the mentor dashboard pages (4C).

---

## Ticket 4C — Mentor Dashboard

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Frontend Agent building the Mentor Dashboard under app/dashboard/mentor/.

**CONTEXT:** A cleared, active mentor with an ACTIVE match sees their mentees through the mentee_profiles view only. Never the beneficiaries table.

**PREREQUISITES:** Phases 1–3, Tickets 4.0 and 4B.

**DELIVERABLES:**

1. **Layout and notification bell**
2. **Home:** pending requests, active mentees, next check-ins, unread messages count
3. **My Mentees:** card per mentee (photo, first name, age, stage, interests)
4. **Mentee page:** profile from mentee_profiles, journey tracker, the latest career assessment (existing RLS allows it), notes history, next check-in
5. **Monthly notes:** form saving to mentorship_notes (topics discussed, improvements, concerns, next steps, check_in_date). Admin can read all of them
6. **Schedule next check-in:** sets mentorship_matches.next_check_in. The child's My Mentor page then shows it instead of "Not scheduled yet"
7. **Raise a concern:** a prominent button on each mentee page. It inserts a safeguarding_concerns row and notifies the admin. Add the open-concerns queue to the admin dashboard with status changes
8. **Mentor profile:** edit name, phone, availability, expertise. Vetting fields are read-only
9. **Resources:** reuse the resources bucket list from the member dashboard if the mentor has access, otherwise skip

**ACCEPTANCE CRITERIA:**

- [ ] A mentor sees only mentees with an active match, and no one else's child (test with two mentors)
- [ ] No query touches beneficiaries, applications or guardian details
- [ ] A concern appears in the admin queue and notifies the admin
- [ ] The next check-in appears on the child's My Mentor page
- [ ] Works at 375px, with empty states

**DO NOT:** show the child's surname, address, guardian phone or email, household income or health data; build messaging (4D).

---

## Ticket 4D — Monitored Messaging

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Full-Stack Agent building the monitored mentor and child messaging. One side is a minor, usually written for by the guardian, so the safeguards matter as much as the chat.

**PREREQUISITES:** Phases 1–3, Tickets 4.0, 4B and 4C.

**DELIVERABLES:**

1. **Chat UI** for the mentor (app/dashboard/mentor/messages/[matchId]) and for the child account (app/dashboard/beneficiary/mentor/messages): message list, input, loading and error states, mobile-first. Enable the Message button that 3C left disabled. It is available only while the match is 'active'
2. **Realtime:** Supabase Realtime subscription on mentorship_messages for that match. RLS decides who receives rows. Fall back to polling every 15 seconds if realtime fails
3. **Sending:** a Server Action that checks the match is active, validates length (1 to 1000 characters), and BLOCKS the message with a kind explanation if it contains a phone number, email address, link or social handle. The database trigger from 4.0 stays as the backstop
4. **Rate limit:** no more than 30 messages per sender per hour
5. **No edits, no deletes, no attachments** in this ticket
6. **Read tracking:** set read_at when the other side opens the thread
7. **Safeguarding button** in the chat: "Something doesn't feel right" opens a short form that creates a safeguarding_concerns row, notifies the admin, and keeps the chat open
8. **Admin message monitor** at /dashboard/admin/messages: every thread with unread flagged counts, a flagged-messages queue, a full read-only transcript view, Flag and Unflag with a reason, and Pause match. Add it to the sidebar
9. **Notifications:** notify the other side of a new message (a notification row, throttled to one unread per thread). No message text in the notification
10. **Disclosure:** a one-line notice at the top of every chat: "Messages on TACE are visible to TACE staff to keep children safe."

**ACCEPTANCE CRITERIA:**

- [ ] Messages go through in real time between a mentor test account and a child test account
- [ ] Sending while the match is pending, paused or terminated fails, and pausing a live match stops the next send
- [ ] A message with a phone number, email or link is blocked with a friendly message
- [ ] A third user cannot read the thread, even by calling the Supabase API directly (test it)
- [ ] Admin can read the whole transcript and flag a message
- [ ] A concern raised in chat lands in the admin queue
- [ ] The 31st message in an hour is refused

**DO NOT:** allow editing or deleting messages; add file or image sharing; add group chats; let the admin impersonate the child or mentor.

---

## Definition of Done — Phase 4

A sponsor can log in and see their child's progress and their own giving, with no private details. A mentor can sign up, be vetted, accept the code of conduct, be matched with both consents given, and exchange monitored messages with the child's account. An admin can see every thread, flag messages and pause any match, and no sponsor or mentor can read a child's full record.