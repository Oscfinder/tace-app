# Scheduled jobs (cPanel cron)

The website has two jobs that must run on a schedule. They run from **cPanel, Advanced, Cron Jobs**, which calls a web address on the site at the set time. (Vercel Cron is not used; `vercel.json` was removed so the jobs are never run twice.)

## How the jobs are protected

Each job is a web address under `/api/cron/`. Anyone who knows the address could try it, so it answers only when the request carries the secret in a header:

```
Authorization: Bearer <CRON_SECRET>
```

Anything else (no header, wrong secret, the secret put in the web address, a missing `CRON_SECRET` on the server) gets **401 Unauthorised** and does nothing. **The secret is never accepted in the web address**, because web addresses are written into logs.

| Job | Path | Method | What it does |
|---|---|---|---|
| Photo clean-up | `/api/cron/cleanup-photos` | GET | Deletes photos that applicants uploaded more than 7 days ago but never finished an application for. Never touches a photo whose application exists |
| Weekly digest | `/api/cron/weekly-digest` | GET | Emails each active admin three numbers: open safeguarding concerns, flagged messages, applications waiting. Numbers only, no names or message text |

The secret is the value of `CRON_SECRET` in Vercel (Project, Settings, Environment Variables). **The same value must be pasted into both cPanel commands.** Never write the real secret in the repository, in this document, in chat or in an email.

## Create the two jobs in cPanel

1. Sign in to cPanel and open **Advanced, Cron Jobs**.
2. Under **Cron Email**, you may enter an address to be told when a job prints something. The commands below print nothing, so leave it empty.
3. Under **Add New Cron Job**, choose **Common Settings: Once Per Day** or set the five boxes by hand as below, paste the command, replace `YOUR_CRON_SECRET` with the real value, and press **Add New Cron Job**.

### Photo clean-up: every day at 03:00

Boxes: Minute `0`, Hour `3`, Day `*`, Month `*`, Weekday `*`

```
curl -s -f -m 60 -H "Authorization: Bearer YOUR_CRON_SECRET" "https://www.tacefoundation.org/api/cron/cleanup-photos" > /dev/null 2>&1
```

### Weekly digest: Mondays at 07:00

Boxes: Minute `0`, Hour `7`, Day `*`, Month `*`, Weekday `1` (Monday)

```
curl -s -f -m 60 -H "Authorization: Bearer YOUR_CRON_SECRET" "https://www.tacefoundation.org/api/cron/weekly-digest" > /dev/null 2>&1
```

**Time zone.** cPanel runs jobs in **the server's time zone**, which is often UTC and not Lagos time. Lagos is one hour ahead of UTC, so on a UTC server "03:00" is 04:00 in Lagos and "07:00" is 08:00. Find the server's zone in cPanel (the **Server Information** panel, or the date shown on the Cron Jobs page) and change the hour if you want a different local time.

**About the address.** The commands use `https://www.tacefoundation.org`, the address the site is served from. `curl` here does not follow redirects, so a different address (for example one that redirects) would fail. If the main address ever changes, change both commands.

## Test once (do this before relying on them)

Run this from the cPanel **Terminal** (or any computer with `curl`), with the real secret. It prints the HTTP status. **Test the photo clean-up, not the digest**: the digest sends real emails to the admins.

```
curl -s -m 60 -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer YOUR_CRON_SECRET" "https://www.tacefoundation.org/api/cron/cleanup-photos"
```

- `200`: it worked.
- `401`: the secret does not match the one in Vercel (check for spaces or a missing character), or `CRON_SECRET` is not set in Vercel, or Vercel was not redeployed after you set it.
- `500`: the job started but failed. Look at the Vercel logs.
- Nothing or a timeout: the address is wrong or the site is down.

A wrong-secret test should print `401` (this is the safe check to show the protection works):

```
curl -s -m 60 -o /dev/null -w "%{http_code}\n" -H "Authorization: Bearer wrong" "https://www.tacefoundation.org/api/cron/cleanup-photos"
```

## Check that cPanel really calls it

Each run writes one line to the **Vercel logs** (Project, Logs, search for `[cron]`). It has the job name, the time and counts, and no personal data:

```
[cron] cleanup-photos ok { at: '2026-11-03T03:00:01.234Z', scanned: 12, deleted: 0 }
[cron] weekly-digest ok { at: '2026-11-09T07:00:00.456Z', openConcerns: 0, flaggedMessages: 0, pendingApplications: 3, sent: 2 }
```

A refused call writes `[cron] <job> refused: missing or wrong secret`, and a failure writes `[cron] <job> failed` with the error text. **No line at the expected time means cPanel did not call the site.**

## If you change the secret

1. Make a new long random string (at least 32 characters).
2. Set `CRON_SECRET` in Vercel and redeploy.
3. Edit both cron jobs in cPanel and paste the new value.
4. Run the test above.
