# Local render-test tools (no real Supabase needed)

Small scripts used while building Phase 4 and 5 to see pages render and to catch browser errors.

1. `node scripts/render-test/mock.mjs` starts a fake Supabase on port 54399 (returns fixed data per scenario: `admin`, `sponsor`, `mentor`, ...; it ignores most filters).
2. Build and start the app against it: `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 npx next build` then `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54399 npx next start -p 3123`.
3. `node scripts/render-test/hit.mjs <scenario> <path> ...` prints status and the page heading. Set `AAL=aal2` to act as an admin who has passed two-factor (without it, admin pages redirect to /admin-2fa).
4. `node scripts/render-test/has.mjs <scenario> <path> "text" ...` checks text appears on a page.
5. `node scripts/render-test/csv.mjs <scenario|none> <path>` fetches a route and prints the body (used for the CSV export).
6. `node scripts/render-test/cdp.mjs <url> [cookie-json]` opens a page in headless Microsoft Edge over the DevTools protocol and prints Content-Security-Policy violations, console errors and whether React hydrated. Edge path is hard-coded at the top; change it if yours differs. The cookie JSON format is shown in how hit.mjs builds its session cookie.

In git-bash on Windows, set `MSYS_NO_PATHCONV=1` or paths starting with `/` get rewritten.
These are developer tools only; nothing here ships to the site.
