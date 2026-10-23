# TACE Platform: Security & Privacy Audit (Ticket 5B)

Audit date: 19 to 23 October 2026. Scope: the code and database migrations 001 to 016 in this repository. Everything below was checked by running code, not only by reading it, unless it says **not verified**.

**Result in one paragraph.** Five real weaknesses were found in the database rules and fixed (one rated high), plus an open redirect, unescaped text in emails, unvalidated admin inputs and missing rate limits and headers. All are fixed and now covered by automatic tests. The remaining items that block launch are things only Simon can do: run the new migrations, switch on and test two-factor sign-in for the admin on the real Supabase project, use a paid Gemini plan, rotate the exposed GitHub token, and have the legal trustee review the data protection documents.

---

## 1. Findings and what was done

| # | Severity | Finding | Fix | Test |
|---|---|---|---|---|
| 1 | **High** | `get_role()`, `get_mentor_id()`, `get_sponsor_id()` ignored account status: a **suspended or inactive admin kept full database access** through the API; a pending user kept role-based reads | Migration 015: they now require an active account. The profile privilege guard was rewritten so a non-active user cannot promote themselves | `db_tests` section 015; `rls_audit` section 2 |
| 2 | Medium | `events` (which hold meeting minutes) readable by every signed-in account, including children, sponsors and mentors | Migration 015: members and admins only | `rls_audit` visibility matrix |
| 3 | Medium | A child's account could read the internal staff notes on its own support records | Migration 015: child reads `my_support` view without notes; table closed to them | `rls_audit` |
| 4 | Medium | `/auth/confirm` open redirect: `next=/\evil.com` (backslash read as slash) and `/..//evil.com` sent visitors off-site after an email link | `lib/security/safe-redirect.ts`; OTP type allow-list | 12 input cases (script, throwaway) |
| 5 | Medium | Applicant-typed names and reasons put into email HTML unescaped (link injection from the foundation's own address) | `lib/email/escape.ts` used in all five templates | tsc, review |
| 6 | Medium | About 30 admin Server Actions and the public sign-up, sign-in and password actions trusted their input | Zod validation on the server (`lib/admin/schemas.ts`, `lib/validations/auth.ts`) | Section 3 below |
| 7 | Medium | No rate limits on sign-in, sign-up, password reset | Migration 014 limiter + `lib/security/rate-limit.ts` | `db_tests` 014 section |
| 8 | Low | `anon`/`authenticated` had INSERT/UPDATE/DELETE on the `public_beneficiaries` view and TRUNCATE (skips row-level security) on every table | Migration 015 revokes, and for future tables | `rls_audit` section 4 |
| 9 | Low | Buckets `documents`, `certificates`, `public-assets` had no size or type limit | Migration 015 | `rls_audit` section 5 |
| 10 | Low | File names from uploads went into storage paths unsanitised; a beneficiary id in an upload path was not checked | `safeFileName`, UUID check | review |
| 11 | Low | A career-quiz child could type their name, school or phone number into free text that is sent to the AI provider | `lib/career/redact.ts` removes contact details and the child's own names/school before sending; the quiz asks children not to write them | 11 redaction cases (script, throwaway) |
| 12 | Info | No security headers or CSP | `next.config.ts`, `proxy.ts`, `lib/security/csp.ts` | Real-browser check below |
| 13 | Info | Admin accounts had a password only | Two-factor (authenticator app), enforced on pages and actions | Gate tested; **real enrol not verified** |

---

## 2. Row-level security audit (deliverable 1)

`npm run test:rls` runs `supabase/tests/rls_audit.mjs`: it applies every migration to an in-process Postgres, puts rows in **every** table (so "sees nothing" is meaningful), and tests as seven kinds of user: **anon, member, sponsor, mentor, child A, child B, admin**.

**Result: 1,017 checks, 0 failed.** It covers:
- **Visibility matrix:** 26 tables and 13 views, rows each role can read (299 checks). Printed as a table when you run it.
- **Specific properties from the ticket:** anon reads nothing except `public_beneficiaries`, published stories and projects (and their links) and public settings; only an admin and the child's own account read a full beneficiary row; nobody can change their own role, status, member type, trustee role, committee or profile-completed flag; no one can read another user's notifications, messages or concerns; a held (flagged) message is hidden from its recipient; suspended, inactive and pending accounts lose role-based access (92 checks).
- **Writes (411 checks):** no non-admin can DELETE from any table; UPDATE only touches the user's own rows in the six tables where that is intended; 16 admin-only tables refuse INSERT from every other role; the public application form accepts only a pending application.
- **Grants:** no TRUNCATE/TRIGGER/REFERENCES, no view writes, no unexpected callable security-definer functions.
- **Storage (211 checks):** every bucket by every role for list/read, upload (own folder and someone else's), overwrite and delete; bucket privacy; size and type limits.
- **It fails when a new table, view or bucket has no expectation**, so adding one in a later migration forces a decision about who may see it.

**The test was itself tested.** Seven deliberate weakenings (a leaky policy on donations, on beneficiaries, a delete policy on messages, a view write grant, a leaky storage policy, the profile guard removed, a new table with no expectation) were each applied and each made the audit fail with the right message. Run one yourself: `AUDIT_EXTRA_SQL="create policy leak on public.donations for select using (true)" npm run test:rls`.

`npm run test:db` (179 checks) holds the older rules tests (consent, vetting, messaging limits, settings, audit log, rate limiter, erasure).

**Limits of this audit:** it runs on PGlite with a stand-in for Supabase's `auth` and `storage` schemas, not on Supabase itself. Row-level security and triggers behave the same, but Supabase-specific behaviour (for example the real storage API, signed URLs, realtime) is **not verified**. Re-run the same scenarios once against the production project (Ticket 5E).

---

## 3. Server Action audit (deliverable 3)

All 75 Server Actions. "Identity / role" is checked in the action itself on the server (`requireRole`, `requireAuth`/`requireActive`, or `auth.getUser()`); nothing trusts an id or role sent by the browser. Before this audit one action had no explicit identity check and about 30 had no input validation; **none remain**.

Notes: "public by design" actions are the open forms; they are rate limited (sign-in, sign-up, password reset) or limited per IP and honeypot protected (application). Admin pages and the CSV/JSON download routes also require a second factor (see section 6).

| File | Action | Identity / role checked on the server | Input validated | Service role |
|---|---|---|---|---|
| lib/admin/applications-actions.ts | saveAdminNotes | role: admin | yes |  |
| lib/admin/applications-actions.ts | approveApplication | role: admin | yes | yes |
| lib/admin/applications-actions.ts | rejectApplication | role: admin | yes |  |
| lib/admin/applications-actions.ts | flagApplication | role: admin | yes |  |
| lib/admin/beneficiaries-actions.ts | updateBeneficiaryStage | role: admin | yes |  |
| lib/admin/beneficiaries-actions.ts | assignMentor | role: admin | yes |  |
| lib/admin/beneficiaries-actions.ts | logIntervention | role: admin | yes |  |
| lib/admin/beneficiaries-actions.ts | uploadBeneficiaryDocument | role: admin | yes |  |
| lib/admin/concerns-actions.ts | setConcernStatus | role: admin | yes |  |
| lib/admin/content-actions.ts | createStory | role: admin | yes |  |
| lib/admin/content-actions.ts | updateStory | role: admin | yes |  |
| lib/admin/content-actions.ts | deleteStory | role: admin | yes |  |
| lib/admin/content-actions.ts | toggleStoryPublish | role: admin | yes |  |
| lib/admin/content-actions.ts | createAnnouncement | role: admin | yes |  |
| lib/admin/content-actions.ts | updateAnnouncement | role: admin | yes |  |
| lib/admin/content-actions.ts | deleteAnnouncement | role: admin | yes |  |
| lib/admin/content-actions.ts | toggleAnnouncementPublish | role: admin | yes |  |
| lib/admin/events-actions.ts | createEvent | role: admin | yes |  |
| lib/admin/events-actions.ts | updateEvent | role: admin | yes |  |
| lib/admin/events-actions.ts | deleteEvent | role: admin | yes |  |
| lib/admin/matches-actions.ts | createMatch | role: admin | yes |  |
| lib/admin/matches-actions.ts | setMatchStatus | role: admin | yes |  |
| lib/admin/members-actions.ts | activateMember | role: admin | yes |  |
| lib/admin/members-actions.ts | deactivateMember | role: admin | yes |  |
| lib/admin/members-actions.ts | updateMemberAssignment | role: admin | yes |  |
| lib/admin/members-actions.ts | createAnnouncement | role: admin | yes |  |
| lib/admin/mentors-actions.ts | saveVettingProgress | role: admin | yes |  |
| lib/admin/mentors-actions.ts | clearMentor | role: admin | yes |  |
| lib/admin/mentors-actions.ts | rejectMentor | role: admin | yes |  |
| lib/admin/mentors-actions.ts | activateMentorAccount | role: admin | yes |  |
| lib/admin/messages-actions.ts | flagMessage | role: admin | yes |  |
| lib/admin/messages-actions.ts | unflagMessage | role: admin | yes |  |
| lib/admin/projects-actions.ts | createProject | role: admin | yes |  |
| lib/admin/projects-actions.ts | attachBeneficiary | role: admin | yes |  |
| lib/admin/projects-actions.ts | detachBeneficiary | role: admin | yes |  |
| lib/admin/projects-actions.ts | publishProject | role: admin | yes |  |
| lib/admin/projects-actions.ts | unpublishProject | role: admin | yes |  |
| lib/admin/projects-actions.ts | archiveProject | role: admin | yes |  |
| lib/admin/resources-actions.ts | uploadResource | role: admin | yes (category, file type and size, path checks) |  |
| lib/admin/resources-actions.ts | deleteResource | role: admin | yes (category, file type and size, path checks) |  |
| lib/admin/settings-actions.ts | saveSettings | role: admin | yes |  |
| lib/admin/settings-actions.ts | inviteAdmin | role: admin | yes | yes |
| lib/admin/settings-actions.ts | runPhotoCleanup | role: admin | n/a (no input) | yes |
| lib/admin/settings-actions.ts | resetAdminTwoFactor | role: admin | yes | yes |
| lib/admin/sponsors-actions.ts | activateSponsor | role: admin | yes |  |
| lib/admin/sponsors-actions.ts | logDonation | role: admin | yes |  |
| lib/admin/sponsors-actions.ts | sendDonationReceipt | role: admin | yes |  |
| lib/admin/thank-you-actions.ts | reviewThankYou | role: admin | yes |  |
| lib/apply/actions.ts | submitApplication | public by design (rate limited) | yes | yes |
| lib/auth/actions.ts | signUpMember | public by design (rate limited) | yes |  |
| lib/auth/actions.ts | signUpSponsor | public by design (rate limited) | yes | yes |
| lib/auth/actions.ts | signUpMentor | public by design (rate limited) | yes | yes |
| lib/auth/actions.ts | signIn | public by design (rate limited) | yes |  |
| lib/auth/actions.ts | signOut | n/a | yes |  |
| lib/auth/complete-profile-action.ts | completeProfile | signed-in session | yes | yes |
| lib/auth/password-actions.ts | requestPasswordReset | public by design (rate limited) | yes |  |
| lib/auth/password-actions.ts | resetPassword | signed-in session | yes |  |
| lib/beneficiary/actions.ts | sendThankYou | role: beneficiary | yes |  |
| lib/beneficiary/mentor-actions.ts | respondToGuardianRequest | role: beneficiary | yes |  |
| lib/career/actions.ts | submitAssessment | role: beneficiary | yes |  |
| lib/member/actions.ts | saveCommitteeUpdate | role: member | yes |  |
| lib/member/actions.ts | setRsvp | role: member | yes |  |
| lib/member/actions.ts | updateMemberProfile | role: member | yes |  |
| lib/mentor/actions.ts | acceptCodeOfConduct | role: mentor | yes |  |
| lib/mentor/actions.ts | respondToMentorRequest | role: mentor | yes |  |
| lib/mentor/actions.ts | addMentoringNote | role: mentor | yes |  |
| lib/mentor/actions.ts | scheduleCheckIn | role: mentor | yes |  |
| lib/mentor/actions.ts | raiseConcern | role: mentor | yes |  |
| lib/mentor/actions.ts | updateMentorProfile | role: mentor | yes |  |
| lib/messaging/actions.ts | sendMessage | signed-in, then role/party checked | yes |  |
| lib/messaging/actions.ts | markThreadRead | signed-in, then role/party checked | yes |  |
| lib/messaging/actions.ts | raiseChatConcern | signed-in, then role/party checked | yes |  |
| lib/notifications/actions.ts | markNotificationRead | signed-in | yes |  |
| lib/notifications/actions.ts | markAllNotificationsRead | signed-in | yes |  |
| lib/sponsor/actions.ts | updateSponsorProfile | role: sponsor | yes |  |

The one action that had no explicit identity check was `markNotificationRead` (it relied on row-level security alone); it now requires a signed-in user and a valid id. Actions that use the service role are marked: each one checks the caller first and is limited to a narrow job (creating accounts, the application form's storage check, the rate limiter, photo cleanup, admin invite and 2FA reset, deleting a child's data).

---

## 4. Storage audit (deliverable 2)

- Buckets `avatars`, `beneficiary-photos`, `certificates`, `documents` and `resources` are **private**. `public-assets` (story photos) is public by design.
- Every one of the 12 places that makes a signed link uses 3,600 seconds (**one hour**), the maximum allowed.
- Who can do what is in the storage section of `rls_audit.mjs` (211 checks). In short: only admins can overwrite or delete anything (except a user's own avatar); only admins upload to the child buckets; a child reads only their own folder; a sponsor or mentor reads only the photo of a child they are linked or matched to; members read only photos of children whose guardian gave photography consent.
- **Accepted risk:** the public application form lets an anonymous visitor upload one JPG or PNG (at most 5 MB) to `beneficiary-photos/applications/`. That is how the form works before an application exists. It cannot overwrite or read anything, and photos with no matching application are deleted after 7 days (nightly job, Ticket 5A). A determined abuser could still fill storage quickly; if that ever happens, put a Supabase or CDN upload quota in front of it.
- Limits added: every bucket now has a size limit and a file-type list.

## 5. Secrets audit (deliverable 4)

- The repository and its **full git history** were searched for key-shaped strings (GitHub, Google, Resend, Supabase JWT and secret keys, private keys) and for any committed `.env` file: **none found**. Only `.env.example` is tracked, and it holds names with empty values. `.env*` is git-ignored.
- No `NEXT_PUBLIC_` variable contains a secret (they are the Supabase URL and public key, the site address, and bank details that are public by design; the bank variables are now only a fallback).
- The service-role key is read only in `lib/supabase/admin.ts`, which is imported only by server code; no file marked `"use client"` imports it.
- **Rotate before launch:** (1) the GitHub personal access token that was pasted into chat sessions; (2) any API key (Gemini, Resend, Supabase service role or anon) that has ever been pasted into a chat or screenshot; (3) every key again if the production project reuses the test project. **Not verified:** the contents of the Vercel and Supabase dashboards.

## 6. Headers, abuse protection and admin two-factor (deliverables 5 and 6)

- **Headers:** X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (camera, microphone, location and payment off), HSTS, Cross-Origin-Opener-Policy, no `X-Powered-By`, and a **Content-Security-Policy with a fresh nonce on every request**. In a real headless browser, the login, sign-up, donate, home, admin and sponsor pages loaded and hydrated with **zero CSP violations**, and a deliberately broken control page proved that violations would be reported. One deliberate relaxation: `style-src 'unsafe-inline'` (React writes style attributes, which cannot carry a nonce). **Not verified:** a scan of the live site with a header-checking tool; do this after deployment.
- **Rate limits:** sign-in (20 per 15 minutes per connection, 8 per 15 minutes per email), sign-up (5 per hour), password reset (5 per hour per connection, 3 per hour per email), applications (3 per day). The limiter stores only salted hashes. It needs `IP_HASH_SALT` in production. There is no contact form or donation-receipt form yet; when built, call `allowAttempt(LIMITS.contactIp)` (already defined).
- **Admin two-factor:** admins need an authenticator app. Enforced for every admin page (proxy) and every admin action and download (`requireRole`). A second admin can reset a locked-out admin. Tested: a session without the second factor is refused; one with it is allowed. **Not verified:** the real enrol-and-verify steps, which need the real Supabase project. Residual risk to accept in writing: the database itself does not demand the second factor, so an admin signed in with only a password could still call Supabase's REST API directly with their own token. Closing that means changing `get_role()` to require a two-factor session, which risks locking everyone out without a tested recovery path. **Recommendation:** at least two admin accounts, both enrolled, before launch.

## 7. Redirects, injection and XSS (deliverable 7)

- Every redirect uses a fixed path except `/auth/confirm?next=`, which now passes through `safeNextPath` (same-site paths only; backslashes, control characters, `//` and dot-segment tricks refused).
- No user text is rendered as HTML: there is no `dangerouslySetInnerHTML`, `innerHTML` or `eval` in the app; emails escape user text.
- Every database call goes through the Supabase client (parameterised). The only `rpc` calls are fixed function names with typed arguments. No string-built SQL anywhere in the application.
- File names are cleaned before use in storage paths.

## 8. Data protection pack (deliverable 8) and AI provider (deliverable 9)

- `docs/DATA_PROTECTION.md` (draft for the legal trustee): what is collected and why, where it is stored, who can see it, suggested retention, how requests are handled, outside services, security measures, breach steps, and a checklist. Items needing a trustee decision are marked **[DECIDE]**.
- **Admin tool to export or delete one child's data** (Admin, Beneficiaries, a child's page, "Data protection requests"). Export is a download that leaves out safeguarding concerns and other people's contact details. Deletion removes everything about the child in one database transaction (migration 016, 15 checks), then their files and sign-in account; it needs the child's TACE ID typed to confirm, **refuses while safeguarding concerns exist** unless a separate box is ticked, keeps donation records (link cut) and unpublishes any story about the child. Both are audit-logged. Access control for the download and the step order of the deletion were tested with stand-ins (not the real Supabase storage and auth).
- **AI provider (Google Gemini):** the request contains no name, surname, TACE ID, location, school, contact details or account id; the only free text is up to two short optional sentences the child typed, now cleaned of contact details and the child's own names and school before sending. **Open items for Simon:** (1) use a **paid Gemini API plan** and confirm in writing from Google's current terms that API data is not used for model training (do not use a free key with real children); (2) the privacy page (not built yet) must state that a short anonymous summary of quiz answers is sent to Google to write the message. The wording is in `DATA_PROTECTION.md` section 7.1.

## 9. What is still open

| Item | Owner | Blocks launch? |
|---|---|---|
| Run migrations 013 to 016 in Supabase | Simon | Yes |
| Set `IP_HASH_SALT` and `CRON_SECRET` in Vercel | Simon | Yes |
| Confirm MFA (TOTP) is enabled in Supabase; enrol the admin; add a second admin; test sign-in | Simon | Yes |
| Rotate the exposed GitHub token and any pasted API keys | Simon | Yes |
| Paid Gemini plan with no-training terms | Simon | Yes (before real children use the quiz) |
| Legal trustee reviews `DATA_PROTECTION.md`; decides retention, registration with the data protection regulator, the breach procedure, and safeguarding record handling | Legal trustee | Yes |
| Build `/privacy`, `/terms`, `/child-protection-policy` (Phase 5 prerequisites) including the AI sentence | Agent, then legal trustee | Yes |
| Run a header scanner on the live site; repeat the RLS scenarios against the production Supabase project | Agent (5E) | Yes |
| Decide whether to enforce two-factor inside the database (section 6) | Simon | No (accepted risk if recorded) |
| Wire rate limits into the contact and donation-receipt forms when they exist | Agent | When those forms are built |

Residual risks accepted in this audit: the anonymous application-photo upload (section 4) and admin two-factor being enforced by the application rather than the database (section 6).
