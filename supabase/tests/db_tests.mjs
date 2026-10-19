// Database tests: applies every migration (001 onward, re-running the idempotent
// ones) to an in-process Postgres (PGlite, no Docker needed) behind a small stub
// of Supabase's auth/storage schemas, then checks row-level security, triggers
// and rules as each kind of user. Run with:  npm run test:db
// Exits non-zero on any failure, so CI can block a merge on it.
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

const files = fs.readdirSync(MIG).filter((f) => f.endsWith(".sql")).sort();
async function applyAll(label, only) {
  for (const f of only ? files.filter((x) => x.startsWith(only)) : files) {
    const sql = fs
      .readFileSync(path.join(MIG, f), "utf8")
      .replace(/create extension if not exists pgcrypto;/i, "");
    try {
      await db.exec(sql);
    } catch (e) {
      console.log(`MIGRATION FAILED (${label}) ${f}: ${e.message}`);
      process.exit(1);
    }
  }
  console.log(`applied: ${label}`);
}
await applyAll("001-008, first time");
await applyAll("008 again (idempotency)", "008");
await applyAll("008 a third time", "008");
await applyAll("010 again (idempotency)", "010");
await applyAll("010 a third time", "010");
await applyAll("011 again (idempotency)", "011");
await applyAll("011 a third time", "011");
await applyAll("012 again (idempotency)", "012");
await applyAll("012 a third time", "012");
await applyAll("013 again (idempotency)", "013");
await applyAll("013 a third time", "013");

let pass = 0,
  fail = 0;
const ok = (label, cond, detail = "") => {
  cond ? pass++ : fail++;
  console.log(`${cond ? "  PASS" : "  FAIL"}  ${label}${!cond && detail ? "  -> " + detail : ""}`);
};

const U = {};
async function mkUser(name, role) {
  const r = await db.query(
    `insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`,
    [`${name}@t.test`, JSON.stringify({ full_name: name, role })],
  );
  U[name] = r.rows[0].id;
}
async function as(name, fn) {
  await db.exec(
    `set role authenticated; select set_config('request.jwt.claim.sub', '${U[name]}', false);`,
  );
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false);`);
  }
}
const q = async (sql, p) => (await db.query(sql, p)).rows;
const tryq = async (sql, p) => {
  try {
    return { rows: await q(sql, p) };
  } catch (e) {
    return { err: e.message };
  }
};

// ---- seed (as superuser) ----
for (const [n, r] of [
  ["admin", "member"], ["s1", "sponsor"], ["s2", "sponsor"], ["m1", "mentor"],
  ["m2", "mentor"], ["c1", "member"], ["c2", "member"], ["rando", "member"],
]) await mkUser(n, r);
await db.exec(`update public.profiles set status='active'`);
await db.query(`update public.profiles set role='admin' where id=$1`, [U.admin]);
await db.query(`update public.profiles set role='beneficiary' where id in ($1,$2)`, [U.c1, U.c2]);
const sp = {}, mn = {}, kid = {};
for (const n of ["s1", "s2"])
  sp[n] = (await q(`insert into public.sponsors (profile_id) values ($1) returning id`, [U[n]]))[0].id;
for (const n of ["m1", "m2"])
  mn[n] = (await q(`insert into public.mentors (profile_id, profession, mentor_track) values ($1,'Engineer','tech') returning id`, [U[n]]))[0].id;
for (const [n, s] of [["c1", "s1"], ["c2", "s2"]]) {
  kid[n] = (
    await q(
      `insert into public.beneficiaries (profile_id, first_name,last_name,date_of_birth,address,guardian_phone,household_income,health_conditions,sponsor_id,interests,aspirations,class_level) values ($1,$2,'Secretsurname','2014-05-01','12 Private Road','08099999999','none','asthma',$3,'football','doctor','JSS2') returning id`,
      [U[n], n.toUpperCase(), sp[s]],
    )
  )[0].id;
}
await db.query(
  `insert into public.progress_updates (beneficiary_id,title,content) values ($1,'Up','c1 update'),($2,'Up','c2 update')`,
  [kid.c1, kid.c2],
);
await db.query(
  `insert into public.interventions (beneficiary_id,type,amount,description,notes) values ($1,'school_fees',5000,'Term fees','INTERNAL NOTE')`,
  [kid.c1],
);

console.log("\n== 4.0 section 1: sponsors/mentors cannot read beneficiaries ==");
for (const n of ["s1", "s2", "m1", "m2", "rando"]) {
  const r = await as(n, () => tryq(`select * from public.beneficiaries`));
  ok(`${n}: select * from beneficiaries -> 0 rows`, r.rows?.length === 0, r.err || r.rows?.length);
}
const own = await as("c1", () => q(`select id from public.beneficiaries`));
ok("child account still reads its own record only", own.length === 1 && own[0].id === kid.c1);
ok("admin still reads all beneficiaries", (await as("admin", () => q(`select id from public.beneficiaries`))).length === 2);

console.log("\n== views: only listed columns, only own children ==");
const sc = await as("s1", () => q(`select * from public.sponsor_children`));
ok("s1 sees exactly 1 child in sponsor_children", sc.length === 1 && sc[0].first_name === "C1");
const cols = Object.keys(sc[0] ?? {}).sort().join(",");
ok(
  "sponsor_children columns exactly as specified",
  cols === "age,aspirations,class_level,current_stage,first_name,id,interests,photo_url,stage_updated_at,support_needed",
  cols,
);
ok("no surname/address/guardian/income/health leaked", !/last_name|address|guardian|household|health|phone|email|disab/.test(cols));
ok("s2 sees only own child (not c1)", (await as("s2", () => q(`select id from public.sponsor_children`))).map((r) => r.id).join() === kid.c2);
ok("m1 sees no sponsor_children", (await as("m1", () => q(`select * from public.sponsor_children`))).length === 0);
const scs = await as("s1", () => q(`select * from public.sponsor_child_support`));
ok("sponsor_child_support: own child's interventions, no internal notes", scs.length === 1 && !("notes" in scs[0]) && Number(scs[0].amount) === 5000);
ok("s2 sees none of c1's support", (await as("s2", () => q(`select * from public.sponsor_child_support`))).length === 0);
const pu = await as("s1", () => q(`select content from public.progress_updates`));
ok("progress_updates: sponsor limited to linked child", pu.length === 1 && pu[0].content === "c1 update", JSON.stringify(pu));

console.log("\n== 4.0 section 2: vetting ==");
await as("m1", () =>
  q(`update public.mentors set vetting_status='cleared', vetted_by=$1, vetting_notes='hax', profession='Pilot' where id=$2`, [U.m1, mn.m1]),
);
const m1row = (await q(`select vetting_status, vetting_notes, vetted_by, profession from public.mentors where id=$1`, [mn.m1]))[0];
ok("mentor cannot set own vetting_status / notes / vetted_by", m1row.vetting_status === "pending" && m1row.vetting_notes === null && m1row.vetted_by === null, JSON.stringify(m1row));
ok("mentor CAN edit allowed fields (profession)", m1row.profession === "Pilot");
await as("m1", () => q(`update public.mentors set code_of_conduct_accepted_at='2000-01-01' where id=$1`, [mn.m1]));
const coc = (await q(`select code_of_conduct_accepted_at from public.mentors where id=$1`, [mn.m1]))[0].code_of_conduct_accepted_at;
ok("code of conduct stamped by server clock (not client value)", coc && new Date(coc).getFullYear() >= 2025);
await as("m1", () => q(`update public.mentors set code_of_conduct_accepted_at=null where id=$1`, [mn.m1]));
ok("code of conduct acceptance cannot be cleared", (await q(`select code_of_conduct_accepted_at from public.mentors where id=$1`, [mn.m1]))[0].code_of_conduct_accepted_at !== null);

console.log("\n== 4.0 section 3: matches & consent ==");
let r = await as("admin", () => tryq(`insert into public.mentorship_matches (mentor_id, beneficiary_id) values ($1,$2)`, [mn.m1, kid.c1]));
ok("cannot match an UNCLEARED mentor (even as admin)", !!r.err, "insert succeeded");
await as("admin", () => q(`update public.mentors set vetting_status='cleared', vetted_by=$1, vetted_at=now() where id=$2`, [U.admin, mn.m1]));
ok("admin CAN clear a mentor", (await q(`select vetting_status from public.mentors where id=$1`, [mn.m1]))[0].vetting_status === "cleared");
const match = (
  await as("admin", () =>
    q(`insert into public.mentorship_matches (mentor_id, beneficiary_id, status, consent_mentor, consent_guardian) values ($1,$2,'active',true,true) returning id,status,consent_mentor,consent_guardian`, [mn.m1, kid.c1]),
  )
)[0];
ok("a match can't be created already active / pre-consented", match.status === "pending_consent" && !match.consent_mentor && !match.consent_guardian, JSON.stringify(match));
const MID = match.id;

r = await as("m1", () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,'mentor','hello')`, [MID, U.m1]));
ok("message insert FAILS while match is pending", !!r.err, "inserted");

await as("c2", () => q(`update public.mentorship_matches set consent_guardian=true where id=$1`, [MID]));
ok("another child's guardian cannot consent on this match", (await q(`select consent_guardian from public.mentorship_matches where id=$1`, [MID]))[0].consent_guardian === false);
await as("m1", () => q(`update public.mentorship_matches set consent_guardian=true, status='active' where id=$1`, [MID]));
let st = (await q(`select status, consent_guardian from public.mentorship_matches where id=$1`, [MID]))[0];
ok("mentor cannot consent for the guardian or set status active", st.status === "pending_consent" && st.consent_guardian === false, JSON.stringify(st));
await as("m2", () => q(`update public.mentorship_matches set consent_mentor=true where id=$1`, [MID]));
ok("a different mentor cannot consent", (await q(`select consent_mentor from public.mentorship_matches where id=$1`, [MID]))[0].consent_mentor === false);

await as("m1", () => q(`update public.mentorship_matches set consent_mentor=true where id=$1`, [MID]));
st = (await q(`select status, consent_mentor, consent_mentor_at from public.mentorship_matches where id=$1`, [MID]))[0];
ok("mentor consent alone does NOT activate", st.status === "pending_consent" && st.consent_mentor && st.consent_mentor_at);
await as("c1", () => q(`update public.mentorship_matches set consent_guardian=true where id=$1`, [MID]));
st = (await q(`select status, started_at from public.mentorship_matches where id=$1`, [MID]))[0];
ok("both consents + cleared mentor -> ACTIVE (set by trigger)", st.status === "active" && st.started_at);
await as("m1", () => q(`update public.mentorship_matches set consent_mentor=false where id=$1`, [MID]));
ok("consent can't be withdrawn by client edit", (await q(`select consent_mentor from public.mentorship_matches where id=$1`, [MID]))[0].consent_mentor === true);

await as("admin", () => q(`update public.mentors set vetting_status='cleared' where id=$1`, [mn.m2]));
const match2 = (await as("admin", () => q(`insert into public.mentorship_matches (mentor_id, beneficiary_id) values ($1,$2) returning id`, [mn.m2, kid.c2])))[0].id;
await as("c2", () => q(`update public.mentorship_matches set status='terminated' where id=$1`, [match2]));
st = (await q(`select status, termination_reason from public.mentorship_matches where id=$1`, [match2]))[0];
ok("guardian can DECLINE a pending request (-> terminated)", st.status === "terminated" && /guardian/i.test(st.termination_reason), JSON.stringify(st));
await as("c1", () => q(`update public.mentorship_matches set status='terminated' where id=$1`, [MID]));
ok("...but cannot terminate an ACTIVE match", (await q(`select status from public.mentorship_matches where id=$1`, [MID]))[0].status === "active");

console.log("\n== mentee_profiles & dependent policies (match is active) ==");
const mp = await as("m1", () => q(`select * from public.mentee_profiles`));
ok("m1 sees exactly their active mentee", mp.length === 1 && mp[0].first_name === "C1" && mp[0].match_id === MID);
ok("mentee_profiles has no surname/address/guardian/income/health", !/last_name|address|guardian|household|health|phone/.test(Object.keys(mp[0]).join(",")));
ok("m2 sees no mentees (their match was declined)", (await as("m2", () => q(`select * from public.mentee_profiles`))).length === 0);
await db.query(`insert into public.career_assessments (beneficiary_id, top_clusters) values ($1, '{builder,creative}'), ($2, '{people,analytical}')`, [kid.c1, kid.c2]);
const ca = await as("m1", () => q(`select beneficiary_id from public.career_assessments`));
ok("mentor reads career assessment of own active mentee only", ca.length === 1 && ca[0].beneficiary_id === kid.c1);
await db.query(`insert into public.thank_you_messages (beneficiary_id,sponsor_id,content,status) values ($1,$2,'pending one','pending'),($1,$2,'approved one','approved')`, [kid.c1, sp.s1]);
const ty = await as("s1", () => q(`select content from public.thank_you_messages`));
ok("sponsor sees APPROVED thank-yous only", ty.length === 1 && ty[0].content === "approved one", JSON.stringify(ty));
await db.exec(`insert into storage.objects (bucket_id,name) values ('beneficiary-photos','${kid.c1}/photo.jpg'),('beneficiary-photos','${kid.c2}/photo.jpg')`);
const ph = async (n) => (await as(n, () => q(`select name from storage.objects where bucket_id='beneficiary-photos'`))).map((r) => r.name);
ok("sponsor reads only own child's photo folder", (await ph("s1")).join() === `${kid.c1}/photo.jpg`);
ok("mentor reads only active mentee's photo folder", (await ph("m1")).join() === `${kid.c1}/photo.jpg`);
ok("unrelated user reads no photos", (await ph("rando")).length === 0);

console.log("\n== 4.0 section 4: messages ==");
const send = (who, role, text, match = MID) =>
  as(who, () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,$3,$4) returning id,is_flagged,flag_reason`, [match, U[who], role, text]));
r = await send("m1", "mentor", "Hi! How is school going?");
ok("mentor can send on an ACTIVE match", r.rows?.length === 1 && r.rows[0].is_flagged === false, r.err);
r = await send("c1", "beneficiary", "Fine thank you");
ok("child account can send on an ACTIVE match", r.rows?.length === 1, r.err);
r = await send("m1", "beneficiary", "spoofing");
ok("sender_type must match the sender's role", !!r.err);
r = await send("rando", "mentor", "intruder");
ok("a third user cannot insert into the thread", !!r.err);
for (const [label, text] of [
  ["phone", "call me on 08012345678"],
  ["email", "mail me at bob@gmail.com"],
  ["link", "see https://example.com/x"],
  ["domain", "go to mysite.com now"],
  ["handle", "add me @bob_99 please"],
]) {
  r = await send("m1", "mentor", text);
  ok(`message with ${label} is inserted AND flagged by trigger`, r.rows?.[0]?.is_flagged === true && r.rows[0].flag_reason === "contact details", r.err || JSON.stringify(r.rows));
}
r = await send("m1", "mentor", "I am 12 years old and in class 6 of 2 schools");
ok("ordinary text with a few numbers is NOT flagged", r.rows?.[0]?.is_flagged === false, JSON.stringify(r.rows));
await as("m1", () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content,is_flagged) values ($1,$2,'mentor','sneaky',true)`, [MID, U.m1]));
const sneaky = (await q(`select is_flagged from public.mentorship_messages where content='sneaky'`))[0];
ok("a sender cannot pre-set flag fields", !sneaky || sneaky.is_flagged === false);
r = await as("m1", () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,'mentor',$3)`, [MID, U.m1, "x".repeat(1001)]));
ok("content over 1000 chars is rejected", !!r.err);
r = await as("m1", () => tryq(`update public.mentorship_messages set content='edited' where sender_id=$1`, [U.m1]));
ok("users cannot UPDATE messages", !!r.err || (await q(`select count(*)::int c from public.mentorship_messages where content='edited'`))[0].c === 0);
await as("c1", () => tryq(`delete from public.mentorship_messages`));
ok("users cannot DELETE messages", (await q(`select count(*)::int c from public.mentorship_messages`))[0].c >= 7);
ok("third user cannot READ the thread", (await as("rando", () => q(`select * from public.mentorship_messages`))).length === 0);
ok("another mentor cannot READ the thread", (await as("m2", () => q(`select * from public.mentorship_messages`))).length === 0);
ok("other child's account cannot READ the thread", (await as("c2", () => q(`select * from public.mentorship_messages`))).length === 0);
ok("sponsor cannot READ the thread", (await as("s1", () => q(`select * from public.mentorship_messages`))).length === 0);
ok(
  "mentor + child account + admin CAN read it",
  (await as("m1", () => q(`select 1 from public.mentorship_messages`))).length > 0 &&
    (await as("c1", () => q(`select 1 from public.mentorship_messages`))).length > 0 &&
    (await as("admin", () => q(`select 1 from public.mentorship_messages`))).length > 0,
);

const target = (await q(`select id from public.mentorship_messages where content='Fine thank you'`))[0].id;
await as("admin", () =>
  q(`update public.mentorship_messages set is_flagged=true, flag_reason='review', flagged_by=$2, flagged_at=now(), content='HACKED' where id=$1`, [target, U.admin]),
);
const fm = (await q(`select content,is_flagged,flag_reason from public.mentorship_messages where id=$1`, [target]))[0];
ok("admin can flag, but content stays immutable", fm.is_flagged && fm.flag_reason === "review" && fm.content === "Fine thank you", JSON.stringify(fm));
await as("admin", () => tryq(`delete from public.mentorship_messages where id=$1`, [target]));
ok("admin cannot delete messages either", (await q(`select 1 from public.mentorship_messages where id=$1`, [target])).length === 1);

await as("c1", () => q(`select public.mark_thread_read($1)`, [MID]));
const rd = await q(`select read_at from public.mentorship_messages where match_id=$1 and content='Hi! How is school going?'`, [MID]);
ok("mark_thread_read marks the OTHER side's messages read", rd[0].read_at !== null);
const own2 = await q(`select read_at from public.mentorship_messages where content='Fine thank you'`);
ok("...and not the reader's own messages", own2[0].read_at === null);
await as("rando", () => q(`select public.mark_thread_read($1)`, [MID]));
ok("a non-party cannot mark a thread read", (await q(`select count(*)::int c from public.mentorship_messages where match_id=$1 and sender_id=$2 and read_at is not null`, [MID, U.c1]))[0].c === 0);

await as("admin", () => q(`update public.mentorship_matches set status='paused' where id=$1`, [MID]));
r = await send("m1", "mentor", "still there?");
ok("message insert FAILS right after admin pauses the match", !!r.err);
await as("admin", () => q(`update public.mentorship_matches set status='terminated', termination_reason='test' where id=$1`, [MID]));
r = await send("c1", "beneficiary", "hello?");
ok("message insert FAILS when terminated", !!r.err);
await as("admin", () => q(`update public.mentorship_matches set status='active' where id=$1`, [MID]));
r = await send("m1", "mentor", "back again");
ok("admin resume (-> active) re-enables sending", r.rows?.length === 1, r.err);

console.log("\n== 4.0 section 5: safeguarding_concerns ==");
ok("RLS enabled on safeguarding_concerns", (await q(`select relrowsecurity from pg_class where relname='safeguarding_concerns'`))[0].relrowsecurity === true);
r = await as("m1", () => tryq(`insert into public.safeguarding_concerns (raised_by,beneficiary_id,match_id,description) values ($1,$2,$3,'worried')`, [U.m1, kid.c1, MID]));
ok("mentor can raise a concern about their own mentee", !r.err, r.err);
r = await as("m1", () => tryq(`insert into public.safeguarding_concerns (raised_by,beneficiary_id,description) values ($1,$2,'about someone else')`, [U.m1, kid.c2]));
ok("...but not about a child they don't mentor", !!r.err);
r = await as("m1", () => tryq(`insert into public.safeguarding_concerns (raised_by,beneficiary_id,description) values ($1,$2,'impersonating')`, [U.s1, kid.c1]));
ok("raised_by must be the caller", !!r.err);
r = await as("s1", () => tryq(`insert into public.safeguarding_concerns (raised_by,beneficiary_id,description) values ($1,$2,'sponsor worry')`, [U.s1, kid.c1]));
ok("sponsor can raise a concern about their own child", !r.err, r.err);
r = await as("c1", () => tryq(`insert into public.safeguarding_concerns (raised_by,beneficiary_id,description) values ($1,$2,'child account')`, [U.c1, kid.c1]));
ok("child's account can raise a concern about itself", !r.err, r.err);
ok("each user reads only their own concerns", (await as("m1", () => q(`select * from public.safeguarding_concerns`))).length === 1 && (await as("s2", () => q(`select * from public.safeguarding_concerns`))).length === 0);
ok("admin reads all concerns", (await as("admin", () => q(`select * from public.safeguarding_concerns`))).length === 3);
await as("m1", () => tryq(`update public.safeguarding_concerns set status='closed'`));
ok("users cannot change concern status", (await q(`select count(*)::int c from public.safeguarding_concerns where status='closed'`))[0].c === 0);

console.log("\n== misc ==");
ok("mentorship_messages is in the realtime publication", (await q(`select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='mentorship_messages'`)).length === 1);
const pol = await q(`select policyname from pg_policies where tablename='beneficiaries' order by 1`);
ok("beneficiaries keeps only admin + own-record policies", pol.map((p) => p.policyname).join() === "beneficiaries_admin_all,beneficiaries_self_select", pol.map((p) => p.policyname).join());

console.log("\n== 010: vetting checklist + request views ==");
await db.query(`update public.mentors set vetting_checklist = '{"identity":true}' where id=$1`, [mn.m1]);
await as("m1", () => q(`update public.mentors set vetting_checklist = '{"identity":true,"references":true,"background":true,"interview":true}' where id=$1`, [mn.m1]));
const cl1 = (await q(`select vetting_checklist from public.mentors where id=$1`, [mn.m1]))[0].vetting_checklist;
ok("mentor cannot change vetting_checklist", Object.keys(cl1).length === 1 && cl1.identity === true, JSON.stringify(cl1));
await as("admin", () => q(`update public.mentors set vetting_checklist = '{"identity":true,"references":true}' where id=$1`, [mn.m1]));
ok("admin can change vetting_checklist", (await q(`select vetting_checklist->>'references' as r from public.mentors where id=$1`, [mn.m1]))[0].r === "true");

await mkUser("c3", "member");
await db.exec(`update public.profiles set status='active'`);
await db.query(`update public.profiles set role='beneficiary' where id=$1`, [U.c3]);
kid.c3 = (await q(`insert into public.beneficiaries (profile_id, first_name,last_name,date_of_birth,address,guardian_phone,household_income,health_conditions,interests,aspirations,class_level) values ($1,'C3','Hiddenname','2013-02-01','5 Secret St','08077777777','low','allergy','robots','engineer','JSS1') returning id`, [U.c3]))[0].id;
const m3match = (await as("admin", () => q(`insert into public.mentorship_matches (mentor_id, beneficiary_id) values ($1,$2) returning id`, [mn.m2, kid.c3])))[0].id;

const rq = await as("m2", () => q(`select * from public.mentor_requests`));
ok("m2 sees their pending request in mentor_requests", rq.length === 1 && rq[0].first_name === "C3" && rq[0].match_id === m3match, JSON.stringify(rq));
const rqCols = Object.keys(rq[0] ?? {}).sort().join(",");
ok("mentor_requests has only the safe columns", rqCols === "age,aspirations,beneficiary_id,class_level,consent_guardian,consent_mentor,created_at,first_name,interests,match_id", rqCols);
ok("...and no surname/address/guardian/income/health", !/last_name|address|guardian_phone|household|health|email/.test(rqCols));
ok("another mentor sees none of m2's requests", (await as("m1", () => q(`select * from public.mentor_requests`))).length === 0);
ok("a sponsor / member sees no mentor_requests", (await as("s1", () => q(`select * from public.mentor_requests`))).length === 0 && (await as("rando", () => q(`select * from public.mentor_requests`))).length === 0);

const mr = await as("c3", () => q(`select * from public.my_mentor_request`));
ok("child's account sees the mentor who is asking", mr.length === 1 && mr[0].profession === "Engineer" && mr[0].mentor_track === "tech" && mr[0].full_name === "m2", JSON.stringify(mr));
const mrCols = Object.keys(mr[0] ?? {}).sort().join(",");
ok("my_mentor_request exposes name/profession/track only (no contact details)", mrCols === "consent_guardian,consent_mentor,created_at,full_name,match_id,mentor_track,profession" && !/email|phone/.test(mrCols), mrCols);
ok("other children's accounts see no request", (await as("c1", () => q(`select * from public.my_mentor_request`))).length === 0 && (await as("c2", () => q(`select * from public.my_mentor_request`))).length === 0);

await as("m2", () => q(`update public.mentorship_matches set consent_mentor=true where id=$1`, [m3match]));
ok("after mentor accepts, the child's request shows consent_mentor = true", (await as("c3", () => q(`select consent_mentor, consent_guardian from public.my_mentor_request`)))[0]?.consent_mentor === true);
await as("c3", () => q(`update public.mentorship_matches set consent_guardian=true where id=$1`, [m3match]));
ok(
  "after the guardian accepts, the match is ACTIVE and leaves both request views",
  (await q(`select status from public.mentorship_matches where id=$1`, [m3match]))[0].status === "active" &&
    (await as("m2", () => q(`select * from public.mentor_requests`))).length === 0 &&
    (await as("c3", () => q(`select * from public.my_mentor_request`))).length === 0,
);
ok("...and the mentor now sees the child in mentee_profiles", (await as("m2", () => q(`select first_name from public.mentee_profiles`))).map((r) => r.first_name).join() === "C3");

await as("admin", () => q(`update public.mentorship_matches set status='paused' where id=$1`, [m3match]));
const blocked = await as("m2", () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,'mentor','hi')`, [m3match, U.m2]));
ok("pausing blocks messaging at once", !!blocked.err);
await as("admin", () => q(`update public.mentorship_matches set status='terminated', termination_reason='test', ends_at=now() where id=$1`, [m3match]));
ok("terminated match leaves mentee_profiles", (await as("m2", () => q(`select * from public.mentee_profiles`))).length === 0);


console.log("\n== 011: mentoring notes, check-ins ==");
// m1 has the ACTIVE match MID with c1 (back to active earlier). m2 has an ACTIVE match with c3? (it was terminated above) so make a fresh active one for m2.
const c4 = await (async () => {
  await mkUser("c4", "member");
  await db.exec(`update public.profiles set status='active'`);
  await db.query(`update public.profiles set role='beneficiary' where id=$1`, [U.c4]);
  return (await q(`insert into public.beneficiaries (profile_id, first_name,last_name,date_of_birth,address,guardian_phone,household_income,health_conditions,interests,aspirations,class_level) values ($1,'C4','Lastc4','2012-03-01','9 Road','0809','low','none','chess','teacher','JSS3') returning id`, [U.c4]))[0].id;
})();
const m4 = (await as("admin", () => q(`insert into public.mentorship_matches (mentor_id, beneficiary_id) values ($1,$2) returning id`, [mn.m2, c4])))[0].id;
await as("m2", () => q(`update public.mentorship_matches set consent_mentor=true where id=$1`, [m4]));
await as("c4", () => q(`update public.mentorship_matches set consent_guardian=true where id=$1`, [m4]));
ok("setup: m2 now has an active match", (await q(`select status from public.mentorship_matches where id=$1`, [m4]))[0].status === "active");

const addNote = (who, match, text = "Talked about school") =>
  as(who, () => tryq(`insert into public.mentorship_notes (match_id, mentor_id, topics_discussed, check_in_date) values ($1, $2, $3, current_date) returning id`, [match, who === "m1" ? mn.m1 : mn.m2, text]));

let r4 = await addNote("m2", m4);
ok("mentor can add a note to their OWN active match", !r4.err && r4.rows?.length === 1, r4.err);
r4 = await addNote("m1", m4);
ok("a mentor CANNOT add a note to another mentor's match", !!r4.err, "insert succeeded");
r4 = await as("m1", () => tryq(`insert into public.mentorship_notes (match_id, mentor_id, topics_discussed) values ($1, $2, 'sneaky')`, [m4, mn.m2]));
ok("...nor by pretending to be that mentor", !!r4.err);

await as("admin", () => q(`update public.mentorship_matches set status='paused' where id=$1`, [m4]));
r4 = await addNote("m2", m4, "while paused");
ok("a mentor cannot add a note while the match is paused", !!r4.err);
await as("admin", () => q(`update public.mentorship_matches set status='active' where id=$1`, [m4]));

ok("a mentor reads their own notes", (await as("m2", () => q(`select * from public.mentorship_notes`))).length === 1);
ok("another mentor cannot read them", (await as("m1", () => q(`select * from public.mentorship_notes`))).length === 0);
ok("a sponsor / the child cannot read them", (await as("s1", () => q(`select * from public.mentorship_notes`))).length === 0 && (await as("c4", () => q(`select * from public.mentorship_notes`))).length === 0);
ok("admin reads all notes", (await as("admin", () => q(`select * from public.mentorship_notes`))).length === 1);
await as("m2", () => tryq(`update public.mentorship_notes set topics_discussed='edited'`));
ok("notes cannot be edited", (await q(`select count(*)::int c from public.mentorship_notes where topics_discussed='edited'`))[0].c === 0);
await as("m2", () => tryq(`delete from public.mentorship_notes`));
ok("notes cannot be deleted", (await q(`select count(*)::int c from public.mentorship_notes`))[0].c === 1);

// next check-in
await as("m2", () => q(`update public.mentorship_matches set next_check_in = now() + interval '7 days' where id=$1`, [m4]));
ok("mentor can schedule the next check-in on their active match", (await q(`select next_check_in from public.mentorship_matches where id=$1`, [m4]))[0].next_check_in !== null);
const seen = await as("c4", () => q(`select next_check_in from public.mentorship_matches where id=$1`, [m4]));
ok("the child's account can read that check-in date", seen.length === 1 && seen[0].next_check_in !== null);
await as("c4", () => q(`update public.mentorship_matches set next_check_in = null where id=$1`, [m4]));
ok("...but cannot change it", (await q(`select next_check_in from public.mentorship_matches where id=$1`, [m4]))[0].next_check_in !== null);
await as("m1", () => q(`update public.mentorship_matches set next_check_in = now() where id=$1`, [m4]));
ok("another mentor cannot change it", (await q(`select (next_check_in > now() + interval '1 day') as later from public.mentorship_matches where id=$1`, [m4]))[0].later === true);

// concerns raised by a mentor about their mentee
let rc = await as("m2", () => tryq(`insert into public.safeguarding_concerns (raised_by, beneficiary_id, match_id, description) values ($1,$2,$3,'Seemed upset about home') returning id`, [U.m2, c4, m4]));
ok("mentor can raise a concern about their own mentee", !rc.err, rc.err);
rc = await as("m2", () => tryq(`insert into public.safeguarding_concerns (raised_by, beneficiary_id, description) values ($1,$2,'not my mentee')`, [U.m2, kid.c1]));
ok("...but not about a child they don't mentor", !!rc.err);
await as("admin", () => q(`update public.safeguarding_concerns set status='reviewing', handled_by=$1, handled_at=now() where description='Seemed upset about home'`, [U.admin]));
ok("admin can move a concern to reviewing and close it",
  (await q(`select status from public.safeguarding_concerns where description='Seemed upset about home'`))[0].status === "reviewing");
ok("the mentor can read their own concern but not change its status",
  (await as("m2", () => q(`select status from public.safeguarding_concerns`))).length === 1);


console.log("\n== 012: rate limit + held (flagged) messages ==");
// m2 <-> c4 is an ACTIVE match (m4) from the 011 section. Use fresh senders' counts.
const cnt = async (who, match) => (await as(who, () => q(`select count(*)::int c from public.mentorship_messages where match_id=$1`, [match])))[0].c;

// 30 per hour per sender. m2 has already sent nothing in the last hour except via earlier tests (none on m4).
let sent = 0, firstRefusal = null;
for (let i = 1; i <= 31; i++) {
  const r = await as("m2", () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,'mentor',$3)`, [m4, U.m2, `hello ${i}`]));
  if (r.err) { firstRefusal = i; break; }
  sent++;
}
ok("30 messages in an hour are accepted", sent === 30, `accepted ${sent}`);
ok("the 31st message is refused by the database", firstRefusal === 31, `first refusal at ${firstRefusal}`);
const other = await as("c4", () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,'beneficiary','hi back') returning id`, [m4, U.c4]));
ok("the limit is per sender (the other side can still reply)", !other.err, other.err);
for (let i = 0; i < 30; i++) {
  await db.query(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content,created_at) values ($1,$2,'beneficiary',$3, now() - interval '2 hours')`, [m4, U.c4, `old ${i}`]);
}
const again = await as("c4", () => tryq(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,'beneficiary','a new hour')`, [m4, U.c4]));
ok("30 messages sent two hours ago do not count toward the current hour", !again.err, again.err);

// held messages: the CHILD's account sends a phone number to the mentor
await as("c4", () => q(`insert into public.mentorship_messages (match_id,sender_id,sender_type,content) values ($1,$2,'beneficiary','call me on 08123456789')`, [m4, U.c4]));
const held = (await q(`select id, is_flagged from public.mentorship_messages where content='call me on 08123456789'`))[0];
ok("a message with a phone number is flagged by the backstop", held.is_flagged === true);
ok("the RECIPIENT (mentor) cannot see the held message", (await as("m2", () => q(`select id from public.mentorship_messages where id=$1`, [held.id]))).length === 0);
ok("the SENDER can still see their own held message", (await as("c4", () => q(`select id from public.mentorship_messages where id=$1`, [held.id]))).length === 1);
ok("admin can see it", (await as("admin", () => q(`select id from public.mentorship_messages where id=$1`, [held.id]))).length === 1);
ok("the recipient's visible messages do not include it",
  !(await as("m2", () => q(`select content from public.mentorship_messages where match_id=$1`, [m4]))).some((r) => r.content.includes("08123456789")));
await as("m2", () => q(`select public.mark_thread_read($1)`, [m4]));
ok("opening the thread does NOT mark a held message as read", (await q(`select read_at from public.mentorship_messages where id=$1`, [held.id]))[0].read_at === null);
ok("...but does mark the visible messages read",
  (await q(`select count(*)::int c from public.mentorship_messages where match_id=$1 and sender_id=$2 and is_flagged=false and read_at is null`, [m4, U.c4]))[0].c === 0);

// admin reviews and un-flags -> it becomes visible
await as("admin", () => q(`update public.mentorship_messages set is_flagged=false, flag_reason='Reviewed and cleared: a school phone number', flagged_by=$2, flagged_at=now() where id=$1`, [held.id, U.admin]));
ok("after an admin clears it, the recipient can see it", (await as("m2", () => q(`select id from public.mentorship_messages where id=$1`, [held.id]))).length === 1);
await as("admin", () => q(`update public.mentorship_messages set is_flagged=true, flag_reason='Review', flagged_by=$2, flagged_at=now() where id=$1`, [held.id, U.admin]));
ok("a message an admin flags by hand is hidden from the recipient again", (await as("m2", () => q(`select id from public.mentorship_messages where id=$1`, [held.id]))).length === 0);

console.log("== 013: site_settings + append-only audit log ==");
const settingsAnon = async () => {
  await db.exec(`set role anon; select set_config('request.jwt.claim.sub', '', false);`);
  try { return await tryq(`select key, value from public.site_settings`); } finally { await db.exec(`reset role;`); }
};
ok("anon can read the public settings", (await settingsAnon()).rows?.length === 6);
ok("a signed-in non-admin can read public settings", (await as("m2", () => q(`select key from public.site_settings`))).length === 6);
const mw = await as("m2", () => tryq(`update public.site_settings set value='999' where key='bank_account_number' returning key`));
ok("a mentor cannot change a setting", !mw.err && mw.rows.length === 0, JSON.stringify(mw));
const cw = await as("c4", () => tryq(`insert into public.site_settings (key,value) values ('bank_account_number','1')`));
ok("a child cannot insert a setting", !!cw.err);
const aw = await as("admin", () => tryq(`update public.site_settings set value='0123456789', updated_by=$1 where key='bank_account_number' returning value`, [U.admin]));
ok("an admin can change a setting", !aw.err && aw.rows.length === 1);
ok("anon now reads the new bank number", (await settingsAnon()).rows.find((r) => r.key === "bank_account_number")?.value === "0123456789");
const stray = await as("admin", () => tryq(`insert into public.site_settings (key,value) values ('service_role_key','secret')`));
ok("an unknown key (e.g. a secret) is refused by the table", !!stray.err);
await db.exec(`update public.site_settings set is_public=false where key='cac_number'`);
ok("a non-public row is hidden from anon", !(await settingsAnon()).rows.some((r) => r.key === "cac_number"));
await db.exec(`update public.site_settings set is_public=true where key='cac_number'`);

const ins = await as("admin", () => tryq(`insert into public.audit_log (user_id, action, entity_type) values ($1,'t_test','x') returning id`, [U.admin]));
ok("an admin can write an audit row as themselves", !ins.err);
const forged = await as("admin", () => tryq(`insert into public.audit_log (user_id, action) values ($1,'forged')`, [U.m2]));
ok("an admin cannot write an audit row in someone else's name", !!forged.err);
const nonadm = await as("m2", () => tryq(`insert into public.audit_log (user_id, action) values ($1,'sneaky')`, [U.m2]));
ok("a non-admin cannot write an audit row", !!nonadm.err);
ok("a non-admin reads zero audit rows", (await as("m2", () => q(`select id from public.audit_log`))).length === 0);
ok("a child reads zero audit rows", (await as("c4", () => q(`select id from public.audit_log`))).length === 0);
ok("an admin can read audit rows", (await as("admin", () => q(`select id from public.audit_log`))).length >= 1);
const upd = await as("admin", () => tryq(`update public.audit_log set action='edited' returning id`));
ok("an admin cannot edit an audit row", !upd.err && upd.rows.length === 0);
const del = await as("admin", () => tryq(`delete from public.audit_log returning id`));
ok("an admin cannot delete an audit row", !del.err && del.rows.length === 0);
ok("the row is still there, unchanged", (await q(`select count(*)::int c from public.audit_log where action='t_test'`))[0].c === 1);

console.log("== 015: audit fixes + 014 rate limiter ==");
// users from earlier sections: admin, s1, m1, c1 (beneficiary), rando (member)
await db.query(`insert into public.donations (donor_name, amount) values ('Audit donor', 100)`);
await db.query(`insert into public.events (title, minutes) values ('Board meeting', 'PRIVATE MINUTES')`);
await db.query(`insert into public.interventions (beneficiary_id,type,amount,notes) values ($1,'books',10,'STAFF ONLY NOTE')`, [kid.c1]);
ok("active admin reads donations", (await as("admin", () => q(`select id from public.donations`))).length >= 1);
await db.query(`update public.profiles set status='suspended' where id=$1`, [U.admin]);
ok("a SUSPENDED admin reads no donations through the API", (await as("admin", () => q(`select id from public.donations`))).length === 0);
const sw015 = await as("admin", () => tryq(`update public.profiles set status='active' where id=$1 returning id`, [U.admin]));
ok("a suspended admin cannot reactivate themselves", !sw015.err && (await q(`select status from public.profiles where id=$1`, [U.admin]))[0].status === "suspended");
await db.query(`update public.profiles set status='active' where id=$1`, [U.admin]);

await db.query(`update public.profiles set status='pending' where id=$1`, [U.rando]);
await as("rando", () => q(`update public.profiles set role='admin', status='active' where id=$1`, [U.rando]));
const pr015 = (await q(`select role, status from public.profiles where id=$1`, [U.rando]))[0];
ok("a PENDING user cannot promote themselves to admin / activate themselves", pr015.role === "member" && pr015.status === "pending", JSON.stringify(pr015));
ok("a pending user reads no events", (await as("rando", () => q(`select id from public.events`))).length === 0);
await db.query(`update public.profiles set status='active' where id=$1`, [U.rando]);
ok("an active member reads events", (await as("rando", () => q(`select id from public.events`))).length >= 1);
ok("a child's account cannot read events (minutes)", (await as("c1", () => q(`select id from public.events`))).length === 0);
ok("a sponsor cannot read events", (await as("s1", () => q(`select id from public.events`))).length === 0);
ok("a mentor cannot read events", (await as("m1", () => q(`select id from public.events`))).length === 0);

ok("a child cannot read the interventions table", (await as("c1", () => q(`select id from public.interventions`))).length === 0);
const sup015 = await as("c1", () => q(`select * from public.my_support`));
ok("a child reads their support through my_support", sup015.length >= 1);
ok("...and the view has no notes column", !sup015.some((r) => "notes" in r) && !sup015.some((r) => JSON.stringify(r).includes("STAFF ONLY")));

const w1015 = await as("c1", () => tryq(`update public.my_support set type='x'`));
ok("my_support cannot be written to", !!w1015.err);
await db.exec(`set role anon; select set_config('request.jwt.claim.sub','',false);`);
const w2015 = await tryq(`insert into public.public_beneficiaries (id) values (gen_random_uuid())`);
const w3015 = await tryq(`delete from public.public_beneficiaries`);
await db.exec(`reset role;`);
ok("anon cannot insert into / delete from public_beneficiaries", !!w2015.err && !!w3015.err);
const tr015 = await as("c1", () => tryq(`truncate public.donations`));
ok("a signed-in user cannot TRUNCATE a table (it would skip RLS)", !!tr015.err);
const priv015 = await q(`select count(*)::int c from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated') and privilege_type in ('TRUNCATE','TRIGGER','REFERENCES')`);
ok("no anon/authenticated TRUNCATE, TRIGGER or REFERENCES grants remain", priv015[0].c === 0, String(priv015[0].c));
const vw015 = await q(`select count(*)::int c from information_schema.role_table_grants g join pg_views v on v.viewname=g.table_name and v.schemaname='public' where g.grantee in ('anon','authenticated') and g.privilege_type in ('INSERT','UPDATE','DELETE')`);
ok("no anon/authenticated write grants on any view", vw015[0].c === 0, String(vw015[0].c));
const bk015 = await q(`select id, file_size_limit, allowed_mime_types from storage.buckets where id in ('documents','certificates','public-assets')`);
ok("documents/certificates/public-assets now have size and type limits", bk015.length === 3 && bk015.every((b) => Number(b.file_size_limit) === 5242880 && b.allowed_mime_types?.length > 0), JSON.stringify(bk015));

// 014 rate limiter: service-role only, enforces the cap
const rl015 = async (role, key) => {
  await db.exec(role ? `set role ${role};` : ``);
  try { return await tryq(`select public.rate_limit_hit('t', $1, 3, 60) as ok`, [key]); } finally { await db.exec(`reset role;`); }
};
ok("anon cannot call rate_limit_hit", !!(await rl015("anon", "k")).err);
ok("a signed-in user cannot call rate_limit_hit", !!(await rl015("authenticated", "k")).err);
const allowed = [];
for (let i = 0; i < 5; i++) allowed.push((await rl015(null, "same-key")).rows[0].ok);
ok("limiter allows 3 attempts then refuses", allowed.join() === "true,true,true,false,false", allowed.join());
ok("another key is unaffected", (await rl015(null, "other-key")).rows[0].ok === true);
const rd015 = await as("c1", () => tryq(`select * from public.rate_limit_events`));
ok("rate_limit_events is unreadable to signed-in users", !rd015.err && rd015.rows.length === 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
