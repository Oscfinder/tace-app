# TACE Platform: Launch Checklist

Ticket 5E (Go Live) completes this list: each item gets an owner and a tick box. Items below were added earlier because they must not be forgotten. **Nothing is ticked until it has been checked on the live site.**

## Required before launch

- [ ] **Turn on `ADMIN_MFA_REQUIRED=true` (Vercel, Production) and confirm both admins have enrolled.** Admin two-factor sign-in is built but switched OFF for now, which is an accepted risk until launch (a stolen admin password gives full admin access). Steps: enable MFA/TOTP in the Supabase project; each admin opens Admin, Settings, "Set up or check my two-factor sign-in" and enrols an authenticator app; check each admin can sign in with the code; then set the variable to exactly `true` and redeploy; then confirm an admin without a code is sent to the setup screen. Keep at least two admins so a lost phone is recoverable (another admin can use Settings, Reset 2FA). Owner: Simon.

## To be completed in Ticket 5E

(See `docs/PHASE_5.md`, Ticket 5E, deliverable 7: legal pages reviewed by the legal trustee, real bank details in Settings, real content and photos with consent, privacy notices live, a test application end to end on production, a rollback plan, a support email that someone reads. Also: `IP_HASH_SALT` and `CRON_SECRET` set in Vercel; production Supabase project separate from testing; the exposed GitHub token and any pasted API keys rotated; a paid Gemini plan whose terms say data is not used for training; `docs/DATA_PROTECTION.md` reviewed by the legal trustee.)
