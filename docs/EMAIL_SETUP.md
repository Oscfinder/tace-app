# Email setup (Resend, Supabase, and the templates)

The platform sends two kinds of email:

1. **Emails the platform sends itself** (application received, approved, rejected, member and sponsor approvals, mentor emails, donation receipts, admin invitations, new-message notices, mentor requests). They go through **Resend**. The wording is in `lib/email/templates.ts`; every one has a plain-text version.
2. **Emails Supabase Auth sends** (confirm sign-up, reset password). They go through Supabase, which should be set to send via **Resend's SMTP** so they reach real inboxes and the built-in sending limits no longer apply.

Nothing below can be done by the code alone: it needs the foundation's domain and accounts. Do the steps in order and wait for each to show as verified.

## 1. Buy and keep the domain

You need the foundation's real domain (for example `tacefoundation.org`). All addresses below use that example; replace it with yours. Ticket 5E covers connecting the domain to the website.

## 2. Verify the domain in Resend

1. Sign in at resend.com, choose **Domains**, then **Add Domain**, and enter `tacefoundation.org`.
2. Resend shows DNS records to add at your domain registrar (the company you bought the domain from). They are:
   - **SPF**: a `TXT` record (usually on a `send` sub-domain) that lists Resend as allowed to send for you.
   - **DKIM**: a `TXT` (or `CNAME`) record named like `resend._domainkey` that lets receivers check the email was really signed by your domain.
   - (Resend may also ask for an `MX` record on the `send` sub-domain, for bounce handling.)
3. Add each record exactly as shown, then press **Verify** in Resend. DNS can take from a few minutes to a few hours.
4. **DMARC** (you add this yourself, once SPF and DKIM pass): add a `TXT` record named `_dmarc` with the value
   `v=DMARC1; p=none; rua=mailto:dmarc@tacefoundation.org`
   Start with `p=none` (only report). After a few weeks of clean reports, change it to `p=quarantine`, and later `p=reject`.
5. Check it: in Resend the domain must show **Verified**. Then send a test (section 5) to a Gmail address and a Yahoo/Outlook address, open the message, choose "Show original" / "View message source", and confirm it says `SPF: PASS`, `DKIM: PASS` and `DMARC: PASS`.

## 3. Tell the app which address to send from

In Vercel (Project, Settings, Environment Variables) set, for Production:

| Name | Example | Meaning |
|---|---|---|
| `RESEND_API_KEY` | (from Resend, API Keys) | Lets the app send. Keep it secret |
| `EMAIL_FROM` | `TACE Foundation <no-reply@tacefoundation.org>` | The one address every email comes from. Must be on the verified domain |
| `EMAIL_REPLY_TO` | `hello@tacefoundation.org` | Optional. If set, replies go there and the footer says "Reply to this email". If unset, the footer says "Please do not reply" |

Redeploy afterwards. Until `EMAIL_FROM` is set the app uses Resend's test address, which can only deliver to the Resend account owner's own email.

## 4. Make Supabase send through Resend (so sign-up and reset emails arrive)

1. In Resend, create a second API key (name it "Supabase SMTP") with permission to send.
2. In Supabase: **Authentication, Emails** (or **Project Settings, Auth**), then **SMTP Settings**, switch on **Enable custom SMTP**, and enter:
   - Sender email: `no-reply@tacefoundation.org` (same domain as above)
   - Sender name: `TACE Foundation`
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: the Resend API key you just made
3. Still in Supabase, open **Authentication, Email Templates** and replace the two templates with the ones in `docs/email-templates/`:
   - **Confirm signup**: subject from `confirm-signup.subject.txt`, body from `confirm-signup.html`
   - **Reset password**: subject from `reset-password.subject.txt`, body from `reset-password.html`
   These contain Supabase's own placeholders (`{{ .SiteURL }}`, `{{ .TokenHash }}`) and link to the site's `/auth/confirm` page. Do not edit those parts. Supabase only sends the HTML for these two; it has no field for a plain-text version.
4. In **Authentication, URL Configuration**, set **Site URL** to the live address (`https://www.tacefoundation.org`, the canonical one) and add `https://www.tacefoundation.org/auth/confirm` and `https://www.tacefoundation.org/auth/callback` to the redirect URLs. Turn **Confirm email** on.
5. If you ever change the two templates in the code, regenerate the files with `node scripts/generate-auth-email-templates.mjs` and paste them again.

## 5. Test it (do this before launch, and write down the results)

- Sign up with a real outside email address (not the foundation's own). The confirmation email must arrive in the inbox (not spam), come from `no-reply@tacefoundation.org`, and the button must land on the site.
- Use **Forgot password** with the same address; the email must arrive and the link must open the reset page.
- In Admin, approve a test application, log a test donation with an email and press **Send receipt**, and check both arrive.
- For each, look at the "original" message source for SPF, DKIM and DMARC pass.
- Open a message on a phone mail app and in a desktop one, with images switched off, to confirm it still reads well.

## 6. Previewing every template

When running the site on your own computer (`npm run dev`), sign in as an admin and open **/dashboard/admin/email-preview**. It shows all 15 emails in both HTML and plain text with sample data. The page does not exist on the live site.

## Rules the templates follow

- A child is only ever named by their **first name**; no surname, health, school or family details appear.
- A new-message email says that a message exists and who it is from, **never what it says**.
- No marketing, no tracking pixels. The only link secrets are the one-time tokens Supabase makes for sign-up and password links.
- Anything a person typed (a name, a reason) is escaped, so it cannot become a link or HTML in the email.
