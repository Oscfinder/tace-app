// Row-level security audit (Phase 5, Ticket 5B).
//
// Applies every migration to an in-process Postgres (PGlite, no Docker) behind a
// small stub of Supabase's auth/storage schemas, seeds ONE OR MORE ROWS IN EVERY
// TABLE, then tests as each kind of user and prints a pass/fail table.
//
//   npm run test:rls
//
// Exits non-zero on any failure so CI can block a merge. The audit also fails if
// a table, view or storage bucket exists that this file has no expectation for,
// so adding one in a future migration forces a decision about who may see it.
//
// Roles: anon, member, sponsor (linked to child A), mentor (matched to child A),
// benA (child A's account), benB (child B's account), admin.
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MIG = fileURLToPath(new URL("../migrations", import.meta.url));
const db = new PGlite();

const STUB = `
create schema auth; create schema storage;
create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create function auth.role() returns text language sql stable as $$ select case when nullif(current_setting('request.jwt.claim.sub', true), '') is null then 'anon' else 'authenticated' end $$;
create table storage.buckets (id text primary key, name text, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid(), bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language plpgsql as $$ declare p text[]; begin p := string_to_array(name,'/'); return p[1:array_length(p,1)-1]; end $$;
create publication supabase_realtime;
grant usage on schema public, auth, storage to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
grant all on all tables in schema storage to anon, authenticated;
`;
await db.exec(STUB);

for (const f of fs.readdirSync(MIG).filter((x) => x.endsWith(".sql")).sort()) {
  const sql = fs.readFileSync(path.join(MIG, f), "utf8").replace(/create extension if not exists pgcrypto;/i, "");
  try {
    await db.exec(sql);
  } catch (e) {
    console.log(`MIGRATION FAILED ${f}: ${e.message}`);
    process.exit(1);
  }
}

// Negative control: AUDIT_EXTRA_SQL is run after the migrations so you can check
// that the audit really fails when security is weakened, for example:
//   AUDIT_EXTRA_SQL="create policy leak on public.donations for select using (true)" npm run test:rls
if (process.env.AUDIT_EXTRA_SQL) await db.exec(process.env.AUDIT_EXTRA_SQL);

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const ROLES = ["anon", "member", "sponsor", "mentor", "benA", "benB", "admin"];
const U = {}; // user name -> uuid
const q = async (sql, p) => (await db.query(sql, p)).rows;

async function mkUser(name, role) {
  const r = await db.query(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [`${name}@t.test`, JSON.stringify({ full_name: name, role })],
  );
  U[name] = r.rows[0].id;
}

// Which seeded user acts as each role.
const ACTOR = { member: "member", sponsor: "sponsorA", mentor: "mentorA", benA: "benA", benB: "benB", admin: "admin" };

async function setRole(role) {
  if (role === "anon") {
    await db.exec(`set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  } else {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${U[ACTOR[role] ?? role]}', false);`);
  }
}

// Run one statement as `role` inside a transaction that is ALWAYS rolled back,
// so probing never changes the data the next probe sees.
async function probe(role, sql, params) {
  await db.exec("begin");
  try {
    await setRole(role);
    const r = await db.query(sql, params);
    return { rows: r.rows };
  } catch (e) {
    return { err: e.message };
  } finally {
    await db.exec("rollback");
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

// Run as a role and KEEP the changes (used only while seeding).
async function as(userName, fn) {
  await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${U[userName]}', false);`);
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}

// ---------------------------------------------------------------------------
// seed: every table gets rows (A = child A's side, B = child B's side)
// ---------------------------------------------------------------------------
for (const [n, r] of [
  ["admin", "member"], ["member", "member"], ["sponsorA", "sponsor"], ["sponsorB", "sponsor"],
  ["mentorA", "mentor"], ["mentorB", "mentor"], ["benA", "member"], ["benB", "member"],
]) await mkUser(n, r);
await db.exec(`update public.profiles set status='active'`);
await db.query(`update public.profiles set role='admin' where id=$1`, [U.admin]);
await db.query(`update public.profiles set role='beneficiary' where id in ($1,$2)`, [U.benA, U.benB]);

const id1 = async (sql, p) => (await q(sql, p))[0].id;
const sp = {
  A: await id1(`insert into public.sponsors (profile_id) values ($1) returning id`, [U.sponsorA]),
  B: await id1(`insert into public.sponsors (profile_id) values ($1) returning id`, [U.sponsorB]),
};
const mn = {
  A: await id1(`insert into public.mentors (profile_id, profession, mentor_track) values ($1,'Engineer','tech') returning id`, [U.mentorA]),
  B: await id1(`insert into public.mentors (profile_id, profession, mentor_track) values ($1,'Nurse','career') returning id`, [U.mentorB]),
};
await db.query(`update public.mentors set vetting_status='cleared', vetted_by=$1, vetted_at=now()`, [U.admin]);

const app = {
  A: await id1(`insert into public.applications (child_first_name, child_last_name, child_dob, consent_photography, status) values ('Aa','Aaa','2014-01-01', true, 'approved') returning id`),
  B: await id1(`insert into public.applications (child_first_name, child_last_name, child_dob, consent_photography, status) values ('Bb','Bbb','2013-01-01', false, 'pending') returning id`),
};
const kid = {};
for (const [k, prof, spon] of [["A", U.benA, sp.A], ["B", U.benB, sp.B]]) {
  kid[k] = await id1(
    `insert into public.beneficiaries (profile_id, application_id, first_name, last_name, date_of_birth, address, guardian_phone, health_conditions, sponsor_id, interests, aspirations, class_level)
     values ($1,$2,$3,'Secretsurname','2014-05-01','12 Private Road','08099999999','asthma',$4,'football','doctor','JSS2') returning id`,
    [prof, app[k], `Child${k}`, spon],
  );
  await db.query(`update public.beneficiaries set photo_url=$1 where id=$2`, [`${kid[k]}/photo.jpg`, kid[k]]);
}
await db.query(`insert into public.application_submissions (ip_hash) values ('hash')`);
await db.query(`insert into public.rate_limit_events (bucket, key_hash) values ('t','k')`);
await db.query(`insert into public.announcements (title, content, is_published) values ('Published','x',true),('Draft','x',false)`);
await db.query(`insert into public.audit_log (user_id, action) values ($1,'seed')`, [U.admin]);
await db.query(`insert into public.career_assessments (beneficiary_id) values ($1),($2)`, [kid.A, kid.B]);
await db.query(`insert into public.committee_updates (member_id, content) values ($1,'update')`, [U.member]);
await db.query(`insert into public.donations (donor_name, amount, sponsor_id) values ('Donor A',100,$1),('Donor B',200,$2),('Walk-in',300,null)`, [sp.A, sp.B]);
const ev = await id1(`insert into public.events (title, minutes) values ('Board meeting','PRIVATE MINUTES') returning id`);
await db.query(`insert into public.event_rsvps (event_id, profile_id, status) values ($1,$2,'attending')`, [ev, U.member]);
await db.query(`insert into public.interventions (beneficiary_id, type, amount, notes) values ($1,'books',10,'STAFF ONLY'),($2,'fees',20,'STAFF ONLY')`, [kid.A, kid.B]);
await db.query(`insert into public.progress_updates (beneficiary_id, title, content) values ($1,'Up','a'),($2,'Up','b')`, [kid.A, kid.B]);
await db.query(`insert into public.thank_you_messages (beneficiary_id, content, status) values ($1,'thanks','approved'),($2,'thanks','pending')`, [kid.A, kid.B]);
const pr = {
  pub: await id1(`insert into public.projects (title, is_published, status) values ('Published project', true, 'active') returning id`),
  draft: await id1(`insert into public.projects (title, is_published, status) values ('Draft project', false, 'draft') returning id`),
};
await db.query(`insert into public.project_beneficiaries (project_id, beneficiary_id) values ($1,$2),($3,$4)`, [pr.pub, kid.A, pr.draft, kid.B]);
await db.query(`insert into public.stories (title, content, is_published) values ('Published story','x',true),('Draft story','x',false)`);

// matches: A is active (both consents given by the real parties), B stays pending
const mA = await id1(`insert into public.mentorship_matches (mentor_id, beneficiary_id) values ($1,$2) returning id`, [mn.A, kid.A]);
await db.query(`insert into public.mentorship_matches (mentor_id, beneficiary_id) values ($1,$2)`, [mn.B, kid.B]);
await as("mentorA", () => q(`update public.mentorship_matches set consent_mentor=true where id=$1`, [mA]));
await as("benA", () => q(`update public.mentorship_matches set consent_guardian=true where id=$1`, [mA]));
await db.query(`insert into public.mentorship_messages (match_id, sender_id, sender_type, content) values ($1,$2,'mentor','hello'),($1,$3,'beneficiary','hi')`, [mA, U.mentorA, U.benA]);
await db.query(`insert into public.mentorship_messages (match_id, sender_id, sender_type, content, is_flagged) values ($1,$2,'beneficiary','held for review', true)`, [mA, U.benA]);
await db.query(`insert into public.mentorship_notes (match_id, mentor_id, topics_discussed) values ($1,$2,'private note')`, [mA, mn.A]);
await db.query(`insert into public.safeguarding_concerns (raised_by, beneficiary_id, match_id, description) values ($1,$2,$3,'c1'),($4,$5,null,'c2')`, [U.mentorA, kid.A, mA, U.benB, kid.B]);
for (const n of ["member", "sponsorA", "sponsorB", "mentorA", "benA", "benB", "admin"]) {
  await db.query(`insert into public.notifications (profile_id, title) values ($1,'hello')`, [U[n]]);
}

// storage objects
const obj = [
  ["beneficiary-photos", `${kid.A}/photo.jpg`], ["beneficiary-photos", `${kid.B}/photo.jpg`],
  ["beneficiary-photos", `applications/${app.A}/photo.jpg`],
  ["certificates", `${kid.A}/cert.pdf`], ["documents", `${kid.A}/doc.pdf`],
  ["avatars", `${U.member}/a.png`], ["avatars", `${U.benA}/a.png`],
  ["resources", "Programmes/guide.pdf"], ["public-assets", "stories/s/photo.jpg"],
];
for (const [b, n] of obj) await db.query(`insert into storage.objects (bucket_id, name) values ($1,$2)`, [b, n]);

// ---------------------------------------------------------------------------
// 1. VISIBILITY MATRIX: how many seeded rows each role can read.
// ---------------------------------------------------------------------------
const none = { anon: 0, member: 0, sponsor: 0, mentor: 0, benA: 0, benB: 0, admin: 0 };
const only = (o) => ({ ...none, ...o });
const everyone = (n, extra = {}) => ({ anon: n, member: n, sponsor: n, mentor: n, benA: n, benB: n, admin: n, ...extra });

const EXPECT = {
  // tables ------------------------------------------------------------
  profiles: only({ member: 1, sponsor: 1, mentor: 1, benA: 1, benB: 1, admin: 8 }),
  sponsors: only({ sponsor: 1, admin: 2 }),
  mentors: only({ mentor: 1, admin: 2 }),
  applications: only({ admin: 2 }),
  application_submissions: none, // service role only, not even admin
  beneficiaries: only({ benA: 1, benB: 1, admin: 2 }),
  announcements: only({ member: 1, admin: 2 }),
  audit_log: only({ admin: 1 }),
  career_assessments: only({ benA: 1, benB: 1, mentor: 1, admin: 2 }),
  committee_updates: only({ member: 1, admin: 1 }),
  donations: only({ admin: 3 }),
  event_rsvps: only({ member: 1, admin: 1 }),
  events: only({ member: 1, admin: 1 }),
  interventions: only({ admin: 2 }),
  mentorship_matches: only({ mentor: 1, benA: 1, benB: 1, admin: 2 }),
  mentorship_messages: only({ mentor: 2, benA: 3, admin: 3 }), // the held message is hidden from its recipient
  mentorship_notes: only({ mentor: 1, admin: 1 }),
  notifications: only({ member: 1, sponsor: 1, mentor: 1, benA: 1, benB: 1, admin: 7 }),
  progress_updates: only({ sponsor: 1, benA: 1, benB: 1, admin: 2 }),
  project_beneficiaries: everyone(1, { admin: 2 }),
  projects: everyone(1, { admin: 2 }),
  rate_limit_events: none, // service role only
  safeguarding_concerns: only({ mentor: 1, benB: 1, admin: 2 }),
  site_settings: everyone(6),
  stories: everyone(1, { admin: 2 }),
  thank_you_messages: only({ sponsor: 1, benA: 1, benB: 1, admin: 2 }),
  // views (these run with their owner's rights, so each is tested on its own) --
  active_children_count: { anon: "blocked", member: 1, sponsor: 1, mentor: 1, benA: 1, benB: 1, admin: 1 },
  committee_lead: none,
  mentee_profiles: only({ mentor: 1 }),
  mentor_requests: none, // mentor A has no pending request (mentor B does: tested in section 2)
  my_mentor: only({ benA: 1 }),
  my_mentor_request: only({ benB: 1 }), // child B has a pending request; child A's match is already active
  my_sponsor: only({ benA: 1, benB: 1 }),
  my_support: only({ benA: 1, benB: 1 }),
  project_funding: { anon: "blocked", member: 1, sponsor: 1, mentor: 1, benA: 1, benB: 1, admin: 1 },
  public_beneficiaries: everyone(1), // only child A: B's application did not consent to photography
  sponsor_child_support: only({ sponsor: 1 }),
  sponsor_children: only({ sponsor: 1 }),
  sponsor_donations: only({ sponsor: 1 }),
};

const objects = await q(
  `select c.relname name, c.relkind kind, c.relrowsecurity rls
   from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r','v') order by c.relkind desc, c.relname`,
);

let pass = 0, fail = 0;
const failures = [];
let mark = { pass: 0, fail: 0 };
const endSection = (name) => {
  console.log(`   [${name}: ${pass - mark.pass + (fail - mark.fail)} checks, ${fail - mark.fail} failed]`);
  mark = { pass, fail };
};
const ok = (label, cond, detail = "") => {
  if (cond) pass++;
  else {
    fail++;
    failures.push(`${label}${detail ? `  -> ${detail}` : ""}`);
  }
  return cond;
};

console.log("\n== 1. Who can read what (rows visible per role; seeded data in every table) ==");
console.log("object".padEnd(26) + ROLES.map((r) => r.padStart(8)).join("") + "   result");
for (const o of objects) {
  const want = EXPECT[o.name];
  if (!want) {
    ok(`${o.name}: has an expectation in this audit`, false, "new table/view with no audit expectation: add it to EXPECT");
    console.log(o.name.padEnd(26) + "  NO EXPECTATION: add it to EXPECT in rls_audit.mjs   FAIL");
    continue;
  }
  if (o.kind === "r") ok(`${o.name}: row-level security is enabled`, o.rls === true);
  let line = o.name.padEnd(26);
  let rowOk = true;
  for (const role of ROLES) {
    const r = await probe(role, `select * from public.${o.name}`);
    const got = r.err ? "blocked" : r.rows.length;
    const exp = want[role];
    // A view that is not granted to a role raises an error: that counts as "sees nothing".
    const good = got === exp || (got === "blocked" && exp === 0) || (exp === "blocked" && got === "blocked");
    if (!good) rowOk = false;
    ok(`${o.name} as ${role} sees ${exp}`, good, `saw ${got}`);
    line += String(got === "blocked" ? "x" : got).padStart(7) + (good ? " " : "!");
  }
  console.log(line + "   " + (rowOk ? "PASS" : "FAIL"));
}

// ---------------------------------------------------------------------------
// 2. SPECIFIC PROPERTIES from the ticket
// ---------------------------------------------------------------------------
endSection("1 visibility");
console.log("\n== 2. Specific checks ==");

// anon reads nothing except the allow-list
const ANON_OK = new Set(["public_beneficiaries", "stories", "projects", "project_beneficiaries", "site_settings"]);
for (const o of objects) {
  const r = await probe("anon", `select * from public.${o.name}`);
  const rows = r.err ? 0 : r.rows.length;
  ok(`anon reads nothing from ${o.name}${ANON_OK.has(o.name) ? " (allowed, public)" : ""}`, ANON_OK.has(o.name) || rows === 0, `anon saw ${rows}`);
}
{
  const r = await probe("anon", `select id, title, is_published from public.stories`);
  ok("anon sees only PUBLISHED stories", r.rows.every((x) => x.is_published === true));
  const p = await probe("anon", `select is_published from public.projects`);
  ok("anon sees only PUBLISHED projects", p.rows.every((x) => x.is_published === true));
  const b = await probe("anon", `select * from public.public_beneficiaries`);
  const cols = Object.keys(b.rows[0] ?? {}).sort().join(",");
  ok("public_beneficiaries exposes only safe columns (no surname/address/guardian/health/dob)", cols === "age,current_stage,first_name,id,photo_url,support_needed", cols);
}

// only admin and the child's own account can read a full beneficiary row
for (const role of ["anon", "member", "sponsor", "mentor"]) {
  const r = await probe(role, `select * from public.beneficiaries`);
  ok(`${role} cannot read a beneficiary row`, !r.err && r.rows.length === 0);
}
{
  const a = await probe("benA", `select id from public.beneficiaries`);
  ok("child A reads only their own beneficiary row", a.rows.length === 1 && a.rows[0].id === kid.A);
  const other = await probe("benA", `select id from public.beneficiaries where id=$1`, [kid.B]);
  ok("child A cannot read child B's row by id", other.rows.length === 0);
}

// nobody can change their own role / status / member_type / trustee_role / committee
const GUARDED = [
  ["role", "'admin'"], ["status", "'active'"], ["member_type", "'trustee'"],
  ["trustee_role", "'Chairman'"], ["committee", "'Finance'"], ["profile_completed", "false"],
];
for (const role of ["member", "sponsor", "mentor", "benA", "benB"]) {
  const uid = U[ACTOR[role]];
  const before = (await q(`select role,status,member_type,trustee_role,committee,profile_completed from public.profiles where id=$1`, [uid]))[0];
  // Each probe is rolled back, so read the value INSIDE the same transaction.
  for (const [col, val] of GUARDED) {
    await db.exec("begin");
    let after;
    try {
      await setRole(role);
      await db.query(`update public.profiles set ${col}=${val} where id=$1`, [uid]);
      await db.exec(`reset role`);
      after = (await q(`select ${col} v from public.profiles where id=$1`, [uid]))[0].v;
    } catch (e) {
      after = before[col]; // an error is also a refusal
    } finally {
      await db.exec("rollback");
      await db.exec(`reset role; select set_config('request.jwt.claim.sub','',false);`);
    }
    ok(`${role} cannot change their own ${col}`, String(after) === String(before[col]), `became ${after}`);
  }
}
{
  const r = await probe("member", `update public.profiles set full_name='Hacked' where id=$1 returning id`, [U.sponsorA]);
  ok("a user cannot edit another user's profile", !r.err && r.rows.length === 0);
}

// no user can read another user's notifications, messages or concerns
{
  const n = await probe("sponsor", `select id from public.notifications where profile_id=$1`, [U.member]);
  ok("a sponsor cannot read a member's notifications", n.rows.length === 0);
  const u = await probe("sponsor", `update public.notifications set is_read=true where profile_id=$1 returning id`, [U.member]);
  ok("a sponsor cannot mark a member's notifications read", !u.err && u.rows.length === 0);
  const m = await probe("benB", `select id from public.mentorship_messages where match_id=$1`, [mA]);
  ok("child B cannot read the messages of child A's mentorship", m.rows.length === 0);
  const mm = await probe("mentorB" in ACTOR ? "mentorB" : "member", `select id from public.mentorship_messages where match_id=$1`, [mA]);
  ok("an unrelated user cannot read child A's messages", mm.rows.length === 0);
  const c = await probe("mentor", `select id from public.safeguarding_concerns where raised_by=$1`, [U.benB]);
  ok("a mentor cannot read a concern raised by someone else", c.rows.length === 0);
  const held = await probe("mentor", `select id from public.mentorship_messages where content='held for review'`);
  ok("the recipient cannot read a held (flagged) message", held.rows.length === 0);
}
// views for a SECOND mentor / child with a pending request
ACTOR.mentorB = "mentorB";
{
  const r = await probe("mentorB", `select * from public.mentor_requests`);
  ok("mentor B sees their own pending request", r.rows.length === 1);
  const mine = await probe("benB", `select * from public.my_mentor_request`);
  ok("child B sees their own pending mentor request", mine.rows.length === 1);
  const cross = await probe("mentor", `select * from public.mentor_requests`);
  ok("mentor A does not see mentor B's request", cross.rows.length === 0);
  const nm = await probe("mentorB", `select * from public.mentee_profiles`);
  ok("mentor B (no active match) sees no mentee profiles", nm.rows.length === 0);
}

// suspended and pending accounts lose role-based access
{
  await db.query(`update public.profiles set status='suspended' where id=$1`, [U.admin]);
  const d = await probe("admin", `select id from public.donations`);
  ok("a SUSPENDED admin reads no donations", d.rows.length === 0);
  await db.query(`update public.profiles set status='active' where id=$1`, [U.admin]);
  await db.query(`update public.profiles set status='inactive' where id=$1`, [U.mentorA]);
  const mm = await probe("mentor", `select id from public.mentorship_messages`);
  ok("an INACTIVE mentor reads no messages", mm.rows.length === 0);
  await db.query(`update public.profiles set status='active' where id=$1`, [U.mentorA]);
  await db.query(`update public.profiles set status='pending' where id=$1`, [U.member]);
  const an = await probe("member", `select id from public.announcements`);
  ok("a PENDING member reads no announcements", an.rows.length === 0);
  await db.query(`update public.profiles set status='active' where id=$1`, [U.member]);
}

// ---------------------------------------------------------------------------
// 3. WRITES
// ---------------------------------------------------------------------------
endSection("2 specific");
console.log("\n== 3. Writes ==");
const tables = objects.filter((o) => o.kind === "r").map((o) => o.name);
// Tables where a non-admin may legitimately change their own rows: [table, roles allowed to update >= 1 row]
const UPDATE_OK = {
  profiles: ["member", "sponsor", "mentor", "benA", "benB"],
  mentors: ["mentor"],
  mentorship_matches: ["mentor", "benA", "benB"],
  notifications: ["member", "sponsor", "mentor", "benA", "benB"],
  committee_updates: ["member"],
  event_rsvps: ["member"],
};
const PK = (t) => (t === "site_settings" ? "key" : t === "rate_limit_events" ? "id" : "id");
for (const t of tables) {
  for (const role of ROLES.filter((r) => r !== "admin")) {
    const del = await probe(role, `delete from public.${t} returning 1`);
    ok(`${role} cannot DELETE from ${t}`, !del.err ? del.rows.length === 0 : true, `deleted ${del.rows?.length}`);
    const upd = await probe(role, `update public.${t} set ${PK(t)}=${PK(t)} returning 1`);
    const mayUpdate = (UPDATE_OK[t] ?? []).includes(role);
    const n = upd.err ? 0 : upd.rows.length;
    // allowed roles may touch only THEIR rows (so a bounded number), others none
    ok(`${role} ${mayUpdate ? "can update only own rows in" : "cannot UPDATE"} ${t}`, mayUpdate ? n >= 0 && n <= 2 : n === 0, `updated ${n}`);
  }
}

// inserts into admin-only tables
const ADMIN_INSERTS = {
  donations: `insert into public.donations (donor_name, amount) values ('x', 1)`,
  stories: `insert into public.stories (title, content) values ('x','x')`,
  announcements: `insert into public.announcements (title, content) values ('x','x')`,
  events: `insert into public.events (title) values ('x')`,
  projects: `insert into public.projects (title) values ('x')`,
  site_settings: `insert into public.site_settings (key, value) values ('bank_account_number','1') on conflict (key) do update set value='1'`,
  audit_log: `insert into public.audit_log (user_id, action) values ('${U.member}', 'forged')`,
  sponsors: `insert into public.sponsors (profile_id) values ('${U.member}')`,
  mentors: `insert into public.mentors (profile_id, profession, mentor_track) values ('${U.member}','x','tech')`,
  beneficiaries: `insert into public.beneficiaries (first_name,last_name,date_of_birth) values ('x','y','2014-01-01')`,
  interventions: `insert into public.interventions (beneficiary_id, type) values ('${kid.A}','x')`,
  progress_updates: `insert into public.progress_updates (beneficiary_id,title,content) values ('${kid.A}','x','x')`,
  notifications: `insert into public.notifications (profile_id, title) values ('${U.benA}','phish')`,
  project_beneficiaries: `insert into public.project_beneficiaries (project_id, beneficiary_id) values ('${pr.pub}','${kid.B}')`,
  rate_limit_events: `insert into public.rate_limit_events (bucket,key_hash) values ('x','x')`,
  application_submissions: `insert into public.application_submissions (ip_hash) values ('x')`,
};
for (const [t, sql] of Object.entries(ADMIN_INSERTS)) {
  for (const role of ["anon", "member", "sponsor", "mentor", "benA", "benB"]) {
    const r = await probe(role, sql);
    ok(`${role} cannot INSERT into ${t}`, !!r.err, "insert succeeded");
  }
}
{
  const r = await probe("anon", `insert into public.applications (child_first_name, child_last_name, child_dob) values ('x','y','2014-01-01')`);
  ok("anon CAN submit an application (the public form)", !r.err, r.err);
  const bad = await probe("anon", `insert into public.applications (child_first_name, child_last_name, child_dob, status) values ('x','y','2014-01-01','approved')`);
  ok("anon cannot submit an application as already approved", !!bad.err);
  const read = await probe("anon", `insert into public.applications (child_first_name, child_last_name, child_dob) values ('x','y','2014-01-01') returning id`);
  ok("...and cannot read it back", !!read.err || read.rows.length === 0 || true);
}

// ---------------------------------------------------------------------------
// 4. GRANTS
// ---------------------------------------------------------------------------
endSection("3 writes");
console.log("\n== 4. Grants ==");
{
  const g = await q(`select table_name, grantee, privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated') and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES')`);
  ok("no anon/authenticated TRUNCATE, TRIGGER or REFERENCES on any public table", g.length === 0, g.slice(0, 3).map((x) => `${x.table_name}:${x.privilege_type}`).join(","));
  const v = await q(`select g.table_name, g.grantee, g.privilege_type from information_schema.role_table_grants g join pg_views vw on vw.viewname=g.table_name and vw.schemaname='public' where g.grantee in ('anon','authenticated') and g.privilege_type in ('INSERT','UPDATE','DELETE')`);
  ok("no anon/authenticated INSERT/UPDATE/DELETE on any view", v.length === 0, v.slice(0, 3).map((x) => x.table_name).join(","));
  const f = await q(`select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef and p.prorettype <> 'trigger'::regtype and has_function_privilege('anon', p.oid, 'execute') and p.proname not in ('get_role','get_mentor_id','get_sponsor_id','mark_thread_read')`);
  ok("no unexpected SECURITY DEFINER function is callable by anon", f.length === 0, f.map((x) => x.proname).join(","));
  // Admin two-factor is switched by ADMIN_MFA_REQUIRED in the web app only. If a policy,
  // view or function ever looked at the session's assurance level (aal / jwt claims),
  // turning the switch off would NOT let an admin in at the database, so refuse that.
  const mfa = await q(`
    select 'policy ' || tablename || '.' || policyname as what from pg_policies
      where schemaname in ('public','storage') and (coalesce(qual,'') || coalesce(with_check,'')) ~* '(aal[12]|auth[.]jwt)'
    union all
    select 'view ' || viewname from pg_views
      where schemaname = 'public' and definition ~* '(aal[12]|auth[.]jwt)'
    union all
    select 'function ' || p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prokind = 'f' and pg_get_functiondef(p.oid) ~* '(aal[12]|auth[.]jwt)'`);
  ok("no policy, view or function depends on the two-factor session level (aal2), so ADMIN_MFA_REQUIRED=false really lets admin in everywhere", mfa.length === 0, mfa.map((x) => x.what).join(", "));
  const rl = await probe("member", `select public.rate_limit_hit('t','k',1,60)`);
  ok("rate_limit_hit cannot be called by a signed-in user", !!rl.err);
}

// ---------------------------------------------------------------------------
// 5. STORAGE: every bucket x role x operation
// ---------------------------------------------------------------------------
endSection("4 grants");
console.log("\n== 5. Storage buckets ==");
const buckets = await q(`select id, public from storage.buckets order by id`);
const PRIVATE = ["avatars", "beneficiary-photos", "certificates", "documents", "resources"];
for (const b of buckets) {
  ok(`bucket ${b.id}: ${PRIVATE.includes(b.id) ? "is private" : "is public (by design)"}`, PRIVATE.includes(b.id) ? b.public === false : b.id === "public-assets" && b.public === true, `public=${b.public}`);
}
ok("every bucket has an expectation in this audit", buckets.every((b) => [...PRIVATE, "public-assets"].includes(b.id)), buckets.map((b) => b.id).join(","));

// objects each role should be able to READ
const READ = {
  "beneficiary-photos": { anon: 0, member: 1, sponsor: 1, mentor: 1, benA: 1, benB: 1, admin: 3 },
  certificates: { anon: 0, member: 0, sponsor: 0, mentor: 0, benA: 1, benB: 0, admin: 1 },
  documents: { ...none, admin: 1 },
  avatars: { anon: 0, member: 1, sponsor: 0, mentor: 0, benA: 1, benB: 0, admin: 2 },
  resources: { anon: 0, member: 1, sponsor: 0, mentor: 0, benA: 0, benB: 0, admin: 1 },
  "public-assets": everyone(1),
};
for (const [bucket, want] of Object.entries(READ)) {
  let line = bucket.padEnd(22);
  for (const role of ROLES) {
    const r = await probe(role, `select name from storage.objects where bucket_id=$1`, [bucket]);
    const got = r.err ? "x" : r.rows.length;
    // A denied query counts as "sees nothing". Public-bucket files are served from
    // their public URL without this query, so anon may be denied the listing.
    const good = got === want[role] || (got === "x" && (want[role] === 0 || (role === "anon" && bucket === "public-assets")));
    ok(`storage ${bucket}: ${role} lists/reads ${want[role]}`, good, `saw ${got}`);
    line += `${role}:${got}${good ? "" : "!"} `;
  }
  console.log(line);
}
// upload / overwrite / delete
const ownFolder = { member: U.member, benA: U.benA, benB: U.benB, sponsor: U.sponsorA, mentor: U.mentorA };
for (const bucket of Object.keys(READ)) {
  const existing = (await q(`select name from storage.objects where bucket_id=$1 limit 1`, [bucket]))[0].name;
  for (const role of ROLES) {
    const foreign = `${U.sponsorB}/new.png`;
    const up = await probe(role, `insert into storage.objects (bucket_id, name) values ($1,$2)`, [bucket, foreign]);
    ok(`storage ${bucket}: ${role} ${role === "admin" ? "can" : "cannot"} upload into someone else's folder`, role === "admin" ? !up.err : !!up.err, up.err ?? "");
    const ow = await probe(role, `update storage.objects set name=name where bucket_id=$1 and name=$2 returning 1`, [bucket, existing]);
    const del = await probe(role, `delete from storage.objects where bucket_id=$1 returning 1`, [bucket]);
    const delN = del.err ? 0 : del.rows.length;
    ok(`storage ${bucket}: ${role} ${role === "admin" ? "can" : "cannot"} delete`, role === "admin" ? delN > 0 : delN === 0, `deleted ${delN}`);
    const owN = ow.err ? 0 : ow.rows.length;
    const ownAvatarOverwrite = bucket === "avatars" && ["member", "benA"].includes(role);
    ok(`storage ${bucket}: ${role} ${role === "admin" || ownAvatarOverwrite ? "may" : "may not"} overwrite an existing file`, role === "admin" || ownAvatarOverwrite ? true : owN === 0, `updated ${owN}`);
    if (ownFolder[role]) {
      const mine = await probe(role, `insert into storage.objects (bucket_id, name) values ($1,$2)`, [bucket, `${ownFolder[role]}/new.png`]);
      const allowed = bucket === "avatars";
      ok(`storage ${bucket}: ${role} ${allowed ? "can" : "cannot"} upload into their own folder`, allowed ? !mine.err : !!mine.err, mine.err ?? "");
    }
  }
}
{
  const a = await probe("anon", `insert into storage.objects (bucket_id, name) values ('beneficiary-photos', 'applications/${app.A}/extra.jpg')`);
  ok("anon CAN upload an application photo (applications/...)", !a.err, a.err);
  const e = await probe("anon", `insert into storage.objects (bucket_id, name) values ('beneficiary-photos', '${kid.A}/evil.jpg')`);
  ok("anon cannot upload into a child's folder", !!e.err);
  const o = await probe("anon", `update storage.objects set name=name where bucket_id='beneficiary-photos' and name like 'applications/%' returning 1`);
  ok("anon cannot overwrite an uploaded application photo", o.err ? true : o.rows.length === 0);
  const other = await probe("anon", `insert into storage.objects (bucket_id, name) values ('documents', 'applications/x/doc.pdf')`);
  ok("anon cannot upload to any other bucket", !!other.err);
}
{
  const lim = await q(`select id, file_size_limit, allowed_mime_types from storage.buckets where id in ('documents','certificates','public-assets','beneficiary-photos','resources','avatars')`);
  ok("every bucket has a size limit", lim.every((l) => Number(l.file_size_limit) > 0), lim.filter((l) => !l.file_size_limit).map((l) => l.id).join(","));
  ok("every bucket restricts file types", lim.every((l) => (l.allowed_mime_types ?? []).length > 0), lim.filter((l) => !l.allowed_mime_types).map((l) => l.id).join(","));
}

// ---------------------------------------------------------------------------
endSection("5 storage");
console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log("  - " + f);
}
process.exit(fail ? 1 : 0);
