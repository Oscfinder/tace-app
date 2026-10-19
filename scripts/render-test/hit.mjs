// Usage: node hit.mjs <scenario> <path> [<path> ...]
// Signs in (via a session cookie the fake Supabase accepts) and fetches pages.
const [scenario, ...paths] = process.argv.slice(2);

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "u", role: "authenticated", scn: scenario, exp, ...(process.env.AAL ? { aal: process.env.AAL } : {}) })}.sig`;
const session = {
  access_token: jwt,
  refresh_token: "r",
  token_type: "bearer",
  expires_in: 86400,
  expires_at: exp,
  user: { id: "u", aud: "authenticated", role: "authenticated", email: "t@t.dev" },
};
// @supabase/ssr names the cookie sb-<first label of the project host>-auth-token.
const cookie = `sb-localhost-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;

let bad = 0;
for (const p of paths) {
  const res = await fetch(`http://localhost:3123${p}`, { headers: { cookie }, redirect: "manual" });
  const body = await res.text();
  const loc = res.headers.get("location");
  const errored = /Application error|server-side exception|Functions cannot be passed|Internal Server Error/i.test(body) || res.status >= 500;
  const title = (body.match(/<h1[^>]*>(.*?)<\/h1>/s)?.[1] ?? "").replace(/<[^>]+>/g, "").trim().slice(0, 60);
  console.log(`${errored ? "FAIL" : res.status >= 300 && res.status < 400 ? "REDIR" : "OK  "} ${res.status} ${p}${loc ? " -> " + loc : ""}${title ? `   h1: "${title}"` : ""}`);
  if (errored) bad++;
}
process.exit(bad ? 1 : 0);
