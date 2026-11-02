# TACE Platform: Launch Checklist

Ticket 5E (Go Live) completes this list: each item gets an owner and a tick box. Items below were added earlier because they must not be forgotten. **Nothing is ticked until it has been checked on the live site.**

## Required before launch

- [ ] **Turn on `ADMIN_MFA_REQUIRED=true` (Vercel, Production) and confirm both admins have enrolled.** Admin two-factor sign-in is built but switched OFF for now, which is an accepted risk until launch (a stolen admin password gives full admin access). Steps: enable MFA/TOTP in the Supabase project; each admin opens Admin, Settings, "Set up or check my two-factor sign-in" and enrols an authenticator app; check each admin can sign in with the code; then set the variable to exactly `true` and redeploy; then confirm an admin without a code is sent to the setup screen. Keep at least two admins so a lost phone is recoverable (another admin can use Settings, Reset 2FA). Owner: Simon.

## Domain, email and auth (Nov 2, 2026; reported by Simon, not re-checked by the agent)

- [x] Domain `tacefoundation.org` bought and added to Vercel (shows valid). Owner: Simon
- [x] `NEXT_PUBLIC_SITE_URL` = `https://www.tacefoundation.org` in Vercel, redeployed (canonical address is **www**; the bare domain redirects to it, intended)
- [x] Supabase Site URL (`https://www.tacefoundation.org`) and redirect URLs (`/auth/callback`, `/auth/confirm`) set
- [x] Resend domain verified (DKIM, SPF)
- [x] `EMAIL_FROM` set in Vercel
- [x] Supabase custom SMTP on (Resend) and the two auth email templates pasted
- [x] Live signup confirmation email arrives and works; forgot-password works end to end
- [x] One canonical address: `https://www.tacefoundation.org`, configured in Vercel (Settings, Domains), not in the app. The bare domain redirects to it by design. Settled by Simon; not re-checked by the agent. Owner: Simon
- [ ] Confirm HTTPS is forced and no old address stays reachable without redirecting
- [ ] DMARC record (`_dmarc` TXT) added and SPF/DKIM/DMARC checked as "pass" in a received message
- [ ] Approval email and donation receipt tested on the live site
- [ ] Google sign-in: add the live domain to the Google OAuth origins and redirect URL, publish the consent screen (skipped for now)
- [ ] Run migration 017 (and confirm 013 to 016) in Supabase

## To be completed in Ticket 5E

(See `docs/PHASE_5.md`, Ticket 5E, deliverable 7: legal pages reviewed by the legal trustee, real bank details in Settings, real content and photos with consent, privacy notices live, a test application end to end on production, a rollback plan, a support email that someone reads. Also: `IP_HASH_SALT` and `CRON_SECRET` set in Vercel and the cPanel cron jobs created; production Supabase project separate from testing; the exposed GitHub token and any pasted API keys rotated; a paid Gemini plan whose terms say data is not used for training; `docs/DATA_PROTECTION.md` reviewed by the legal trustee.)

## Added with the 5E code (Nov 2, 2026)

- [ ] `CRON_SECRET` set in Vercel (both cron routes refuse to run without it), and **cPanel cron jobs created and tested** per `docs/CRON_SETUP.md` (daily photo clean-up, Monday digest; check each shows its `[cron] ... ok` line in the Vercel logs). Owner: Simon
- [ ] Test data removed: new production project, or `supabase/scripts/clear_test_data.sql` run and Storage buckets emptied; counts shown. Owner: Simon
- [ ] Restore test done and logged in `docs/RUNBOOK.md`; Supabase plan does not pause. Owner: Simon
- [ ] Uptime monitor on `/api/health` with an alert, tested by making it fail. Owner: Simon
- [ ] Sentry live with an email alert. Owner: Simon
- [ ] Who-to-call table in `docs/RUNBOOK.md` filled in and a printed copy kept. Owner: trustees
- [ ] Legal trustee signs off `/privacy`, `/terms`, `/child-protection-policy` and `docs/DATA_PROTECTION.md`; then remove the `DraftNotice` lines from the three pages. Owner: legal trustee
- [ ] Name the safeguarding lead on the child protection page, and choose retention periods (DATA_PROTECTION.md section 5) so the privacy page can state them. Owner: trustees
- [ ] Real About content (founding story, trustees' names only with their consent) and real programme details checked by the programme lead. Owner: trustees
- [ ] Send one test message through `/contact` on the live site and confirm it reaches the contact inbox and that Reply goes to the sender. Owner: Simon
