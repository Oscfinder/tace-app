TACE WELFARE FOUNDATION
tacefoundationinfo@gmail.com  |  RC: IT/9786795


Product Requirements Document
TACE Platform — Digital Ecosystem Specification
Version 1.0 · September 2026
1. Executive Summary


The TACE Welfare Foundation Digital Platform is a web-based ecosystem built to support the foundation's mission of transforming vulnerable children into skilled, self-sufficient young adults. The platform serves five distinct user groups through a unified Next.js application backed by Supabase, deployed on Vercel.
This document defines the complete product requirements — what the platform must do, who it serves, and what success looks like for each stakeholder group.
This PRD is the source of truth for all product decisions. All agents building on this platform should reference this document before making feature or design decisions.
2. Product Vision


To build Africa's most trusted child empowerment digital platform — one that makes it as easy to sponsor a child's education as it is to buy something online, and as rewarding to mentor a young person as it is to invest in their future.
2.1 Mission Alignment
Every feature of this platform must serve one or more of the following foundation objectives:
Keep vulnerable children in school and academically supported
Connect children with professional mentors who guide their development
Enable donors and sponsors to give with confidence and track their impact
Give TACE administrators full operational visibility and control
Document every beneficiary's journey from identification to independence
3. Users & Roles


Role
Access Level
Description
Admin
Full system access
Chairman/founder. Creates and manages all content, users, approvals, and reports. One admin initially.
Member
Member dashboard
Trustees and general members. Same dashboard view. Sees foundation updates, committee activities, impact feed.
Sponsor
Sponsor portal
Sponsors a child. Views their sponsored child's progress, gives donations, receives updates.
Mentor
Mentor dashboard
Matches with a child. Communicates via monitored messaging. Submits monthly progress notes.
Beneficiary
Beneficiary dashboard
Child or guardian. Views their journey, mentor, support history, and progress.

4. Platform Modules


4.1 Public Website (Landing Page)
The public-facing website is the primary entry point for all user types. It must convert visitors into donors, sponsors, mentors, or members within 60 seconds of landing.
Required Sections
Navigation — sticky, transparent on hero, white on scroll, Login + Sponsor a Child CTAs
Hero — fullscreen photo background, bold two-line headline, child search card with filters
Ticker — scrolling registration details and announcements
How It Works — three cards contextualising Sponsor, Donate, and Mentor with naira amounts
Impact Statistics — animated counter numbers on scroll
Empowerment Journey — six-stage visual with clickable steps and accompanying image
Sponsor a Child — three featured beneficiary cards with progress bars and Sponsor buttons
Mentorship Programme — section explaining the programme with mentor profile cards
Stories — editorial three-column layout with real impact stories
Programmes — six programme cards
Donate — contextualised donation amounts and bank transfer details
Get Involved — four cards: Donate, Sponsor, Mentor, Partner
Trust Section — transparency badges, governance facts
Footer — full links, contact, CAC registration, TIN
Required Pages Beyond Landing
/about — founding story, vision, mission, team, governance
/programmes — all six programmes in detail
/sponsor — child search with advanced filters, child profiles
/sponsor/[id] — individual child profile page
/donate — bank transfer details, donation amounts, receipt request form
/mentor — how mentorship works, mentor sign up
/apply — beneficiary application form (10 sections)
/member — member sign up and information
/stories — all impact stories
/contact — contact form and details
4.2 Authentication & Onboarding
Sign Up Flows
Member sign up — /auth/member-signup → pending status → admin approves → active
Sponsor sign up — /auth/sponsor-signup (triggered from sponsor flow) → pending → admin links child → active
Mentor sign up — /auth/mentor-signup → pending → admin matches child → active
Beneficiary — application form submission → admin reviews → admin approves → system creates account → email/SMS with login details
Admin — pre-created directly in Supabase. No public sign up flow
Pending State
Any user with status=pending who logs in sees a friendly holding screen with their name, status, and a message to check their email for approval notification. No dashboard content is accessible until status=active.
4.3 Admin Dashboard
Overview / Home
Summary cards: total beneficiaries, active sponsors, pending applications, total donations received, active mentors, active members
Recent activity feed: new applications, new registrations, new donations, recent messages
Quick actions: Review Applications, Add Announcement, View Reports
Beneficiary Management
Table of all beneficiaries with columns: name, age, stage, sponsor status, mentor status, last update, actions
Filter by: stage, support type, sponsor status, mentor status, location
Beneficiary profile view: full application data, support history, mentor, sponsor, messages, documents, progress notes
Stage management: move beneficiary from one stage to the next with a note
Assign mentor: dropdown of available mentors matched by interests
Upload documents: consent forms, school reports, certificates
Add intervention: log support given — type, amount, date, notes
Applications
Table of all pending applications with: name, age, type, date submitted, status
Full application review view: all 10 form sections displayed clearly
Actions: Approve (creates beneficiary profile), Reject (sends notification), Flag for Follow-up
Approval flow: confirm details, assign initial stage, optionally assign mentor — then one-click create account
Sponsors
Table of all sponsors: name, email, phone, sponsored child, donation history, status
Sponsor profile: personal details, linked beneficiary, all contributions, messages
Link sponsor to beneficiary: dropdown assignment after sponsor registers
One-time donations: visible in finance log even without an account
Members
Table of all members and trustees: name, email, member type, committee, status
Actions: activate, deactivate, change committee, change member type
Announcement broadcast: send message to all active members
Mentors
Table of all mentors: name, profession, matched child, status, last check-in
Match mentor to beneficiary: admin makes the assignment
View all mentorship conversations (read-only admin view)
View monthly progress notes from mentors
Finance & Donations
Log of all donations: donor name/email, amount, date, purpose, receipt sent
Manual donation entry for bank transfers confirmed by email
Project-based donation tracking: donations linked to specific projects
Monthly and annual financial summaries
Projects
Create project: title, description, target amount, start/end date, beneficiaries attached
Publish/unpublish project to public website
View donations per project
Archive completed projects
Content Management
Publish impact stories: title, content, photo, beneficiary link, date
Manage announcements for the member dashboard
Update foundation events
Reports
Impact report: beneficiaries by stage, interventions, outcomes
Financial report: income, expenditure, balance by period
Sponsor report: active sponsors, lapsed sponsors, renewal due
Export any report to PDF or CSV
4.4 Member Dashboard
Home: foundation stats, latest announcement, upcoming events, their committee
Foundation Updates: feed of announcements and news from admin
Impact Feed: stories and milestone updates from beneficiaries (consent-approved)
My Committee: committee name, lead, recent activities, next meeting, monthly update submission form
Events & Meetings: upcoming meetings, confirm attendance, past meeting minutes
Campaigns: active fundraising campaigns with share to social media button
Resources: foundation documents, policies, committee materials
My Profile: name, email, phone, member type (Trustee/Member), trustee role (if applicable), committee, member since, status
4.5 Sponsor Portal
Sign Up Flow
Sponsor visits /sponsor, selects a child, proceeds to sponsor. If one-time: sees bank transfer details + email confirmation step. If long-term: prompted to create account. Account created with status=pending. Admin approves and links child. Sponsor gets email with login details.
Dashboard
My Sponsored Child: photo, name, age, stage in journey, sponsor duration
Progress Updates: admin-posted updates on the child's academic and programme progress
My Contributions: donation history, receipts, total given, next renewal date
Messages: two-way messaging with admin (not direct with child)
Impact Summary: foundation-wide stats showing the broader picture their support is part of
My Profile: personal details, notification preferences, sponsorship type
4.6 Mentor Dashboard
Sign Up Flow
Mentor visits /mentor, reads about programme, clicks Become a Mentor. Fills sign up form: name, email, phone, profession, expertise, availability, preferred age group, motivation. Status=pending. Admin reviews and matches to a child. Mentor and guardian both sign digital consent. Messaging channel opens.
Dashboard
My Mentee: child's name, age, current stage, school, interests, aspirations
Messages: monitored messaging channel with the child/guardian. Admin has read access
Next Check-In: scheduled date and a button to log the check-in
Monthly Progress Note: form to submit monthly update — what was discussed, improvements, concerns
Mentorship Timeline: history of all check-ins and notes
My Profile: personal and professional details, availability, expertise
4.7 Beneficiary Dashboard
Account Creation Flow
Beneficiary submits application form → admin approves → system creates account using application data → email/SMS sent with login link → beneficiary or guardian logs in → sees their full profile already populated.
Dashboard
My Profile: name, photo, age, TACE ID, current stage, member since — warm and encouraging tone
My Journey: visual progress tracker showing all 9 stages, completed stages marked, current stage highlighted
My Support: list of all support received — what was given, when, amount, which project
My Mentor: mentor name, profession, next scheduled check-in, message button
My Sponsor: sponsor's first name only, a message from them if any, thank you message button (moderated by admin)
My Progress: academic reports, training attendance, certificates earned, assignments
Notifications: updates from TACE, mentor messages, milestone congratulations
For beneficiaries under 18: parent/guardian email is the login. Guardian sees all content. As child matures, admin can transfer primary access.
4.8 Beneficiary Application Form
Ten-section form accessible at /apply. Submission data lands in admin dashboard as a new application. No account is created at submission — only after admin approval.
Form Sections
Who is filling this form — Self / Parent/Guardian / Organisation
Child's Personal Information — name, DOB, gender, nationality, state, address, phone, email, photo (required)
Guardian/Parent Information — shown if not self — name, relationship, phone, email, address, occupation
Organisation Information — shown if organisation — org name, contact, role, phone, email, how identified
Educational Background — current status, school details, academic performance, learning difficulties
Family & Household Situation — living situation, siblings, income level, primary challenges (multi-select)
Support Needed — type of support, free text description
Child's Interests & Aspirations — enjoys, wants to become, subjects/skills, talents
Health Information — known conditions, disabilities, current treatment (minimal and sensitive)
Consent & Declaration — five consent checkboxes, typed name signature, date
4.9 Mentorship Messaging System
All mentor-child communication happens inside the TACE platform. WhatsApp is used only as a notification layer — telling users to log in to see new messages.
Three-party channel: Mentor + Child/Guardian + Admin (read-only)
No direct private messaging between mentor and child outside the platform
Consent must be signed by both mentor and guardian before channel opens
Real-time using Supabase Realtime
Message flagging: either party can flag a message as concerning — admin is notified immediately
WhatsApp/email notification: sent when a new message arrives, links to platform login
5. Non-Functional Requirements


5.1 Performance
Page load time under 2 seconds on 3G mobile connection
Lighthouse score minimum 85 on mobile, 95 on desktop
Images served via Next.js Image component with lazy loading and WebP format
5.2 Security
All authentication via Supabase Auth — no custom auth
Row Level Security (RLS) enforced at database level on all tables
Middleware checks role and status before rendering any dashboard page
No beneficiary PII exposed to any user other than admin and their own linked sponsor/mentor
All file uploads stored in private Supabase Storage buckets
5.3 Accessibility
WCAG 2.1 AA compliance minimum
All images have descriptive alt text
All interactive elements keyboard navigable
Minimum 4.5:1 contrast ratio for body text
Mobile-first responsive design — all screens functional at 375px width
5.4 Scalability
Platform designed to support up to 10,000 beneficiaries without architectural changes
Supabase free tier sufficient for Phase 1 — Pro tier recommended from Phase 3
6. Success Metrics


Metric
Target
Measurement
Beneficiary applications received
10 in first 3 months
Admin dashboard count
Active sponsors
5 by end of Phase 2
Sponsor table active count
Active mentors
3 by end of Phase 2
Mentor table active count
Member sign ups
15 by launch
Member table count
Donation conversion rate
5% of landing visitors
Analytics
Mobile traffic
60%+ of all visits
Vercel analytics


TECHNICAL REQUIREMENTS DOCUMENT
TACE Platform — Architecture, Stack & Technical Specifications



1. Technology Stack


Layer
Technology
Justification
Frontend Framework
Next.js 15 (App Router)
Server components, file-based routing, excellent Vercel integration
Language
TypeScript
Type safety, better DX for agents, prevents runtime errors
Styling
Tailwind CSS + shadcn/ui
Rapid UI development, consistent design system, accessible components
Backend
Supabase
Auth, database, storage, realtime, edge functions — all in one
Database
PostgreSQL (via Supabase)
Relational, powerful, RLS support, Supabase managed
Authentication
Supabase Auth
Email/password, magic link, JWT sessions, role management
File Storage
Supabase Storage
Child photos, documents, certificates — private buckets
Realtime
Supabase Realtime
Mentor-child messaging, live dashboard updates
Hosting
Vercel
Next.js native, edge network, preview deployments, analytics
Email
Resend
Transactional emails — approvals, notifications, receipts
SMS Notifications
Termii (Nigerian provider)
WhatsApp/SMS alerts for Nigerian phone numbers
Font
Quicksand + General Sans
TACE brand typography — loaded via Google Fonts
Payment
Bank Transfer (Phase 1), Paystack (Phase 3)
No payment gateway initially — add Paystack when foundation account operational

2. Project Structure


tace-platform/├── app/│   ├── (public)/          # Public pages — no auth required│   │   ├── page.tsx       # Landing page│   │   ├── about/│   │   ├── sponsor/│   │   ├── mentor/│   │   ├── apply/         # Beneficiary application form│   │   ├── donate/│   │   └── stories/│   ├── (auth)/            # Auth pages│   │   ├── login/│   │   ├── signup/│   │   └── pending/       # Holding page for pending users│   └── (dashboard)/       # Protected dashboard pages│       ├── admin/         # Admin only│       ├── member/        # Member + Trustee│       ├── sponsor/       # Sponsor only│       ├── mentor/        # Mentor only│       └── beneficiary/   # Beneficiary only├── components/│   ├── ui/                # shadcn/ui components│   ├── shared/            # Shared across roles│   ├── admin/             # Admin-specific components│   ├── public/            # Landing page sections│   └── forms/             # Application and auth forms├── lib/│   ├── supabase/          # Supabase clients│   ├── utils/             # Utility functions│   └── validations/       # Zod schemas├── middleware.ts           # Auth + role + status checks└── types/                 # TypeScript type definitions
3. Middleware & Route Protection


The middleware.ts file is the single gate for all authenticated routes. It runs on every request before the page renders.
// middleware.ts — simplified logicexport async function middleware(request: NextRequest) {  const { user, profile } = await getSession(request);    // Unauthenticated — redirect to login  if (!user) return redirect('/login');    // Pending — redirect to holding page  if (profile.status === 'pending') return redirect('/pending');    // Wrong dashboard for role — redirect to correct one  const path = request.nextUrl.pathname;  if (path.startsWith('/admin') && profile.role !== 'admin') return redirect('/dashboard');  if (path.startsWith('/sponsor') && profile.role !== 'sponsor') return redirect('/dashboard');  // ... etc}
4. Supabase Configuration


4.1 Auth Settings
Email + Password authentication enabled
Magic link disabled initially — add in Phase 3
Email confirmation required — user must verify email before account is active
JWT expiry: 1 hour access token, 7 days refresh token
Custom claims: role and status stored in JWT via Supabase Auth hook
4.2 Storage Buckets
Bucket
Access
Contents
beneficiary-photos
Private — admin + linked sponsor/mentor
Child profile photos from application form
documents
Private — admin only
Consent forms, school reports, CAC documents
certificates
Private — admin + beneficiary
Training and programme certificates
public-assets
Public
Landing page images, story photos (consent approved)

4.3 Edge Functions
send-approval-email — triggered when admin changes user status to active
send-receipt-email — triggered when admin logs a donation and marks receipt as sent
send-message-notification — triggered on new mentorship message — sends WhatsApp/email notification
create-beneficiary-account — triggered when admin approves a beneficiary application
5. Security Requirements


All RLS policies must be defined before any table is used in production
Service role key must never be exposed to the client — only used in edge functions
All file upload endpoints validate file type (jpg, png, pdf only) and size (5MB max) before storage
Beneficiary photos are served via signed URLs with 1-hour expiry — never public
Admin actions are logged to an audit_log table — who did what, when
All form inputs sanitised and validated with Zod on both client and server
Rate limiting on application form — 3 submissions per IP per 24 hours
6. Environment Variables


# .env.localNEXT_PUBLIC_SUPABASE_URL=NEXT_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_SERVICE_ROLE_KEY=       # Server only — never expose to clientRESEND_API_KEY=TERMII_API_KEY=                  # SMS notificationsNEXT_PUBLIC_SITE_URL=            # https://tacewelfarefoundation.org

APP FLOW DOCUMENT
TACE Platform — Complete User Journey Maps for All Roles



1. Public Visitor Flow


Any unauthenticated visitor arriving at the platform.
Landing → [Browse] → About / Programmes / Stories / Impact → [Choose action] → Sponsor Flow OR Donate Flow OR Apply Flow OR Member Sign Up OR Mentor Sign Up
1.1 Sponsor Flow — One-Time
Visitor lands on /sponsor or clicks Sponsor a Child on landing page
Browses child cards — filters by gender, age, support needed
Clicks a child → /sponsor/[id] — reads child's profile and story
Clicks Sponsor This Child — sees bank transfer details + amount needed
Transfers via bank and emails confirmation to tacefoundationinfo@gmail.com
Admin logs donation in dashboard and sends receipt email
No account created
1.2 Sponsor Flow — Long-Term Account
Same as above through Step 3
Clicks Create Account to Track Your Impact
Fills /auth/sponsor-signup — name, email, phone, password
Account created with status=pending, role=sponsor, linked_child=selected child
Admin receives notification in dashboard — new sponsor registration
Admin reviews, approves, confirms child link
System sends approval email with login link
Sponsor logs in → sees full sponsor portal with child's profile populated
1.3 Member Sign Up Flow
Visitor clicks Become a Member on landing or /member page
/auth/member-signup — name, email, phone, occupation, why joining, committee preference
Account created with status=pending, role=member
Admin notified in dashboard
Admin reviews, assigns member_type (trustee or member), assigns committee
Admin activates — system sends approval email
Member logs in → member dashboard with their committee and updates
1.4 Mentor Sign Up Flow
Visitor clicks Become a Mentor on landing or /mentor page
/auth/mentor-signup — name, email, phone, profession, expertise, availability, preferred age group, motivation
Account created with status=pending, role=mentor
Admin notified in dashboard
Admin reviews applications — matches mentor to suitable child based on child's interests
Admin sends mentor agreement digitally — mentor signs
Admin sends guardian consent form — guardian signs
Both consents confirmed → admin activates mentor account and opens messaging channel
Mentor logs in → sees their mentee's profile and messaging channel open
1.5 Beneficiary Application Flow
Visitor clicks Apply for Support on landing page → /apply
10-section form — guided, step by step — one section per screen
Section 1: who is filling (self / guardian / organisation)
Sections 2–4: child details, guardian details, or organisation details based on selection
Sections 5–9: education, household, support needed, interests, health
Section 10: consent and declaration — must tick all five checkboxes before submit
Form submitted → confirmation screen: Your application has been received. We will contact you within 7 days.
Admin sees new application in Applications table with status=pending
Admin reviews full application → approves or rejects
If approved: admin confirms details, assigns initial stage, optionally assigns mentor → clicks Create Beneficiary Account
System creates account using application email → sends login email/SMS
Beneficiary/guardian logs in → sees full profile already populated from application data
2. Admin Flow


2.1 Daily Admin Routine
Login → Admin home — overview cards and recent activity feed
Check Applications — review any new submissions
Check new Member/Sponsor/Mentor registrations — approve or reject
Check Finance — log any bank transfer confirmations received by email
Check Mentorship — view any flagged messages
Post any announcements or updates for member dashboard
2.2 Approving a Beneficiary Application
Applications table → click pending application
Review all 10 sections in the full application view
If approving: click Approve → modal: confirm initial stage + optionally assign mentor
Click Create Account → system creates beneficiary user account
System sends login email/SMS to beneficiary/guardian
Application moves to Approved — beneficiary appears in Beneficiary Management
2.3 Creating a Project
Projects → New Project
Fill: title, description, target amount, start date, end date
Attach approved beneficiaries to the project — multi-select from beneficiary list
Each attached beneficiary gets a tag: support type, amount needed
Save as Draft → preview on public site → Publish
Published project appears on landing page Sponsor a Child section
3. Mentor-Child Messaging Flow


Admin matches mentor to child in admin dashboard
System sends digital consent form to guardian email
System sends mentor agreement to mentor email
Both parties sign — system records consent_guardian=true and consent_mentor=true
Messaging channel status changes from locked to open
Mentor logs in → messaging panel available in their dashboard
Child/guardian logs in → messaging panel shows mentor's name and an open channel
All messages stored in mentorship_messages table
Admin can view any conversation from admin dashboard in read-only mode
Either party can click Flag Message → admin receives immediate notification
WhatsApp/email notification sent to recipient whenever a new message arrives
Mentor submits monthly progress note through their dashboard → stored in mentorship_notes

BACKEND SCHEMA DOCUMENT
TACE Platform — Supabase PostgreSQL Database Design



1. Schema Overview


All tables live in the public schema. Row Level Security is enabled on every table. The auth.users table is managed by Supabase Auth — the profiles table extends it with TACE-specific fields.
Table
Purpose
profiles
Extends auth.users — stores role, status, member_type, committee
beneficiaries
Full beneficiary profile — created from approved application
applications
Raw beneficiary application form submissions
mentors
Mentor profile — profession, expertise, availability, matched child
mentorship_matches
Links mentor to beneficiary — tracks consent and status
mentorship_messages
All messages between mentor and child/guardian
mentorship_notes
Monthly progress notes from mentors
sponsors
Sponsor profile — linked to beneficiary, donation history
donations
All donations — linked to sponsor and/or project
projects
Fundraising/programme projects — contain attached beneficiaries
project_beneficiaries
Junction table — links beneficiaries to projects
interventions
Support given to a beneficiary — amount, type, date, notes
progress_updates
Admin-posted updates on a beneficiary's progress
announcements
Admin announcements shown on member dashboard
stories
Impact stories published on the public website
events
Foundation events and meetings
audit_log
All admin actions — who did what, when

2. Table Definitions


profiles
create table profiles (  id            uuid references auth.users(id) on delete cascade primary key,  full_name     text not null,  email         text not null,  phone         text,  role          text not null check (role in ('admin','member','sponsor','mentor','beneficiary')),  status        text not null default 'pending' check (status in ('pending','active','inactive','suspended')),  member_type   text check (member_type in ('trustee','member')),  -- members only  trustee_role  text,  -- e.g. 'Chairman', 'Secretary' — trustees only  committee     text,  -- committee assignment — members only  avatar_url    text,  created_at    timestamptz default now(),  updated_at    timestamptz default now());-- RLSalter table profiles enable row level security;create policy "Users can view own profile" on profiles for select using (auth.uid() = id);create policy "Admin can view all profiles" on profiles for select using (get_role() = 'admin');create policy "Admin can update all profiles" on profiles for update using (get_role() = 'admin');
beneficiaries
create table beneficiaries (  id              uuid default gen_random_uuid() primary key,  profile_id      uuid references profiles(id),  -- null until account created  application_id  uuid references applications(id),  tace_id         text unique,  -- e.g. TACE-2026-001  first_name      text not null,  last_name       text not null,  date_of_birth   date not null,  gender          text check (gender in ('male','female','other')),  state_of_origin text,  address         text,  phone           text,  email           text,  photo_url       text,  -- signed URL from private storage bucket  -- Guardian  guardian_name   text,  guardian_rel    text,  guardian_phone  text,  guardian_email  text,  -- Education  edu_status      text check (edu_status in ('in_school','out_of_school','never_attended')),  school_name     text,  class_level     text,  -- Situation  living_situation text,  household_income text,  challenges      text[],  -- array of challenge tags  -- Support  support_needed  text[],  support_description text,  -- Aspirations  interests       text,  aspirations     text,  talents         text,  -- Health  health_conditions text,  disabilities    text,  -- Stage  current_stage   text default 'identified' check (current_stage in (    'identified','assessed','education_support','vocational_training',    'certification','apprenticeship','savings','employment','business_owner'  )),  stage_updated_at timestamptz,  -- Relationships  mentor_id       uuid references mentors(id),  sponsor_id      uuid references sponsors(id),  -- Meta  status          text default 'active' check (status in ('active','inactive','graduated','lost_contact')),  created_at      timestamptz default now(),  updated_at      timestamptz default now());-- RLSalter table beneficiaries enable row level security;create policy "Admin full access" on beneficiaries for all using (get_role() = 'admin');create policy "Sponsor sees linked child" on beneficiaries for select using (  get_role() = 'sponsor' and sponsor_id = get_sponsor_id());create policy "Mentor sees linked child" on beneficiaries for select using (  get_role() = 'mentor' and mentor_id = get_mentor_id());create policy "Beneficiary sees own record" on beneficiaries for select using (  profile_id = auth.uid());
applications
create table applications (  id              uuid default gen_random_uuid() primary key,  applicant_type  text check (applicant_type in ('self','guardian','organisation')),  -- Child  child_first_name text not null,  child_last_name  text not null,  child_dob        date not null,  child_gender     text,  child_nationality text,  child_state      text,  child_address    text,  child_phone      text,  child_email      text,  child_photo_url  text,  -- Guardian (if applicable)  guardian_name    text,  guardian_relationship text,  guardian_phone   text,  guardian_email   text,  guardian_address text,  guardian_occupation text,  -- Organisation (if applicable)  org_name         text,  org_contact_name text,  org_contact_role text,  org_phone        text,  org_email        text,  org_identification text,  -- Education  edu_status       text,  school_name      text,  class_level      text,  school_address   text,  academic_performance text,  learning_difficulties text,  -- Household  living_situation text,  siblings_count   int,  household_income text,  challenges       text[],  -- Support  support_types    text[],  support_description text,  -- Aspirations  interests        text,  aspirations      text,  subjects_skills  text,  talents          text,  -- Health  health_conditions text,  disabilities     text,  current_treatment text,  -- Consent  consent_information boolean default false,  consent_contact     boolean default false,  consent_assessment  boolean default false,  consent_no_guarantee boolean default false,  consent_photography  boolean default false,  declarant_name      text,  declared_at         timestamptz,  -- Status  status           text default 'pending' check (status in ('pending','approved','rejected','flagged')),  admin_notes      text,  reviewed_by      uuid references profiles(id),  reviewed_at      timestamptz,  created_at       timestamptz default now());-- RLS: only admin can read applicationsalter table applications enable row level security;create policy "Admin only" on applications for all using (get_role() = 'admin');create policy "Public insert" on applications for insert with check (true);
mentorship_matches
create table mentorship_matches (  id                    uuid default gen_random_uuid() primary key,  mentor_id             uuid references mentors(id) not null,  beneficiary_id        uuid references beneficiaries(id) not null,  status                text default 'pending_consent' check (status in (    'pending_consent','active','paused','completed','terminated'  )),  consent_mentor        boolean default false,  consent_guardian      boolean default false,  consent_mentor_at     timestamptz,  consent_guardian_at   timestamptz,  started_at            timestamptz,  ends_at               timestamptz,  termination_reason    text,  created_at            timestamptz default now());alter table mentorship_matches enable row level security;create policy "Admin full access" on mentorship_matches for all using (get_role() = 'admin');create policy "Mentor sees own match" on mentorship_matches for select using (  mentor_id = get_mentor_id());
mentorship_messages
create table mentorship_messages (  id            uuid default gen_random_uuid() primary key,  match_id      uuid references mentorship_matches(id) not null,  sender_id     uuid references profiles(id) not null,  sender_type   text check (sender_type in ('mentor','beneficiary','guardian','admin')),  content       text not null,  is_flagged    boolean default false,  flag_reason   text,  flagged_by    uuid references profiles(id),  flagged_at    timestamptz,  read_at       timestamptz,  created_at    timestamptz default now());alter table mentorship_messages enable row level security;create policy "Admin can read all" on mentorship_messages for select using (get_role() = 'admin');create policy "Mentor can read/write own match" on mentorship_messages for all using (  get_role() = 'mentor' and match_id in (    select id from mentorship_matches where mentor_id = get_mentor_id()  ));create policy "Beneficiary/guardian can read/write own match" on mentorship_messages for all using (  match_id in (    select mm.id from mentorship_matches mm    join beneficiaries b on b.id = mm.beneficiary_id    where b.profile_id = auth.uid()  ));
donations
create table donations (  id            uuid default gen_random_uuid() primary key,  donor_name    text not null,  donor_email   text,  donor_phone   text,  sponsor_id    uuid references sponsors(id),  -- null for one-time donors  project_id    uuid references projects(id),  beneficiary_id uuid references beneficiaries(id),  amount        numeric(12,2) not null,  currency      text default 'NGN',  purpose       text,  bank_ref      text,  -- bank transfer reference  receipt_sent  boolean default false,  receipt_sent_at timestamptz,  notes         text,  logged_by     uuid references profiles(id),  -- admin who logged it  created_at    timestamptz default now());alter table donations enable row level security;create policy "Admin full access" on donations for all using (get_role() = 'admin');create policy "Sponsor sees own donations" on donations for select using (  get_role() = 'sponsor' and sponsor_id = get_sponsor_id());
Helper Functions
-- Get current user rolecreate or replace function get_role() returns text as $$  select role from profiles where id = auth.uid();$$ language sql security definer;-- Get current mentor idcreate or replace function get_mentor_id() returns uuid as $$  select id from mentors where profile_id = auth.uid();$$ language sql security definer;-- Get current sponsor idcreate or replace function get_sponsor_id() returns uuid as $$  select id from sponsors where profile_id = auth.uid();$$ language sql security definer;-- Auto-generate TACE ID on beneficiary insertcreate or replace function generate_tace_id() returns trigger as $$begin  new.tace_id := 'TACE-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('tace_id_seq')::text, 3, '0');  return new;end;$$ language plpgsql;create trigger set_tace_id before insert on beneficiaries  for each row execute function generate_tace_id();

IMPLEMENTATION PLAN
TACE Platform — Phased Build Plan for Agent-Assisted Development



Overview


The platform is built in five phases over approximately 6 months. Each phase has a clear set of deliverables, a definition of done, and dependencies that must be complete before the next phase begins.
Every phase is broken into tickets assignable to individual agents. Agents should read the PRD and TRD before starting any ticket. The Backend Schema document is the single source of truth for all database work.
Build order rule: Database schema and RLS policies must be set up before any frontend work begins on a feature. Never build a UI that talks to a table that does not yet have RLS policies in place.
Phase
Name
Duration
Deliverable
Phase 1
Foundation Setup
2 weeks
Project, auth, DB schema, public landing page
Phase 2
Admin Dashboard
3 weeks
Full admin panel, application processing, member management
Phase 3
Member & Beneficiary
2 weeks
Member dashboard, beneficiary dashboard, application form
Phase 4
Sponsor & Mentor
3 weeks
Sponsor portal, mentor dashboard, messaging system
Phase 5
Polish & Launch
2 weeks
Performance, accessibility, testing, go live

Phase 1 — Foundation Setup (Weeks 1–2)


1A — Project Initialisation
Create Next.js 15 project with TypeScript and App Router
Install and configure Tailwind CSS and shadcn/ui
Configure Supabase project — create project on supabase.com
Set up environment variables in .env.local and Vercel dashboard
Configure Supabase client — server and browser clients
Set up ESLint, Prettier, and TypeScript strict mode
Create GitHub repository and connect to Vercel for CI/CD
Set up Vercel preview deployments — every PR gets a preview URL
1B — Database Schema
Create all tables in correct dependency order
Create all helper functions (get_role, get_mentor_id, get_sponsor_id)
Create TACE ID sequence and trigger
Enable RLS on all tables
Write and test all RLS policies for every table
Create Supabase Storage buckets with correct access policies
Test RLS with different role contexts
1C — Authentication
Configure Supabase Auth — email/password, email confirmation
Create middleware.ts — role check, status check, route protection
Build /auth/login page with shadcn/ui form
Build /auth/signup base — shared form components
Build /pending page — holding screen for pending users
Set up auth state management with Supabase SSR client
Test all auth flows — login, logout, session refresh
1D — Public Landing Page
Build global layout — fonts, colours, meta tags
Build Nav component — transparent/white on scroll, sticky, mobile hamburger
Build Hero section — full-screen photo, headline, child search card
Build Ticker component — scrolling announcements
Build How It Works section — three cards with donation amounts
Build Impact Stats section — animated counters on scroll
Build Empowerment Journey section — six stages, clickable, with image
Build Sponsor a Child section — three child cards with progress bars
Build Mentorship section — programme overview, mentor cards
Build Stories section — three-column editorial layout
Build Programmes section — six programme cards
Build Donate section — contextualised amounts, bank transfer details
Build Get Involved section — four cards
Build Trust section — transparency badges
Build Footer — full links, contact, registration details
Build Sticky Donate button — appears on scroll
Connect child cards to Supabase — show real approved beneficiaries from projects table
Definition of Done — Phase 1: Landing page is live on Vercel. Authentication works. Database schema is complete with RLS. A test user of each role can log in and see the correct holding or dashboard screen.
Phase 2 — Admin Dashboard (Weeks 3–5)


2A — Admin Layout & Home
Build admin layout — sidebar navigation, header, breadcrumbs
Build admin home — summary cards, recent activity feed, quick actions
Connect summary cards to real Supabase counts
2B — Applications Module
Build applications table — sortable, filterable, paginated
Build application detail view — all 10 form sections displayed
Build approve flow — modal: confirm stage, assign mentor, create account
Build reject flow — modal: reason, send notification email
Build flag for follow-up — adds note and changes status
Edge function: create-beneficiary-account — creates auth user from application data
Edge function: send approval/rejection email via Resend
2C — Beneficiary Management
Build beneficiary table — name, age, stage, sponsor, mentor, status
Build beneficiary profile view — all sections, support history, documents
Build stage management — change stage with note and date
Build mentor assignment — dropdown of available mentors
Build intervention logger — add support given: type, amount, date, notes
Build document uploader — consent forms, reports, certificates to Supabase Storage
2D — Member Management
Build members table — name, email, type, committee, status
Build member activation flow — assign member_type and committee
Build announcement broadcast — send to all active members
2E — Sponsor Management
Build sponsors table — name, email, linked child, donation total, status
Build sponsor activation flow — link sponsor to beneficiary
Build manual donation logger — bank transfer confirmed: log name, amount, date, purpose
Build receipt sender — marks receipt_sent and triggers email
2F — Projects Module
Build project creation form — title, description, target, dates
Build beneficiary attachment — multi-select from beneficiary list
Build project publish/unpublish toggle
Build project detail view — donations, beneficiaries, progress
2G — Content Management
Build story editor — title, content, photo upload, beneficiary link, publish
Build announcements — create, edit, delete, publish to member dashboard
Definition of Done — Phase 2: Admin can receive, review, approve and reject applications. Admin can manage members, sponsors, and projects. All admin views are protected by middleware role check.
Phase 3 — Member & Beneficiary Dashboards (Weeks 6–7)


3A — Member Dashboard
Build member layout — sidebar, header, notification bell
Build member home — stats, latest announcement, upcoming events, committee card
Build Foundation Updates feed — announcements from admin in reverse chronological order
Build Impact Feed — approved stories and beneficiary milestones
Build My Committee section — lead, next meeting, monthly update form
Build Events & Meetings — list, RSVP button, past minutes
Build Campaigns — active projects with progress bar and social share button
Build Resources — downloadable documents from Supabase Storage
Build My Profile — editable profile card with member type and committee display
3B — Beneficiary Application Form
Build multi-step form at /apply — 10 sections, one per screen
Build progress indicator — shows current section and total
Section 1: applicant type selector — drives conditional rendering of sections 2–4
Sections 2–9: build each form section with correct field types and validation
Section 10: consent checkboxes — all five must be ticked before submit is enabled
Build form state management — persist across steps, validate on next
Build confirmation screen — thank you, application reference, what happens next
Connect to Supabase — insert to applications table on submit
Child photo upload — to beneficiary-photos storage bucket
3C — Beneficiary Dashboard
Build beneficiary layout — warm, mobile-first, simple
Build My Profile card — name, photo, TACE ID, stage, member since
Build My Journey — visual 9-stage progress tracker
Build My Support — list of all interventions received
Build My Mentor section — mentor card, next check-in, message button
Build My Sponsor section — sponsor first name, message
Build Notifications — updates and milestone congratulations
Definition of Done — Phase 3: A member can log in and see real data from Supabase. A beneficiary application can be submitted and appears in admin dashboard. An approved beneficiary can log in and see their profile and journey.
Phase 4 — Sponsor & Mentor Modules (Weeks 8–10)


4A — Sponsor Portal
Build sponsor sign up flow — triggered from child card on public site
Build sponsor layout — clean, personal, impact-focused
Build My Sponsored Child — photo, name, age, stage, duration
Build Progress Updates — admin-posted updates in chronological feed
Build My Contributions — donation history table, receipts, total
Build Impact Summary — foundation-wide stats
Build My Profile — editable profile, notification preferences
4B — Mentor Sign Up & Matching
Build mentor sign up form at /mentor — all mentor profile fields
Build mentor profile in admin dashboard — profession, expertise, availability
Build mentor-child matching interface in admin — side-by-side mentor and child profiles
Build digital consent form — mentor agreement, guardian consent — signed online
Build consent tracking in mentorship_matches table
4C — Mentor Dashboard
Build mentor layout — professional, structured
Build My Mentee — child profile card with interests and aspirations
Build messaging panel — real-time with Supabase Realtime
Build Next Check-In — scheduled date, log check-in button
Build Monthly Progress Note form — submit to mentorship_notes table
Build Mentorship Timeline — history of all notes and check-ins
4D — Messaging System
Build messaging UI — message bubbles, timestamps, sender labels
Connect to Supabase Realtime — messages appear instantly
Build message flag button — appears on hover
Build admin read-only message view — in admin dashboard under Mentors
Build flag notification — admin receives alert when message is flagged
Edge function: send-message-notification — WhatsApp/email when new message arrives
Definition of Done — Phase 4: A sponsor can sign up, be linked to a child, and view that child's progress. A mentor can sign up, be matched to a child, and exchange monitored messages on the platform.
Phase 5 — Polish & Launch (Weeks 11–12)


5A — Performance
Audit all images — convert to Next.js Image component with WebP
Implement lazy loading on all below-fold sections
Run Lighthouse on all key pages — target 85+ mobile, 95+ desktop
Optimise Supabase queries — add indexes to frequently queried columns
Implement React Suspense boundaries for all data-fetching components
5B — Accessibility
Audit all interactive elements for keyboard navigation
Add aria-labels to all icon-only buttons
Verify colour contrast on all text elements
Test with screen reader on key user journeys
Ensure all form fields have associated labels
5C — Mobile
Test all pages at 375px, 390px, 428px breakpoints
Ensure all touch targets are minimum 44x44px
Test all forms on mobile — multi-step application form especially
Test messaging panel on mobile
5D — Testing
Write unit tests for all Zod validation schemas
Write integration tests for all auth flows
Write integration tests for RLS policies — verify each role sees only what it should
Manual testing of all five user journeys end to end
Load test the application form — ensure it handles concurrent submissions
5E — Go Live
Configure custom domain on Vercel — tacewelfarefoundation.org
Set up Vercel Analytics
Set up Supabase database backups — daily
Set up error monitoring — Sentry or Vercel error tracking
Remove all test data from database
Seed production database with real approved beneficiaries for public launch
Submit SCUML registration (already done)
Announce on social media and send to all members and trustees
Definition of Done — Phase 5: All five user roles can complete their full journey end to end without errors. Lighthouse scores meet targets. Custom domain is live. Real beneficiary data is in the system.
Agent Assignment Guide


When assigning tickets to agents, follow this guidance:
Agent Focus
Assign These Tickets
Database Agent
Phase 1B (Schema), all RLS policies, helper functions, edge functions, storage buckets
Auth Agent
Phase 1C (Auth), middleware.ts, all sign up flows, pending page, session management
Frontend Agent 1
Phase 1D (Landing page), all public pages (/about, /programmes, /stories, /donate)
Frontend Agent 2
Phase 2A-2G (Admin dashboard) — all admin module UIs
Frontend Agent 3
Phase 3A (Member dashboard), Phase 3B (Application form), Phase 3C (Beneficiary dashboard)
Frontend Agent 4
Phase 4A (Sponsor portal), Phase 4B-4C (Mentor dashboard), Phase 4D (Messaging)
QA Agent
Phase 5C-5D (Mobile testing, accessibility, integration tests)
DevOps Agent
Phase 1A (Project setup), Phase 5E (Go live, domain, monitoring, backups)


TACE Welfare Foundation  |  RC: IT/9786795  |  tacefoundationinfo@gmail.com
"Guiding Children Toward Independence"
