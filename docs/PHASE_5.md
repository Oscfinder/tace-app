# TACE Platform — Phase 5 Agent Prompts (Polish & Launch)

## How to Use These Prompts

Each prompt is a self-contained brief for one agent and one ticket. Phases 1–4 must be built first. Phase 5 makes the platform safe, fast and reliable enough for real children's data, then launches it.

### Build Order

1. **5A — Carry-over Completion** (missing admin pages and earlier gaps)
2. **5B — Security & Privacy Audit**
3. **5C — Performance, Errors & Email**
4. **5D — Accessibility, Mobile & Automated Tests**
5. **5E — Go Live**

### Repo Conventions (all agents)

- No src/ directory. Next.js 16, root file is proxy.ts
- shadcn/ui uses Field, not Form. TypeScript strict. Zod on client and server
- New SQL goes in a NEW numbered migration (next free number). Never edit old ones
- Use the authenticated server client so RLS stays active. Service role only in Server Actions where a ticket says so
- Never put tokens or secrets in commands, files or logs
- Update docs/UPDATES.md after each ticket

### Before Phase 5 starts, these must be built

If any of these are still open, build them first (prompts already written):

- Public pages: /stories, /sponsor, /donate, /about, /programmes, /contact, /privacy, /terms, /child-protection-policy
- 3A fixes: Home children count, `committee` column on events, admin screens for events and resources
- Email-link handling (/auth/confirm, forgot and reset password)

---

## Ticket 5A — Carry-over Completion

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Full-Stack Agent closing the gaps that earlier phases left open.

**CONTEXT:** The admin sidebar links to pages that do not exist yet, and a few features were deferred. This ticket finishes them.

**DELIVERABLES:**

1. **Finance & Donations** at /dashboard/admin/finance
   - All donations in a table: date, donor, sponsor, project, child, amount, purpose, receipt status. Filters for date range, sponsor, project and receipt status. Totals for the filtered set
   - Log donation and Send receipt reuse the existing 2E actions
   - CSV export of the filtered table (admin only, server-side)
2. **Reports** at /dashboard/admin/reports
   - Counts and trends: applications by status per month, active children by stage, active mentors and matches, donations per month, sponsored and unsponsored children
   - Simple charts, no personal data beyond counts. Printable layout
3. **Settings** at /dashboard/admin/settings
   - Foundation details (name, CAC number, bank name, account name, account number, contact email) stored in a small `site_settings` table (admin write, public read for non-secret fields) so the donate page and sponsor bank card read one source instead of environment variables
   - Admin list: show all admins, and an Invite admin action that creates an admin account only through a Server Action (never a public route)
4. **Orphaned photo cleanup:** an admin button and a scheduled job that deletes files under `beneficiary-photos/applications/` older than 7 days that have no matching application row
5. **Audit log viewer** at /dashboard/admin/audit: read-only list of `audit_log` rows, filterable by user, action and date. Make sure the important actions already write to it (approve, reject, activate, deactivate, flag message, pause match, vetting decisions, stage changes)

**ACCEPTANCE CRITERIA:**

- [ ] All three sidebar links open working pages with empty states
- [ ] CSV export contains only the filtered rows and is admin-only (test as non-admin)
- [ ] Reports show correct counts against known test data
- [ ] Changing a bank detail in Settings updates the donate page and the sponsor bank card
- [ ] A non-admin cannot reach or call any of these actions
- [ ] The audit log records the actions listed above

**DO NOT:** add a payment gateway; show donor contact details in reports; let the settings page change secrets or API keys.

---

## Ticket 5B — Security & Privacy Audit

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Security Agent. This platform holds children's personal data, so treat every finding as launch-blocking until fixed or accepted in writing.

**DELIVERABLES:**

1. **Row-level security audit.** Write `supabase/tests/rls_audit.sql` (or a script) that, for every table and view, tests as each role (anon, member, sponsor, mentor, beneficiary A, beneficiary B, admin) that:
   - anon reads nothing except `public_beneficiaries`, published stories, published projects, and the funding-safe views
   - no role other than admin and the child's own account can read a full beneficiary row
   - no user can change their own role, status, member type, trustee role or committee
   - no user can read another user's notifications, messages or concerns
   - Print a pass or fail table. Fix every failure with a new migration
2. **Storage audit.** Test every bucket the same way: who can list, read, upload, overwrite and delete. Confirm no private bucket is public and no signed URL lives longer than one hour
3. **Server Action audit.** For every Server Action, confirm it checks the caller's identity and role on the server, validates with Zod, and never trusts an id or role from the client. Report a table: action, check present, fixed
4. **Secrets audit.** Search the repo and git history for keys, tokens and passwords. Confirm `.env*` is ignored, no `NEXT_PUBLIC_` variable holds a secret, and the service-role key is imported only by server code. List anything that needs rotating
5. **Headers and abuse protection.** Add security headers in next.config (Content-Security-Policy that allows only what the site uses, X-Frame-Options or frame-ancestors, Referrer-Policy, Permissions-Policy, X-Content-Type-Options). Add rate limits to login, signup, forgot-password, contact and donate-receipt forms
6. **Admin protection.** Support two-factor authentication for admin accounts (Supabase MFA, TOTP) and require it before any /dashboard/admin page. Recommend at least two admin accounts so access is not tied to one person
7. **Open-redirect, XSS and injection check.** Confirm every redirect uses same-site paths only, no user text is rendered as HTML, and every query is parameterised
8. **Data protection pack.** Produce `docs/DATA_PROTECTION.md`: what personal data is collected, why, where it is stored, who can see it, retention periods, how a deletion or access request is handled, and the list of outside services that receive data (Supabase, Vercel, Resend, the AI provider). Add an admin tool to export or delete one beneficiary's data on request, with an audit log entry
9. **AI provider check.** Confirm the career quiz sends no identifiers, uses a paid tier whose terms state that customer data is not used for training, and has a clear note in the privacy page

**ACCEPTANCE CRITERIA:**

- [ ] The RLS audit passes for every role and table
- [ ] The audit report lists every Server Action with its checks
- [ ] No secret in the repo or its history, or a rotation list is given
- [ ] Security headers are present (check with a header-scanning tool) and the site still works
- [ ] An admin cannot reach admin pages without completing 2FA
- [ ] A single beneficiary's data can be exported and deleted from the admin

**DO NOT:** weaken any existing policy to make a test pass; disable a header because it breaks something without fixing the cause; store 2FA secrets yourself.

**NOTE FOR SIMON:** have your legal trustee review `docs/DATA_PROTECTION.md` and the privacy, terms and child-protection pages. Ask her whether the foundation must register with Nigeria's data protection regulator under the Nigeria Data Protection Act 2023.

---

## Ticket 5C — Performance, Errors & Email

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a Full-Stack Agent making the platform fast, resilient and able to email real people.

**DELIVERABLES:**

1. **Error handling.** Add `error.tsx` and `loading.tsx` at every route group and dashboard, a friendly `not-found.tsx`, and a global error boundary. Errors show a kind message and a retry, never a stack trace. Log the real error on the server
2. **Performance.**
   - Lighthouse targets: 85+ mobile and 95+ desktop on the landing page, Performance and Accessibility both
   - Use next/image everywhere with sizes, lazy loading and modern formats. Remove unused packages. Check bundle size per route and split heavy client components
   - Add indexes for the queries the dashboards run (foreign keys, status columns, created_at). Provide them as a new migration. Check slow queries with EXPLAIN
   - Cache public, non-personal data (landing page stats, published stories) with revalidation. Never cache a signed-in user's data
3. **Email.**
   - Use Resend with the verified foundation domain once it exists. Send from one address (for example no-reply at the domain), with SPF, DKIM and DMARC checked
   - Configure Supabase custom SMTP to use Resend, so confirmation and reset emails reach real users and the built-in sender limits no longer apply
   - Rewrite every email template (confirm signup, reset password, approval, rejection, receipt, new message notice, mentor request) with the TACE branding, plain language and a plain-text version. Messages never include a child's surname or health details
   - Provide an email preview page for admins (dev only) to check every template
4. **Monitoring hooks.** Add error tracking (Sentry or an equivalent) with personal data scrubbing: no names, emails or message text in error reports. Add a `/api/health` route that checks the database and returns ok or fail with no sensitive details
5. **Data integrity.** Add database constraints that match the app rules (for example one active match per child, valid stage values, non-negative amounts) in a new migration, after checking existing data satisfies them

**ACCEPTANCE CRITERIA:**

- [ ] Lighthouse report attached for the landing page meeting the targets, or a written list of what blocks it
- [ ] Forcing an error on a dashboard shows the friendly message, and the real error is logged
- [ ] A real signup confirmation and a password reset reach an external inbox from the custom domain
- [ ] Every email template renders correctly in a mail client and has a plain-text version
- [ ] Error reports contain no personal data (inspect one)
- [ ] /api/health returns ok, and fails cleanly when the database is unreachable

**DO NOT:** cache anything personal; send marketing email; put secrets in email links beyond the one-time tokens Supabase generates.

---

## Ticket 5D — Accessibility, Mobile & Automated Tests

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a QA Agent. Many users will be on low-end phones and slow connections, some with limited reading ability, so test for them.

**DELIVERABLES:**

1. **Accessibility pass (WCAG 2.1 AA).** Run automated checks (axe) on every public page and every dashboard page, then fix: colour contrast, labels on every input, visible focus, keyboard-only navigation, correct heading order, alt text, live-region announcements for form errors and new chat messages, touch targets of at least 44px
2. **Mobile pass.** Test at 360px, 375px and 768px for every page. No horizontal scroll, readable text, usable menus and forms. Test the apply form and the chat on a throttled slow-3G profile
3. **End-to-end tests (Playwright).** Write and commit tests that run against a test database and cover each role's full journey:
   - Visitor: submits /apply as guardian, as a child, and as an organisation
   - Admin: reviews and approves, rejects and flags; photo moves; logs a donation and sends a receipt; clears a mentor; matches mentor and child; publishes a project and a story
   - Guardian (beneficiary): first login through the emailed link, dashboard, journey, thank-you message, career quiz, mentor consent
   - Sponsor: signup, activation, dashboard shows only their child and gifts
   - Mentor: signup, vetting, code of conduct, consent, notes, check-in, concern
   - Messaging: two browser contexts, live delivery, blocked contact details, pause stops sending, 31st message refused
   - Member: signup, activation, update submitted twice edits the first, RSVP
4. **Security regression tests.** Automate the RLS audit from 5B in CI so every future migration is checked
5. **CI.** A GitHub Actions workflow that runs typecheck, lint, build, the RLS audit and the Playwright suite on every push, and blocks merging on failure

**ACCEPTANCE CRITERIA:**

- [ ] Zero axe violations of serious or critical level on all pages
- [ ] All Playwright journeys pass on a clean test database
- [ ] A failing test blocks the merge in CI
- [ ] The apply form completes on throttled slow-3G without losing data
- [ ] A short written report lists what was fixed and anything accepted

**DO NOT:** run tests against the live database; use real children's data in tests; delete a failing test to make CI pass.

---

## Ticket 5E — Go Live

**Copy everything below this line and paste into your agent.**

**ROLE:** You are a DevOps Agent preparing and checking the launch. Where a step needs Simon's accounts (domain registrar, Supabase, Vercel, Google), give exact click-by-click instructions and wait for confirmation.

**DELIVERABLES:**

1. **Separate production from testing.** All development so far used one Supabase project. Create a separate production project, run migrations 001 to the latest in order, and verify with the RLS audit. Never carry over test data. If production must reuse the current project, write and run a clean-up script that deletes every test account (the `osimesimon+...` addresses and any account with a known test password), test beneficiaries, test applications, donations, messages, stories and files, and confirm with counts
2. **Domain.** Buy and connect tacefoundation.org (steps for the registrar, Vercel domain settings and DNS), force HTTPS, redirect the vercel.app address and www to one canonical address, set `NEXT_PUBLIC_SITE_URL` to it
3. **Production configuration checklist.**
   - Supabase Auth: Site URL, redirect URLs (callback and confirm) for the live domain only, email confirmation on, custom SMTP on, password rules, Google provider with the live domain, sign-ups limited to the allowed roles
   - Vercel: production environment variables set (and listed by name only), preview environments pointed at the test project, never at production data
   - Google OAuth: live domain added, consent screen published
   - Resend: domain verified
4. **Admin accounts.** Create the real admin accounts with 2FA on (at least two, one a second trustee). Remove any test admin
5. **Monitoring.** Error tracking live with an alert to the foundation's email, an uptime check on /api/health, and a weekly digest of open safeguarding concerns and flagged messages sent to the admins
6. **Backups.** Confirm what backups the Supabase plan provides and that the production project is on a plan that does not pause. Set up a scheduled export of the database and the storage buckets to a location the foundation controls, and run one restore test into an empty project. Write `docs/RUNBOOK.md`: how to restore, how to rotate keys, how to deactivate an account, how to pause every match in an emergency, who to call
7. **Launch checklist** in `docs/LAUNCH_CHECKLIST.md`, each item with owner and tick box: legal pages reviewed by the legal trustee, real bank details in Settings, real content (about, programmes, trustee names only with their consent), real photos with consent, privacy notices live, a test application end to end on production, a rollback plan, a support email that someone reads
8. **Soft launch plan.** Start with invited users only: one sponsor, one mentor, a handful of families. Admin reviews every application and every flagged message daily for the first two weeks

**ACCEPTANCE CRITERIA:**

- [ ] The live site loads on the real domain over HTTPS, and no old address stays reachable without redirecting
- [ ] Production contains no test accounts or test data (show the counts)
- [ ] A real signup, a password reset and an approval email reach an outside inbox
- [ ] A restore test succeeds from a backup into an empty project
- [ ] An alert arrives when the health check is made to fail
- [ ] Every item in the launch checklist is ticked or has a written reason
- [ ] Both admin accounts need 2FA

**DO NOT:** launch with test data or test passwords present; point previews at production; share an admin account between people; skip the restore test.

---

## Definition of Done — Phase 5

All five roles complete their full journey on the live domain without errors. The security audit and automated tests pass in CI. Lighthouse and accessibility targets are met. Real emails reach real inboxes. Backups are tested. The production database holds only real data, and the legal trustee has signed off the privacy and child-protection pages.