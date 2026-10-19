// Usage: node has.mjs <scenario> <path> "text one" "text two" ...
// Fetches a page as a signed-in user and reports whether each text appears.
const [scenario, path, ...needles] = process.argv.slice(2);
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const exp = Math.floor(Date.now() / 1000) + 86400;
const jwt = `${b64({ alg: "HS256" })}.${b64({ sub: "u", role: "authenticated", scn: scenario, exp })}.sig`;
const session = { access_token: jwt, refresh_token: "r", token_type: "bearer", expires_in: 86400, expires_at: exp, user: { id: "u", aud: "authenticated", role: "authenticated", email: "t@t.dev" } };
const cookie = `sb-localhost-auth-token=base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`;
const res = await fetch(`http://localhost:3123${path}`, { headers: { cookie }, redirect: "manual" });
const html = (await res.text()).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");
console.log(`${res.status} ${path}`);
let missing = 0;
for (const n of needles) {
  const found = html.includes(n);
  if (!found) missing++;
  console.log(`  ${found ? "found  " : "MISSING"} "${n}"`);
}
process.exitCode = missing ? 1 : 0;
setTimeout(() => process.exit(process.exitCode), 50);
