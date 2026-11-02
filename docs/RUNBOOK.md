# TACE Platform: Runbook

What to do when something goes wrong, written so a trustee who is not a developer can follow it. Where a step needs a name or number, fill in the **Who to call** table at the bottom first, and keep a printed copy somewhere safe.

## 1. The site is down or showing errors

1. Open `https://tacefoundation.org/api/health`. `{"status":"ok"}` means the website and database are answering. `{"status":"fail"}` or no answer means they are not.
2. Check the status pages: status.vercel.com (website) and status.supabase.com (database). If one is down, wait; nothing on our side will fix it.
3. If both are fine, open Vercel, the project, **Logs**, and read the newest red lines. Each error screen shows a short reference code; search the logs for it.
4. If the problem began right after a change, **roll back**: Vercel, project, **Deployments**, find the last good deployment, **...**, **Promote to Production**. This takes about a minute and does not touch the database.

## 2. Pause every mentoring match in an emergency

Use this if there is a safeguarding emergency and all adult-to-child messaging must stop at once.

- **Fastest (no code):** Supabase, **SQL Editor**, run:
  ```sql
  update public.mentorship_matches
  set status = 'paused'
  where status = 'active';
  ```
  A paused match blocks messaging at the database. Tell the admins; write down the time and the reason.
- **To restart one match later:** Admin, **Mentors**, open the match, **Resume**. Only resume matches the safeguarding lead has cleared.
- Matches still waiting for family consent (`pending_consent`) cannot message, so they need no pausing.

## 3. Deactivate or suspend one account

1. Admin, **Members** (or **Mentors**, **Sponsors**, **Beneficiaries**), open the person, set the status to **Suspended**.
2. A suspended account loses all access immediately (the database checks the status on every request). It does not delete anything.
3. To remove their sign-in completely, Supabase, **Authentication**, **Users**, find them, **...**, **Delete user**. Do this only after the Data Protection steps in `docs/DATA_PROTECTION.md` if the person asked for deletion.

## 4. Lost admin phone (two-factor)

Another admin opens Admin, **Settings**, **Reset 2FA** for the person; they then enrol again. Keep at least two admins so this is always possible. If both are locked out, a developer can remove the factor in Supabase, **Authentication**, **Users**, the user, **Remove MFA factors**, or temporarily set `ADMIN_MFA_REQUIRED` to anything other than `true` in Vercel and redeploy (then set it back).

## 5. Rotate keys (do this at once if a key was shown to someone it should not have been, and every 6 months otherwise)

After changing any value in Vercel, **redeploy** (Deployments, latest, **Redeploy**) so it takes effect. List names only; never paste a value into chat, email or a document.

| Key | Where to make a new one | Then |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase, **Project Settings**, **API Keys**, roll the secret key | update Vercel, redeploy |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page, publishable key | update Vercel, redeploy |
| `RESEND_API_KEY` | Resend, **API Keys**, create, then delete the old one | update Vercel; also Supabase, **Authentication**, **SMTP**, password (a separate key is recommended) |
| `GEMINI_API_KEY` | Google AI Studio / Cloud, create new, delete old | update Vercel |
| `CRON_SECRET` | any new long random string (at least 32 characters) | update Vercel, redeploy |
| `IP_HASH_SALT` | any new long random string | update Vercel. Rate-limit history resets; that is fine |
| `SENTRY_DSN` | Sentry, project settings, client keys | update Vercel |
| GitHub access token | GitHub, Settings, Developer settings, tokens: revoke, create new | update wherever it is used |

If the **service-role key** leaked, treat it as a data breach: rotate it first, then check the audit log (Admin, **Audit**) and Supabase logs for activity you do not recognise, and follow `docs/DATA_PROTECTION.md` on telling the regulator (NDPC) within 72 hours if personal data may have been seen.

## 6. Backups and restore

**What exists.** Supabase keeps automatic daily backups on paid plans (7 days on Pro). The free plan has none and also **pauses after a week of no use**, so production must be on a paid plan. Confirm the plan in Supabase, **Organization**, **Billing**. Photos and documents in Storage are **not** part of the database backup.

**Our own copy (weekly, to a place the foundation controls).** Until this is automated, an admin does it every Friday and on the day before any risky change:
1. Supabase, **Database**, **Backups**, download the latest backup (or run `supabase db dump` with the Supabase CLI against the production project).
2. Storage: for each bucket, download the files (dashboard) or use the CLI.
3. Save both in the foundation's own cloud drive, in a folder only the trustees can open. Note the date in the log below.

**Restore test (must be done once before launch, and after any big change).**
1. Create an empty Supabase project named `tace-restore-test`.
2. In its SQL editor, run migrations `001` to `017` in order from `supabase/migrations/`, then restore the data from the downloaded backup (`psql` with the project's connection string, or Supabase, **Database**, **Backups**, **Restore** on a paid plan).
3. Count to check: run `select count(*) from public.profiles;` and the same for `applications`, `beneficiaries`, `donations` in both projects. The numbers must match.
4. Point a preview deployment at the test project and sign in as an admin.
5. Delete the test project afterwards. Write the date and result in the log below.

**Restoring after real data loss.** Do not restore over live data without a second person agreeing. Supabase, **Database**, **Backups**, choose the time before the damage. Anything entered after that time is lost, so tell the admins what to re-enter.

## 7. Before launch only: clear test data

If production is the same Supabase project used for testing, run `supabase/scripts/clear_test_data.sql` (read its header; it dry-runs first), then empty the Storage buckets by hand. A fresh production project needs none of this.

## 8. Monitoring in place

- **Errors:** Sentry (set `SENTRY_DSN`), with an alert rule emailing the foundation's address on any new error.
- **Uptime:** an external monitor (for example UptimeRobot, free) checking `https://tacefoundation.org/api/health` every 5 minutes and emailing on failure. To test it, temporarily make the check fail (point the monitor at a wrong keyword) and confirm the email arrives.
- **Weekly digest:** every Monday 07:00 UTC the admins get an email with counts of open safeguarding concerns, flagged messages and waiting applications (cron `/api/cron/weekly-digest`, needs `CRON_SECRET`).
- **Daily:** orphaned application photos are cleaned up at 03:00 UTC.

## Who to call

| Need | Name | Phone | Email |
|---|---|---|---|
| Safeguarding lead | | | |
| Second administrator | | | |
| Legal trustee | | | |
| Developer / technical contact | | | |
| Domain registrar login holder | | | |

## Logs

| Date | What | Result | By |
|---|---|---|---|
| | Restore test | | |
| | Weekly offline backup | | |
