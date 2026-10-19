TACE Platform — Phase 2 Agent Prompts
How to Use These Prompts
Each prompt below is a self-contained brief for one AI agent working on one ticket. Copy the entire prompt and paste it into your agent session. Phase 1 (project setup, database schema, authentication, landing page) is complete — these tickets build on that foundation.
Build Order
1. 2A — Admin Layout & Home
2. 2B — Applications Module
3. 2C — Beneficiary Management
4. 2D — Member Management
5. 2E — Sponsor Management
6. 2F — Projects Module
7. 2G — Content Management
Repo Conventions (confirmed from Phase 1)
• No src/ directory — app/, components/, lib/, types/ all sit at the project root
• Next.js 16 — root middleware file is proxy.ts, with export async function proxy(...)
• All protected dashboards live under app/dashboard/{role}/ — NOT app/admin/... — fixed in Phase 1 to resolve a route collision with public pages at /sponsor, /mentor, /member
• shadcn/ui uses Field, not Form
• lib/utils.ts exports cn
• The beneficiaries table has no anon/public read access; a public_beneficiaries view exists separately for the landing page. This Phase 2 admin dashboard reads/writes the real beneficiaries table directly — correct, since admin has full access
• mentors table has a mentor_track column (career or tech)
• TypeScript strict mode, Server Components by default, Zod validation, @supabase/ssr for sessions
Review Workflow
After each agent completes a ticket, Simon reviews output and flags issues before the next ticket begins.
Ticket 2A — Admin Layout & Home
Copy everything below this line and paste into your agent.
ROLE: You are a Frontend Agent building the admin dashboard shell and home page for the TACE Welfare Foundation platform.
CONTEXT: TACE is a Nigerian children's welfare nonprofit. The admin (Osime, the Chairman) is the only admin user initially. This ticket builds the layout every other admin ticket (2B–2G) will nest inside, plus the admin home/overview page.
PREREQUISITES (already completed in Phase 1):
• Next.js 16 project, no src/ directory — app/, components/, lib/, types/ at project root
• Supabase database with all 17 tables, RLS policies, helper functions (get_role(), get_mentor_id(), get_sponsor_id())
• Authentication system with proxy.ts route protection — dashboards live at app/dashboard/{role}/
• Supabase clients at lib/supabase/ already configured
TECH STACK:
• Next.js 16 App Router — Server Components by default
• shadcn/ui components (Sidebar, Sheet, Avatar, Badge, Breadcrumb, Card, Table)
• Tailwind CSS with TACE brand colours (tace-blue: #29ABE2, tace-yellow: #F7C100, tace-navy: #1A1A2E, tace-red: #ED1C24, tace-green: #27AE60, tace-gray: #6B7280, tace-lgray: #F4F6F8)
• Supabase for live data counts
YOUR DELIVERABLES:
1. Admin Layout (app/dashboard/admin/layout.tsx)
• Protected by existing proxy.ts — do not duplicate auth checks here, the proxy already guarantees role=admin and status=active before this renders
• Persistent left sidebar (collapsible on mobile via Sheet): TACE logo, nav links to Home, Applications, Beneficiaries, Members, Sponsors, Mentors, Finance & Donations, Projects, Content, Reports, Settings
• Active nav item highlighted (tace-blue)
• Top header bar: breadcrumb trail (updates per page), admin avatar + name on the right, dropdown with Sign Out
• Mobile: sidebar collapses to a hamburger-triggered Sheet
2. Admin Home (app/dashboard/admin/page.tsx)
• Server Component, fetches real counts directly from Supabase (admin has full RLS access to every table)
• Summary cards (grid, 6 cards): Total Beneficiaries, Active Sponsors, Pending Applications, Total Donations Received (sum from donations table), Active Mentors, Active Members
• Each card: icon, large number, label, subtle colour accent per category
• Recent Activity feed below the cards: last 10 events across new applications, new registrations (any role, status=pending), new donations, recent mentorship messages — query each source and merge by created_at descending
• Quick Actions row: three buttons — "Review Applications" (links to /dashboard/admin/applications), "Add Announcement" (links to /dashboard/admin/content), "View Reports" (links to /dashboard/admin/reports)
3. Shared Admin Components (components/admin/)
• DataTable — reusable sortable/filterable/paginated table wrapper (used by every subsequent 2B–2G ticket) — built on shadcn/ui Table, accepts columns + data + optional filter config
• StatCard — the summary card used on the home page, reusable wherever else a count needs displaying
• AdminBreadcrumb — breadcrumb component driven by the current route segments
ACCEPTANCE CRITERIA:
[ ] Admin layout renders with sidebar and header on all /dashboard/admin/* routes
[ ] Sidebar collapses correctly on mobile (375px width)
[ ] All summary cards show real counts from Supabase, not placeholder numbers
[ ] Recent Activity feed shows real merged events in correct chronological order
[ ] Quick action buttons link to the correct (not-yet-built) routes — these routes can 404 for now, that's expected until 2B–2G are built
[ ] DataTable component is generic enough to be reused without modification in Tickets 2B–2G
[ ] Sign out works and clears the session
[ ] No TypeScript errors, clean build
DO NOT:
• Do not build the Applications, Beneficiaries, Members, Sponsors, Mentors, Finance, Projects, Content, or Reports pages themselves — only stub routes/links are needed; those are Tickets 2B–2G
• Do not duplicate role/status checks — proxy.ts already handles this
• Do not query the beneficiaries table expecting anon-safe data — this is the real table, admin has full access, that's correct here
Ticket 2B — Applications Module
Copy everything below this line and paste into your agent.
ROLE: You are a Frontend + Backend Agent building the beneficiary application review and approval system for the TACE Welfare Foundation admin dashboard.
CONTEXT: The public /apply form (built in Phase 3, not yet live) will insert rows into the applications table. For now, assume test data exists or seed a few test rows manually in Supabase for development. Approving an application creates a real beneficiaries row and a Supabase Auth account — this is the single most consequential admin action in the platform, since it onboards a real child.
PREREQUISITES (already completed):
• Admin layout and DataTable component from Ticket 2A
• applications table (admin-only RLS, public insert) and beneficiaries table (admin full access) exist per the Backend Schema
• handle_new_user() trigger auto-creates a profiles row when a Supabase Auth user is created
YOUR DELIVERABLES:
1. Applications Table (app/dashboard/admin/applications/page.tsx)
• Uses the shared DataTable component
• Columns: child name (first + last), age (computed from child_dob), applicant type, date submitted, status (badge: pending=yellow, approved=green, rejected=red, flagged=orange)
• Sortable by date submitted, filterable by status and applicant type
• Row click → navigates to application detail view
2. Application Detail View (app/dashboard/admin/applications/[id]/page.tsx)
• Displays all 10 form sections clearly, grouped under headers matching the original form: Who's Applying, Child's Personal Info, Guardian Info (if applicable), Organisation Info (if applicable), Educational Background, Family & Household, Support Needed, Interests & Aspirations, Health Information, Consent & Declaration
• Conditionally render Guardian or Organisation sections based on applicant_type — don't show both
• Consent section shows each of the 5 checkboxes as confirmed/not confirmed, declarant name, declared_at timestamp
• Admin notes field — free text, saved on blur or via explicit save button
• Three action buttons at the top: Approve, Reject, Flag for Follow-up (only enabled while status=pending)
3. Approve Flow
• Clicking Approve opens a modal: confirm/edit initial current_stage (default 'identified'), optional mentor assignment dropdown (query mentors where there's no active mentorship_match, or simply list all for now since mentor-matching UI is built properly in Phase 4)
• On confirm, a Server Action must, in this order: (1) create a Supabase Auth user via the admin/service-role client using the application's guardian_email (or child_email if applicant_type='self' and the child is old enough) as the login email, (2) insert a new beneficiaries row copying over all matching fields from the applications row, setting application_id to link back, (3) update the applications row to status='approved', reviewed_by=current admin id, reviewed_at=now()
• The profiles row is auto-created by the existing handle_new_user() trigger once step 1 creates the Auth user — do not insert into profiles manually
• Send an approval email via Resend with a login link (stub the actual Resend call if an API key isn't configured yet — log what would be sent)
• On success, redirect back to the applications table with a success toast
4. Reject Flow
• Clicking Reject opens a modal: reason (free text, required)
• On confirm: update applications.status='rejected', admin_notes=reason, reviewed_by, reviewed_at
• Send a polite rejection notification email via Resend (stub if no API key)
5. Flag for Follow-up
• Single action, no modal needed beyond an optional note
• Sets applications.status='flagged', appends to admin_notes
ACCEPTANCE CRITERIA:
[ ] Applications table loads real data from Supabase, sortable and filterable
[ ] Detail view correctly shows/hides Guardian vs Organisation sections based on applicant_type
[ ] Approve flow successfully creates an Auth user, a beneficiaries row, and updates the application — test this against the real Supabase project, not just a build check
[ ] A newly approved beneficiary's tace_id auto-generates correctly (e.g. TACE-2026-001) via the existing trigger
[ ] Reject flow updates status and notes correctly
[ ] Flag flow updates status correctly
[ ] All three actions are disabled/hidden once an application is no longer pending
[ ] No service-role key is ever sent to the client — the Auth-user-creation step runs in a Server Action, never client-side
DO NOT:
• Do not build the public /apply form — that's Phase 3, Ticket 3B
• Do not build real mentor-matching logic (interest-based suggestions) — a simple dropdown of all mentors is sufficient for now; proper matching is Phase 4
• Do not expose the service-role client to any client component
• Do not skip the admin-only RLS check on applications — it already exists from Phase 1B, just don't bypass it client-side
Ticket 2C — Beneficiary Management
Copy everything below this line and paste into your agent.
ROLE: You are a Frontend + Backend Agent building the full beneficiary record management system for the TACE Welfare Foundation admin dashboard.
CONTEXT: This is the admin-facing view of every approved beneficiary (child) in the system, created via Ticket 2B's approval flow. The beneficiaries table holds sensitive child PII — this ticket works with the real table directly (admin has full RLS access), not the public-safe public_beneficiaries view used on the landing page. Keep that distinction in mind: nothing built here should ever be reused on an unauthenticated page.
PREREQUISITES (already completed):
• Admin layout and DataTable from Ticket 2A
• Applications module from Ticket 2B (beneficiaries are created there)
• beneficiaries, mentors, sponsors, interventions, mentorship_matches tables exist
• beneficiary-photos, documents, certificates private storage buckets exist — objects must be uploaded at the path {beneficiary_id}/filename.ext (this convention is required for the existing RLS storage policies to match correctly)
YOUR DELIVERABLES:
1. Beneficiary Table (app/dashboard/admin/beneficiaries/page.tsx)
• DataTable with columns: photo (signed URL thumbnail), name, age, current_stage (badge), sponsor status (Sponsored/Unsponsored), mentor status (Matched/Unmatched), last updated
• Filters: current_stage, support_needed, sponsor status, mentor status, state_of_origin
2. Beneficiary Profile View (app/dashboard/admin/beneficiaries/[id]/page.tsx)
• Full application data display (reuse the same section layout from Ticket 2B's application detail view where possible)
• Support history: all rows from interventions for this beneficiary, chronological
• Linked mentor card (if mentor_id set): name, profession, link to mentor profile
• Linked sponsor card (if sponsor_id set): name, link to sponsor profile
• Messages: read-only preview of recent mentorship_messages if a mentorship_match exists (full admin message view is more fully built in Phase 4, Ticket 4D — a simple recent-messages list here is enough for now)
• Documents section: list of uploaded files from the documents and certificates buckets for this beneficiary, with download links (signed URLs)
• Photo: display from beneficiary-photos bucket via signed URL (1-hour expiry, regenerate on each page load — never store a permanent public URL)
3. Stage Management
• A "Move Stage" button/dropdown showing the 9 stages in order (identified → assessed → education_support → vocational_training → certification → apprenticeship → savings → employment → business_owner)
• Requires a short note on stage change — store the note in a new progress_updates row (title e.g. "Stage updated to X", content=note, posted_by=admin), and update beneficiaries.current_stage and stage_updated_at
4. Mentor Assignment
• Dropdown of available mentors (status=active, optionally filter by mentor_track matching the beneficiary's interests if that data is available)
• Assigning a mentor here creates a mentorship_matches row with status='pending_consent' — it does NOT immediately set beneficiaries.mentor_id; that only happens once consent flow completes (built properly in Phase 4). For this ticket, it's enough to create the pending match and show its status on the beneficiary profile
5. Intervention Logger
• Form: type (free text or small fixed list: Educational, Vocational, Financial, Medical, Other), amount (numeric, optional), description, date
• Inserts into interventions table with given_by=admin, given_at=the date
6. Document Uploader
• File upload component (consent forms, school reports → documents bucket; certificates → certificates bucket)
• MUST upload to path {beneficiary_id}/filename.ext inside the bucket — this is the convention the storage RLS policies rely on
• Validate file type (jpg, png, pdf only) and size (5MB max) client-side before upload, and ideally also server-side
ACCEPTANCE CRITERIA:
[ ] Beneficiary table loads and filters correctly against real Supabase data
[ ] Profile view correctly displays photo via signed URL, not a public URL
[ ] Stage change updates current_stage, stage_updated_at, and creates a progress_updates row
[ ] Mentor assignment creates a mentorship_matches row with status=pending_consent, does not set beneficiaries.mentor_id directly
[ ] Intervention logger correctly inserts rows visible immediately in the support history list
[ ] Document uploads land at {beneficiary_id}/filename.ext and are retrievable via signed URL afterward
[ ] No PII from this page ever queries or references the public_beneficiaries view — it should only ever touch the real beneficiaries table
DO NOT:
• Do not build the full real-time messaging UI — that's Phase 4, Ticket 4D; a simple read-only recent-messages preview is enough here
• Do not finalise mentor consent flow (digital signatures, guardian consent) — that's Phase 4, Ticket 4B; just create the pending match record
• Do not use the public_beneficiaries view anywhere in this admin-only module
• Do not store any beneficiary photo or document as a permanently public URL
Ticket 2D — Member Management
Copy everything below this line and paste into your agent.
ROLE: You are a Frontend + Backend Agent building member and trustee management for the TACE Welfare Foundation admin dashboard.
CONTEXT: Members and trustees share the same profiles.role='member' value — they're distinguished by member_type ('trustee' or 'member') and, for trustees, trustee_role (e.g. 'Chairman', 'Secretary'). TACE's nine committees are: Education & Programs, Welfare & Care, Finance & Fundraising, Communications & Media, Outreach & Partnerships, Spiritual & Mentorship, Legal & Compliance, Enterprise & Training, Health & Medical Outreach.
PREREQUISITES (already completed):
• Admin layout and DataTable from Ticket 2A
• profiles table with role, status, member_type, trustee_role, committee columns
• Member sign-up flow from Phase 1 Ticket 1C already creates profiles with role='member', status='pending'
• A self-escalation prevention trigger on profiles blocks non-admins from changing their own role/status/member_type/trustee_role/committee — this does not affect admin actions, since admin is exempt from that trigger's restriction
YOUR DELIVERABLES:
1. Members Table (app/dashboard/admin/members/page.tsx)
• DataTable with columns: name, email, member_type (Trustee/Member badge), committee, status
• Filters: member_type, committee, status
2. Member Activation Flow
• Clicking a pending member opens a detail/modal view showing their full sign-up data (occupation, reason for joining, committee preference from signup)
• Admin assigns/confirms: member_type (trustee or member), committee (dropdown of the 9 committees), trustee_role (free text, only shown if member_type='trustee')
• Activate button sets status='active' and sends an approval email via Resend (stub if no API key configured)
• Deactivate button (for already-active members) sets status='inactive'
3. Change Committee / Member Type
• From an active member's detail view, admin can change committee or member_type at any time — simple update, no special flow needed
4. Announcement Broadcast
• A simple form: title, content — inserts into the announcements table (is_published=true, created_by=admin)
• This surfaces on the member dashboard (built in Phase 3) — for this ticket, just confirm the insert works and announcements appear correctly ordered by created_at when queried
ACCEPTANCE CRITERIA:
[ ] Members table loads and filters correctly
[ ] Activating a pending member correctly sets status=active, member_type, committee, and (if trustee) trustee_role
[ ] Deactivating sets status=inactive and that member can no longer access their dashboard (verify this works given the existing proxy.ts logic)
[ ] Changing committee/member_type on an active member works without needing to deactivate first
[ ] Announcement broadcast correctly inserts into the announcements table
[ ] No action here can bypass the self-escalation trigger in a way that would let a non-admin modify their own privileged fields — confirm this is still enforced by testing as admin only grants access through this UI, not by removing the underlying trigger
DO NOT:
• Do not build the member dashboard itself (where members see the announcements and their committee info) — that's Phase 3, Ticket 3A
• Do not remove or weaken the self-escalation trigger from Phase 1B — it should remain exactly as is
• Do not create a public member sign-up flow — that already exists from Phase 1C
Ticket 2E — Sponsor Management
Copy everything below this line and paste into your agent.
ROLE: You are a Frontend + Backend Agent building sponsor and donation management for the TACE Welfare Foundation admin dashboard.
CONTEXT: TACE has two sponsor types: one-time sponsors (bank transfer only, no account) and long-term sponsors (create an account, get a portal in Phase 4). This ticket is admin-side only — the sponsor's own dashboard is Phase 4, Ticket 4A. One-time donations have no associated sponsor account at all, so the donations table supports a null sponsor_id.
PREREQUISITES (already completed):
• Admin layout and DataTable from Ticket 2A
• sponsors, donations tables exist per the Backend Schema
• Sponsor sign-up flow from Phase 1C already creates profiles with role='sponsor', status='pending'
YOUR DELIVERABLES:
1. Sponsors Table (app/dashboard/admin/sponsors/page.tsx)
• DataTable with columns: name, email, phone, linked beneficiary (if any), total donated (sum from donations), status
• Filters: status, sponsorship_type (one_time/long_term)
2. Sponsor Profile View (app/dashboard/admin/sponsors/[id]/page.tsx)
• Personal details, linked beneficiary card, full donation history table
3. Sponsor Activation Flow
• For pending long-term sponsor sign-ups: admin confirms details and links them to a specific beneficiary via a dropdown/search (query beneficiaries where sponsor_id is null, i.e. unsponsored)
• Activate sets status='active' on the sponsor's profile and sets sponsor_id on both the sponsors row and the linked beneficiaries row
• Sends an approval email via Resend (stub if no API key)
4. Manual Donation Logger
• Form: donor_name, donor_email, donor_phone (optional — for one-time donors with no account), sponsor_id (optional, link if this donation is from an existing sponsor), project_id (optional), beneficiary_id (optional), amount, purpose, bank_ref
• This is how admin logs a bank transfer confirmed by email — inserts into donations with logged_by=admin
• If sponsor_id is set, also update sponsors.total_donated (increment)
5. Receipt Sender
• A "Send Receipt" action on any donation row not yet receipted
• Marks receipt_sent=true, receipt_sent_at=now(), triggers a Resend email with the donation details (stub if no API key configured)
ACCEPTANCE CRITERIA:
[ ] Sponsors table loads and filters correctly
[ ] Activating a sponsor correctly links them to an unsponsored beneficiary and updates both rows' sponsor_id
[ ] Manual donation logger correctly handles donations with no sponsor_id (one-time, no account)
[ ] Logging a donation linked to a sponsor correctly increments that sponsor's total_donated
[ ] Receipt sender correctly marks receipt_sent and (when configured) triggers the email
[ ] A beneficiary cannot be linked to two sponsors simultaneously — enforce this in the activation flow's query (only show beneficiaries with sponsor_id is null)
DO NOT:
• Do not build the sponsor's own dashboard/portal — that's Phase 4, Ticket 4A
• Do not integrate Paystack or any payment gateway — Phase 1 and 2 are bank-transfer only; Paystack is Phase 3+ per the PRD
• Do not allow a donation to silently overwrite an existing sponsor-beneficiary link without an explicit admin action
Ticket 2F — Projects Module
Copy everything below this line and paste into your agent.
ROLE: You are a Frontend + Backend Agent building the fundraising/programme projects module for the TACE Welfare Foundation admin dashboard.
CONTEXT: A "project" groups one or more beneficiaries under a fundraising campaign (e.g. "Back to School 2027"). Published projects appear on the public landing page's Sponsor a Child section via the public_beneficiaries view, joined to published projects — so correctly setting is_published here directly affects what appears publicly. Nothing in this ticket touches the public_beneficiaries view itself (that's fixed from Phase 1B) — you're only managing the projects and project_beneficiaries tables that the view and landing page already join against.
PREREQUISITES (already completed):
• Admin layout and DataTable from Ticket 2A
• Beneficiary management from Ticket 2C (projects attach to existing beneficiaries)
• projects and project_beneficiaries tables exist per the Backend Schema
• The public landing page (Phase 1D) already queries published projects joined with public_beneficiaries — this ticket's publish toggle is what makes a project (and its attached beneficiaries) visible there
YOUR DELIVERABLES:
1. Project Creation Form (app/dashboard/admin/projects/new/page.tsx)
• Fields: title, description, target_amount, start_date, end_date
• Saves as status='draft', is_published=false initially
2. Beneficiary Attachment
• Multi-select search/picker from the full beneficiary list (not the public view — admin needs to see all beneficiaries including unpublished ones)
• Each attached beneficiary gets support_type and amount_needed fields (stored in project_beneficiaries junction table)
3. Publish / Unpublish Toggle
• A clear toggle on the project detail view
• Publishing sets is_published=true and status='active' — this is what makes the project (and its attached beneficiaries, via the existing public_beneficiaries view join) appear on the public landing page's Sponsor a Child section
• Unpublishing reverses this — sets is_published=false
• Before allowing publish, warn if any attached beneficiary doesn't have consent_photography=true on their original application (query the linked applications row) — since the public_beneficiaries view already excludes non-consenting children, but it's better UX to flag this to the admin at publish time rather than let them publish a project where some attached children silently don't show up
4. Project Detail View (app/dashboard/admin/projects/[id]/page.tsx)
• Shows title, description, dates, target vs current_amount (sum of linked donations), status, publish state
• List of attached beneficiaries with their support_type/amount_needed
• List of donations linked to this project (donations.project_id)
5. Archive
• A simple action setting status='archived' on completed projects — archived projects should not show on the public site regardless of is_published (add this check if not already implied)
ACCEPTANCE CRITERIA:
[ ] Project creation and beneficiary attachment work correctly against real Supabase data
[ ] Publishing a project makes its attached, consenting beneficiaries appear on the live public landing page's Sponsor a Child section — verify this end to end against the actual public page, not just the admin side
[ ] The consent warning correctly flags beneficiaries without consent_photography before publish
[ ] Unpublishing or archiving correctly removes a project from the public page
[ ] current_amount on the project detail view correctly reflects the real sum of linked donations
DO NOT:
• Do not modify the public_beneficiaries view or its consent-gating logic — that's fixed from Phase 1B and this ticket only manages data that view already joins against correctly
• Do not allow archived projects to appear on the public site under any circumstance
• Do not skip the consent check warning before publish — it's a UX safeguard, not just a nice-to-have, given the sensitivity of child data
Ticket 2G — Content Management
Copy everything below this line and paste into your agent.
ROLE: You are a Frontend + Backend Agent building the impact story and announcement content management system for the TACE Welfare Foundation admin dashboard.
CONTEXT: Published stories appear on the public landing page's Stories section and the full /stories page (both already built in Phase 1D, reading from the stories table where is_published=true). Announcements appear on the member dashboard (Phase 3). This ticket is the admin-side authoring tool for both.
PREREQUISITES (already completed):
• Admin layout and DataTable from Ticket 2A
• stories and announcements tables exist per the Backend Schema
• public-assets public storage bucket exists for story photos (consent-approved)
• The public landing page already queries stories where is_published=true, ordered by published_at descending — this ticket is what populates that data
YOUR DELIVERABLES:
1. Story Editor (app/dashboard/admin/content/stories/page.tsx + [id]/page.tsx for edit)
• List view: table of all stories (published and draft), title, linked beneficiary (if any), publish status, date
• Create/edit form: title, content (rich text or simple textarea is fine for now), photo upload, optional beneficiary_id link (dropdown/search of beneficiaries)
• Photo uploads go to the public-assets bucket (this is a public bucket — only upload here, never upload beneficiary-photos-bucket images here, since those are private and this bucket is public)
• Publish toggle: sets is_published and published_at=now() when turned on
• If a story links to a beneficiary, check that beneficiary's original application has consent_photography=true before allowing publish — same safeguard pattern as Ticket 2F's project publish check
2. Announcements Management (app/dashboard/admin/content/announcements/page.tsx)
• List, create, edit, delete announcements (title, content)
• Publish toggle: is_published, published_at
• These surface on the member dashboard (built in Phase 3) — for this ticket, confirm the CRUD operations work correctly against the announcements table
ACCEPTANCE CRITERIA:
[ ] Story CRUD works correctly, photos upload to the public-assets bucket
[ ] Publishing a story linked to a beneficiary without photography consent is blocked or clearly warned against
[ ] Published stories correctly appear on the live public /stories page and landing page Stories section — verify end to end
[ ] Announcement CRUD works correctly against the announcements table
[ ] Deleting a story or announcement correctly removes it (and, for stories, ideally removes the associated public-assets file, though this can be a soft requirement if storage cleanup isn't trivial)
DO NOT:
• Do not upload beneficiary photos (from the private beneficiary-photos bucket) into the public-assets bucket — these are different sensitivity levels and must stay in their designated buckets
• Do not build the member dashboard's announcement feed display — that's Phase 3, Ticket 3A; this ticket only builds the admin authoring side
• Do not allow publishing a beneficiary-linked story without checking photography consent first