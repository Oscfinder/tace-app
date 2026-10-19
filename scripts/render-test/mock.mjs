// A tiny fake Supabase (auth + PostgREST + storage) so a real `next start`
// server can render authenticated pages locally. It ignores query filters and
// returns a fixed dataset per scenario, which is enough to exercise rendering.
import http from "node:http";

const iso = (d = 0) => new Date(Date.now() + d * 86400000).toISOString();

const SCENARIOS = {
  sponsor: {
    user: { id: "u-sponsor", email: "sponsor@test.dev" },
    tables: {
      profiles: [{ id: "u-sponsor", full_name: "Test Sponsor", email: "sponsor@test.dev", phone: "08011112222", role: "sponsor", status: "active", profile_completed: true }],
      sponsors: [{ id: "sp1" }],
      sponsor_children: [{ id: "c1", first_name: "Ada", age: 11, current_stage: "assessed", stage_updated_at: iso(-3), photo_url: null, support_needed: ["School fees"], interests: "Football and drawing", aspirations: "To be a doctor", class_level: "JSS 2" }],
      progress_updates: [{ id: "p1", beneficiary_id: "c1", title: "Stage updated to Assessed", content: "Ada completed her assessment.", created_at: iso(-3) }],
      sponsor_child_support: [{ beneficiary_id: "c1", type: "school_fees", description: "Term 1 fees", amount: 25000, given_at: iso(-20).slice(0, 10) }],
      sponsor_donations: [
        { id: "d1", amount: 50000, currency: "NGN", purpose: "School fees", receipt_sent: true, receipt_sent_at: iso(-9), created_at: iso(-10) },
        { id: "d2", amount: 20000, currency: "NGN", purpose: null, receipt_sent: false, receipt_sent_at: null, created_at: iso(-2) },
      ],
      thank_you_messages: [{ id: "t1", beneficiary_id: "c1", content: "Thank you for helping me go to school!", status: "approved", created_at: iso(-1) }],
      notifications: [{ id: "n1", profile_id: "u-sponsor", title: "Ada reached a new step", body: "Assessed", type: "stage_change", is_read: false, created_at: iso(-1) }],
    },
  },
  admin: {
    user: { id: "u-admin", email: "admin@test.dev" },
    tables: {
      profiles: [
        { id: "u-admin", full_name: "Admin User", email: "admin@test.dev", phone: "0801", role: "admin", status: "active", profile_completed: true, trustee_role: "Chairman", created_at: iso(-90) },
        { id: "u-m1", full_name: "Mary Mentor", email: "mary@test.dev", phone: "0802", role: "mentor", status: "pending", profile_completed: true, trustee_role: null, created_at: iso(-20) },
      ],
      mentors: [{ id: "m1", profile_id: "u-m1", profession: "Engineer", expertise: "Software", availability: "weekends", mentor_track: "tech", preferred_age_group: "11-14", motivation: "To give back", vetting_status: "pending", vetting_notes: null, vetting_checklist: { identity: true }, vetted_by: null, vetted_at: null, code_of_conduct_accepted_at: null, created_at: iso(-20) }],
      mentorship_matches: [
        { id: "mm1", mentor_id: "m1", beneficiary_id: "c1", status: "pending_consent", consent_mentor: false, consent_guardian: false, started_at: null, created_at: iso(-1) },
        { id: "mm2", mentor_id: "m1", beneficiary_id: "c1", status: "active", consent_mentor: true, consent_guardian: true, started_at: iso(-10), created_at: iso(-12) },
      ],
      beneficiaries: [{ id: "c1", first_name: "Ada", last_name: "Obi", date_of_birth: "2014-05-01", status: "active", current_stage: "assessed", tace_id: "TACE-2026-001", photo_url: null, state_of_origin: "Lagos", application_id: null, mentor_id: null, sponsor_id: null }],
      career_assessments: [], thank_you_messages: [], notifications: [], interventions: [], progress_updates: [],
      sponsors: [{ id: "sp1", profile_id: "u-m1" }],
      applications: [
        { id: "a1", status: "approved", created_at: iso(-40) }, { id: "a2", status: "pending", created_at: iso(-2) }, { id: "a3", status: "rejected", created_at: iso(-70) },
      ],
      donations: [
        { id: "dn1", created_at: iso(-3), donor_name: "=HYPERLINK(\"http://x\")", donor_email: "d@t.dev", sponsor_id: "sp1", project_id: "pr1", beneficiary_id: "c1", amount: 50000, purpose: "School fees", receipt_sent: false },
        { id: "dn2", created_at: iso(-35), donor_name: "Ngozi Eze", donor_email: null, sponsor_id: null, project_id: null, beneficiary_id: null, amount: 12500.5, purpose: null, receipt_sent: true },
      ],
      projects: [{ id: "pr1", title: "School Kits 2026" }],
      site_settings: [{ key: "foundation_name", value: "TACE Welfare Foundation" }, { key: "bank_name", value: "Test Bank" }, { key: "bank_account_name", value: "TACE Welfare Foundation" }, { key: "bank_account_number", value: "0123456789" }, { key: "cac_number", value: "RC123" }, { key: "contact_email", value: "hello@tace.test" }],
      audit_log: [
        { id: "al1", user_id: "u-admin", action: "application_approved", entity_type: "application", entity_id: "a1", details: { stage: "assessed" }, created_at: iso(-1) },
        { id: "al2", user_id: "u-admin", action: "match_paused", entity_type: "mentorship_match", entity_id: "mm2", details: { reason: "review" }, created_at: iso(0) },
      ],
      mentorship_messages: [
        { id: "ms1", match_id: "mm2", sender_id: "u-m1", sender_type: "mentor", content: "Hi Ada, how was school today?", is_flagged: false, flag_reason: null, read_at: iso(-1), created_at: iso(-2) },
        { id: "ms2", match_id: "mm2", sender_id: "u-child", sender_type: "beneficiary", content: "It was fun! We did fractions.", is_flagged: false, flag_reason: null, read_at: null, created_at: iso(-1) },
        { id: "ms3", match_id: "mm2", sender_id: "u-m1", sender_type: "mentor", content: "text me on 08123456789", is_flagged: true, flag_reason: "contact details", read_at: null, created_at: iso(0) },
      ],
      safeguarding_concerns: [{ id: "sc1", raised_by: "u-m1", match_id: "mm1", beneficiary_id: "c1", description: "Ada seemed very upset about things at home.", status: "open", handled_by: null, handled_at: null, created_at: iso(-1) }],
    },
  },
  mentor_new: {
    user: { id: "u-m2", email: "mark@test.dev" },
    tables: {
      profiles: [{ id: "u-m2", full_name: "Mark Mentor", email: "mark@test.dev", role: "mentor", status: "active", profile_completed: true }],
      mentors: [{ id: "m2", profile_id: "u-m2", vetting_status: "cleared", code_of_conduct_accepted_at: null }],
      mentor_requests: [], notifications: [],
    },
  },
  mentor: {
    user: { id: "u-m2", email: "mark@test.dev" },
    tables: {
      profiles: [{ id: "u-m2", full_name: "Mark Mentor", email: "mark@test.dev", phone: "0803", role: "mentor", status: "active", profile_completed: true }],
      mentors: [{ id: "m2", profile_id: "u-m2", vetting_status: "cleared", code_of_conduct_accepted_at: iso(-2), profession: "Engineer", expertise: "Software", availability: "weekends", mentor_track: "tech", preferred_age_group: "11-14", vetted_at: iso(-30) }],
      mentor_requests: [{ match_id: "mm9", beneficiary_id: "c9", first_name: "Zara", age: 11, interests: "Football", aspirations: "Doctor", class_level: "JSS 2", consent_mentor: false, consent_guardian: true, created_at: iso(-1) }],
      mentee_profiles: [{ id: "c1", first_name: "Ada", age: 12, current_stage: "assessed", stage_updated_at: iso(-5), photo_url: null, support_needed: ["Mentorship"], interests: "Football and drawing", aspirations: "To be a doctor", class_level: "JSS 2", edu_status: "in_school", talents: "Singing", subjects_skills: "Maths", match_id: "mm1" }],
      mentorship_matches: [{ id: "mm1", mentor_id: "m2", beneficiary_id: "c1", status: "active", next_check_in: iso(6), started_at: iso(-20) }],
      mentorship_notes: [{ id: "n1", match_id: "mm1", mentor_id: "m2", topics_discussed: "Talked about maths homework", improvements: "More confident", concerns: null, next_steps: "Practise fractions", check_in_date: iso(-7).slice(0, 10), created_at: iso(-7) }],
      career_assessments: [{ id: "ca1", beneficiary_id: "c1", top_clusters: ["analytical", "people"], scores: { analytical: 11, people: 9, builder: 4, creative: 3, business: 2 }, ai_narrative: "Ada loves puzzles and helping others.", recommended_mentor_track: "career", created_at: iso(-10) }],
      mentorship_messages: [
        { id: "ms1", match_id: "mm1", sender_id: "u-m2", sender_type: "mentor", content: "Hi Ada, how was school today?", is_flagged: false, read_at: iso(-1), created_at: iso(-2) },
        { id: "ms2", match_id: "mm1", sender_id: "u-child", sender_type: "beneficiary", content: "It was fun! We did fractions.", is_flagged: false, read_at: null, created_at: iso(-1) },
        { id: "ms3", match_id: "mm1", sender_id: "u-m2", sender_type: "mentor", content: "text me on the number I gave", is_flagged: true, flag_reason: "contact details", read_at: null, created_at: iso(0) },
      ],
      notifications: [],
    },
  },
  child_active: {
    user: { id: "u-child", email: "child@test.dev" },
    tables: {
      profiles: [{ id: "u-child", full_name: "Ada Obi", email: "child@test.dev", role: "beneficiary", status: "active", profile_completed: true }],
      beneficiaries: [{ id: "c1", profile_id: "u-child", first_name: "Ada", tace_id: "TACE-2026-001", current_stage: "assessed", created_at: iso(-30), photo_url: null, date_of_birth: "2014-04-01", sponsor_id: null }],
      my_mentor: [{ full_name: "Mark Mentor", profession: "Engineer", mentor_track: "tech" }],
      mentorship_matches: [{ id: "mm1", status: "active", next_check_in: iso(6) }],
      mentorship_messages: [
        { id: "ms1", match_id: "mm1", sender_id: "u-m2", sender_type: "mentor", content: "Hi Ada, how was school today?", is_flagged: false, read_at: iso(-1), created_at: iso(-2) },
        { id: "ms2", match_id: "mm1", sender_id: "u-child", sender_type: "beneficiary", content: "It was fun! We did fractions.", is_flagged: false, read_at: null, created_at: iso(-1) },
      ],
      my_mentor_request: [], my_sponsor: [], interventions: [], progress_updates: [], thank_you_messages: [], career_assessments: [], notifications: [],
    },
  },
  child_req: {
    user: { id: "u-child", email: "child@test.dev" },
    tables: {
      profiles: [{ id: "u-child", full_name: "Ada Obi", email: "child@test.dev", role: "beneficiary", status: "active", profile_completed: true }],
      beneficiaries: [{ id: "c1", profile_id: "u-child", first_name: "Ada", tace_id: "TACE-2026-001", current_stage: "assessed", created_at: iso(-30), photo_url: null, date_of_birth: "2014-04-01", sponsor_id: null }],
      my_mentor_request: [{ match_id: "mm1", full_name: "Mary Mentor", profession: "Engineer", mentor_track: "tech", consent_mentor: true, consent_guardian: false, created_at: iso(-1) }],
      my_sponsor: [], my_mentor: [], interventions: [], progress_updates: [], thank_you_messages: [], career_assessments: [], notifications: [],
    },
  },
  beneficiary: {
    user: { id: "u-child", email: "child@test.dev" },
    tables: {
      profiles: [{ id: "u-child", full_name: "Ada Obi", email: "child@test.dev", role: "beneficiary", status: "active", profile_completed: true }],
      beneficiaries: [{ id: "c1", profile_id: "u-child", first_name: "Ada", tace_id: "TACE-2026-001", current_stage: "assessed", created_at: iso(-30), photo_url: null, date_of_birth: "2012-04-01", sponsor_id: "sp1" }],
      my_sponsor: [{ first_name: "Sam" }],
      my_mentor: [],
      my_mentor_request: [],
      interventions: [],
      progress_updates: [],
      thank_you_messages: [],
      career_assessments: [],
      notifications: [],
    },
  },
  member: {
    user: { id: "u-member", email: "member@test.dev" },
    tables: {
      profiles: [{ id: "u-member", full_name: "Test Member", email: "member@test.dev", phone: "0801", role: "member", status: "active", profile_completed: true, member_type: "member", committee: "Finance & Fundraising", trustee_role: null, avatar_url: null }],
      active_children_count: [{ total: 3 }],
      announcements: [{ id: "a1", title: "Hello", content: "Welcome members", is_published: true, published_at: iso(-2), created_at: iso(-2) }],
      events: [{ id: "e1", title: "Finance Committee monthly meeting", description: null, location: "Online", event_date: iso(5), event_type: "meeting", committee: "Finance & Fundraising", minutes: null, created_at: iso(-1) }],
      stories: [], committee_lead: [{ full_name: "Chair Person" }], committee_updates: [], event_rsvps: [], projects: [], notifications: [],
    },
  },
};

function decode(token) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  } catch {
    return {};
  }
}

const log = [];
const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const auth = (req.headers.authorization || "").replace("Bearer ", "");
  const scn = SCENARIOS[decode(auth).scn];
  const json = (status, body, headers = {}) => {
    res.writeHead(status, { "content-type": "application/json", ...headers });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === "/__log") return json(200, log);
  if (url.pathname === "/auth/v1/user") {
    if (!scn) return json(401, { message: "no session" });
    return json(200, { ...scn.user, aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: iso(-60) });
  }
  if (url.pathname.startsWith("/auth/v1/token")) return json(400, { error: "mock: refresh not supported" });

  if (url.pathname.startsWith("/rest/v1/")) {
    const name = url.pathname.replace("/rest/v1/", "");
    log.push(`${req.method} ${name}`);
    let rows = scn?.tables[name] ?? [];
    for (const [col, val] of url.searchParams) {
      const eq = /^eq\.(.*)$/.exec(val);
      const inn = /^in\.\((.*)\)$/.exec(val);
      if (eq) rows = rows.filter((r) => String(r[col]) === eq[1]);
      else if (inn) {
        const set = inn[1].split(",").map((v) => v.replace(/^"|"$/g, ""));
        rows = rows.filter((r) => set.includes(String(r[col])));
      }
    }
    if (req.method === "HEAD") {
      return json(200, null, { "content-range": `0-0/${rows.length}` });
    }
    if (req.method !== "GET") return json(201, []);
    const wantsObject = (req.headers.accept || "").includes("vnd.pgrst.object");
    if (wantsObject) {
      if (rows.length === 0) return json(406, { code: "PGRST116", message: "no rows", details: "The result contains 0 rows" });
      return json(200, rows[0]);
    }
    return json(200, rows, { "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}` });
  }
  if (url.pathname.startsWith("/storage/v1/object/list/")) return json(200, []);
  if (url.pathname.startsWith("/storage/")) return json(200, { signedURL: "/object/sign/x?token=t", signedUrl: "http://localhost/x", data: [] });
  json(404, { message: "mock: unknown " + url.pathname });
});

server.listen(54399, () => console.log("mock supabase on :54399"));
