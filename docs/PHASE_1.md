# TACE Platform — Phase 1 Agent Prompts

Sep 19, 2026 · @Someone

## How to Use These Prompts

Each prompt below is a self-contained brief for one AI agent working on one ticket. Copy the entire prompt and paste it into your agent session (Claude, Cursor, Windsurf, etc.). The agent gets all the context it needs — no extra files to attach.

### Build Order

Phase 1 tickets must execute in sequence — each depends on the one before:

1. **1A — Project Initialisation** → repo, dependencies, Supabase clients
2. **1B — Database Schema & RLS** → all tables, functions, policies, storage buckets
3. **1C — Authentication** → login/signup pages, middleware, session management (needs 1A + 1B)
4. **1D — Public Landing Page** → full landing page connected to live Supabase data (needs 1A + 1B + 1C)

### Conventions for All Agents

- TypeScript strict mode — no `any` types, all props typed
- App Router only — no Pages Router patterns
- Server Components by default — `'use client'` only for interactivity
- shadcn/ui for all UI — no other component libraries
- Zod for all validation — client and server
- `@supabase/ssr` for server/browser client creation
- File naming: kebab-case for files, PascalCase for components
- Fonts: Quicksand (headings) + General Sans (body) via Google Fonts
- No placeholder data in production code

### Review Workflow

After each agent completes a ticket, Simon reviews output, flags issues as comments here or in chat, and agent fixes before the next ticket. Each ticket's acceptance criteria must pass before proceeding.

## Ticket 1A — Project Initialisation

**Copy everything below this line and paste into your agent.**

---

**ROLE:** You are a DevOps/Setup Agent building the foundation of the TACE Welfare Foundation digital platform.

**PROJECT CONTEXT:** TACE Welfare Foundation (RC: IT/9786795) is a Nigerian children's welfare nonprofit. You are setting up the Next.js project that will serve as their complete digital platform — public website, authentication, and role-based dashboards for 5 user types (Admin, Member, Sponsor, Mentor, Beneficiary).

**TECH STACK:**

- Next.js 16 with App Router (NOT Pages Router)
- TypeScript in strict mode
- Tailwind CSS v4
- shadcn/ui component library
- Supabase (Auth + PostgreSQL + Storage + Realtime)
- Vercel for hosting
- Resend for transactional email
- Termii for SMS/WhatsApp notifications

**FONTS:**

- Quicksand (Google Fonts) — headings
- General Sans (Fontshare or self-hosted) — body text

**BRAND COLOURS (from TACE brand guide):**

- Primary Blue: #29ABE2
- Accent Yellow: #F7C100
- Navy (dark text/backgrounds): #1A1A2E
- Red (CTAs, donate): #ED1C24
- Green (secondary): #27AE60
- Gray: #6B7280
- Light Gray: #F4F6F8
- White: #FFFFFF

**YOUR DELIVERABLES:**

1. **Create the Next.js project:**

   ```bash
   npx create-next-app@latest tace-platform --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. **Install all dependencies:**

   ```bash
   # Core
   npm install @supabase/supabase-js @supabase/ssr
   
   # UI
   npx shadcn@latest init
   
   # Validation
   npm install zod
   
   # Email & SMS
   npm install resend
   
   # Utilities
   npm install date-fns lucide-react
   
   # Dev
   npm install -D prettier eslint-config-prettier
   ```
3. **Create the complete folder structure:**

   ```
   app/
   │   ├── (public)/              # No auth required
   │   │   ├── page.tsx           # Landing page
   │   │   ├── layout.tsx         # Public layout with nav + footer
   │   │   ├── about/
   │   │   ├── sponsor/
   │   │   │   └── [id]/
   │   │   ├── mentor/
   │   │   ├── apply/
   │   │   ├── donate/
   │   │   ├── stories/
   │   │   ├── programmes/
   │   │   ├── contact/
   │   │   └── member/
   │   ├── (auth)/
   │   │   ├── login/
   │   │   ├── signup/
   │   │   │   ├── member/
   │   │   │   ├── sponsor/
   │   │   │   └── mentor/
   │   │   ├── pending/
   │   │   └── layout.tsx
   │   ├── (dashboard)/
   │   │   ├── admin/
   │   │   ├── member/
   │   │   ├── sponsor/
   │   │   ├── mentor/
   │   │   ├── beneficiary/
   │   │   └── layout.tsx
   │   ├── layout.tsx             # Root layout
   │   ├── globals.css
   │   └── not-found.tsx
   ├── components/
   │   ├── ui/                    # shadcn/ui (auto-generated)
   │   ├── shared/
   │   ├── admin/
   │   ├── public/
   │   └── forms/
   ├── lib/
   │   ├── supabase/
   │   │   ├── client.ts           # Browser client
   │   │   ├── server.ts           # Server client
   │   │   ├── middleware.ts       # Middleware client
   │   │   └── admin.ts            # Service role client (server only)
   │   ├── utils.ts                   # clsx + tailwind-merge utility (shadcn-generated)
   │   └── validations/
   │       └── auth.ts             # Zod schemas for auth forms
   ├── types/
   │   ├── database.ts             # Supabase generated types
   │   ├── roles.ts                # Role and status enums
   │   └── index.ts
   └── proxy.ts                   # Next.js 16 proxy (replaces root middleware.ts)
   ```
4. **Create Supabase client files:**

   `lib/supabase/client.ts` — Browser client:

   ```typescript
   import { createBrowserClient } from '@supabase/ssr'
   import type { Database } from '@/types/database'
   
   export function createClient() {
     return createBrowserClient<Database>(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
     )
   }
   ```

   `lib/supabase/server.ts` — Server client (for Server Components and Server Actions):

   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'
   import type { Database } from '@/types/database'
   
   export async function createClient() {
     const cookieStore = await cookies()
     return createServerClient<Database>(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() { return cookieStore.getAll() },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options)
               )
             } catch { /* called from Server Component */ }
           },
         },
       }
     )
   }
   ```

   `lib/supabase/middleware.ts` — Middleware client:

   ```typescript
   import { createServerClient } from '@supabase/ssr'
   import { NextResponse, type NextRequest } from 'next/server'
   
   export async function updateSession(request: NextRequest) {
     let supabaseResponse = NextResponse.next({ request })
     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() { return request.cookies.getAll() },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value }) =>
               request.cookies.set(name, value)
             )
             supabaseResponse = NextResponse.next({ request })
             cookiesToSet.forEach(({ name, value, options }) =>
               supabaseResponse.cookies.set(name, value, options)
             )
           },
         },
       }
     )
     await supabase.auth.getUser()
     return supabaseResponse
   }
   ```

   `lib/supabase/admin.ts` — Service role client (server-side only, for edge functions and admin operations):

   ```typescript
   import { createClient } from '@supabase/supabase-js'
   import type { Database } from '@/types/database'
   
   export function createAdminClient() {
     return createClient<Database>(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!,
       { auth: { autoRefreshToken: false, persistSession: false } }
     )
   }
   ```
5. **Create the root middleware stub** (`proxy.ts, at the project root — Next.js 16 renames middleware.ts to proxy.ts`):

   ```typescript
   import { type NextRequest } from 'next/server'
   import { updateSession } from '@/lib/supabase/middleware'
   
   export async function proxy(request: NextRequest) {
     return await updateSession(request)
   }
   
   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     ],
   }
   ```
6. **Create the types stubs:**

   `types/roles.ts`:

   ```typescript
   export const ROLES = ['admin', 'member', 'sponsor', 'mentor', 'beneficiary'] as const
   export type Role = typeof ROLES[number]
   
   export const STATUSES = ['pending', 'active', 'inactive', 'suspended'] as const
   export type Status = typeof STATUSES[number]
   
   export const MEMBER_TYPES = ['trustee', 'member'] as const
   export type MemberType = typeof MEMBER_TYPES[number]
   ```

   `types/database.ts` — placeholder until Supabase types are generated:

   ```typescript
   export type Database = {
     public: {
       Tables: Record<string, never>
       Views: Record<string, never>
       Functions: Record<string, never>
       Enums: Record<string, never>
     }
   }
   ```
7. **Configure environment variables:**

   `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   RESEND_API_KEY=
   TERMII_API_KEY=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

   `.env.example` — same file without values, committed to Git.
8. **Configure the root layout** (`app/layout.tsx`) with:
   - Quicksand font loaded via `next/font/google`
   - General Sans loaded via `next/font/local` or Google Fonts
   - Metadata: title "TACE Welfare Foundation", description "Guiding Children Toward Independence"
   - Favicon
   - Tailwind CSS globals
9. **Configure Tailwind** (`tailwind.config.ts`) with the full TACE colour palette (tace-blue, tace-yellow, tace-navy, tace-red, tace-green, tace-gray, tace-lgray) and font families (Quicksand, General Sans). Use CSS variables (:root) matching the HTML reference design.
10. **Set up shadcn/ui** — initialise with the "new-york" style variant, slate base colour.
11. **Install these shadcn components** (needed across Phase 1):

    ```bash
    npx shadcn@latest add button card input label form toast dialog dropdown-menu avatar badge separator sheet tabs
    ```
12. **Configure ESLint and Prettier** with consistent settings.
13. **Create `.gitignore`** — include `.env.local`, `node_modules`, `.next`.
14. **Initialise Git repo** with an initial commit.

**ACCEPTANCE CRITERIA:**

- [ ] `npm run dev` starts the app at localhost:3000 with no errors
- [ ] `npm run build` completes with zero errors and zero warnings
- [ ] TypeScript strict mode is enabled in `tsconfig.json`
- [ ] All four Supabase client files exist and are correctly typed
- [ ] Folder structure matches the specification exactly
- [ ] shadcn/ui components install and render correctly
- [ ] Both fonts load on the page
- [ ] Brand colours are available as Tailwind utility classes (e.g. `text-tace-``blue, bg-tace-yellow, text-tace-navy, bg-tace-red, text-tace-green, bg-tace-lgray`)
- [ ] `.env.example` is committed; `.env.local` is git-ignored
- [ ] Root proxy.ts runs on every request without crashing

**DO NOT:**

- Do not create any database tables — that is Ticket 1B
- Do not build any auth UI — that is Ticket 1C
- Do not build any page content — that is Ticket 1D
- Do not use Pages Router (`pages/` directory)
- Do not install auth libraries other than Supabase
- Do not hardcode any Supabase credentials

## Ticket 1B — Database Schema & RLS

**Copy everything below this line and paste into your agent.**

---

**ROLE:** You are a Database Agent setting up the complete Supabase PostgreSQL schema for the TACE Welfare Foundation platform.

**CONTEXT:** TACE is a Nigerian children's welfare nonprofit. The platform has 5 user roles: Admin, Member (includes trustees), Sponsor, Mentor, Beneficiary. Every table must have Row Level Security (RLS) enabled BEFORE any data is inserted. The service role key is never exposed to the client.

**YOUR OUTPUT FORMAT:** Produce a single SQL migration file: `supabase/migrations/001_initial_schema.sql` that can be run in the Supabase SQL Editor in one execution. All statements must be idempotent where possible.

**TABLES TO CREATE (in this exact dependency order):**

1. **profiles** — extends `auth.users`
   - `id` uuid PK references auth.users(id) on delete cascade
   - `full_name` text not null
   - `email` text not null
   - `phone` text
   - `role` text not null, check: admin, member, sponsor, mentor, beneficiary
   - `status` text not null default 'pending', check: pending, active, inactive, suspended
   - `member_type` text, check: trustee, member (members only)
   - `trustee_role` text (e.g. 'Chairman', 'Secretary')
   - `committee` text (committee assignment)
   - `avatar_url` text
   - `created_at` timestamptz default now()
   - `updated_at` timestamptz default now()
2. **applications** — beneficiary application form submissions
   - `id` uuid PK default gen\_random\_uuid()
   - `applicant_type` text, check: self, guardian, organisation
   - Child fields: child\_first\_name (not null), child\_last\_name (not null), child\_dob (date not null), child\_gender, child\_nationality, child\_state, child\_address, child\_phone, child\_email, child\_photo\_url
   - Guardian fields: guardian\_name, guardian\_relationship, guardian\_phone, guardian\_email, guardian\_address, guardian\_occupation
   - Organisation fields: org\_name, org\_contact\_name, org\_contact\_role, org\_phone, org\_email, org\_identification
   - Education fields: edu\_status, school\_name, class\_level, school\_address, academic\_performance, learning\_difficulties
   - Household fields: living\_situation, siblings\_count (int), household\_income, challenges (text\[\])
   - Support fields: support\_types (text\[\]), support\_description
   - Aspiration fields: interests, aspirations, subjects\_skills, talents
   - Health fields: health\_conditions, disabilities, current\_treatment
   - Consent fields: consent\_information (bool default false), consent\_contact (bool default false), consent\_assessment (bool default false), consent\_no\_guarantee (bool default false), consent\_photography (bool default false), declarant\_name, declared\_at (timestamptz)
   - Status fields: status text default 'pending' check (pending, approved, rejected, flagged), admin\_notes, reviewed\_by (uuid ref profiles), reviewed\_at (timestamptz)
   - `created_at` timestamptz default now()
3. **sponsors** — sponsor profiles
   - `id` uuid PK default gen\_random\_uuid()
   - `profile_id` uuid references profiles(id) unique
   - `sponsorship_type` text check: one\_time, long\_term
   - `total_donated` numeric(12,2) default 0
   - `created_at` timestamptz default now()
   - `updated_at` timestamptz default now()
4. **mentors** — mentor profiles
   - `id` uuid PK default gen\_random\_uuid()
   - `profile_id` uuid references profiles(id) unique
   - `profession` text
   - `expertise` text
   - `availability` text
   - `mentor_track` text check: career, tech (which mentorship track — general career guidance or tech/digital skills)
   - `preferred_age_group` text
   - `motivation` text
   - `created_at` timestamptz default now()
   - `updated_at` timestamptz default now()
5. **beneficiaries** — full beneficiary profiles (created from approved applications)
   - `id` uuid PK default gen\_random\_uuid()
   - `profile_id` uuid references profiles(id) — null until account created
   - `application_id` uuid references applications(id)
   - `tace_id` text unique (auto-generated: TACE-2026-001)
   - Personal: first\_name (not null), last\_name (not null), date\_of\_birth (date not null), gender (check: male, female, other), state\_of\_origin, address, phone, email, photo\_url
   - Guardian: guardian\_name, guardian\_rel, guardian\_phone, guardian\_email
   - Education: edu\_status (check: in\_school, out\_of\_school, never\_attended), school\_name, class\_level
   - Situation: living\_situation, household\_income, challenges (text\[\])
   - Support: support\_needed (text\[\]), support\_description
   - Aspirations: interests, aspirations, talents
   - Health: health\_conditions, disabilities
   - Stage: current\_stage text default 'identified' check (identified, assessed, education\_support, vocational\_training, certification, apprenticeship, savings, employment, business\_owner), stage\_updated\_at
   - Relationships: mentor\_id (uuid ref mentors), sponsor\_id (uuid ref sponsors)
   - Status: status text default 'active' check (active, inactive, graduated, lost\_contact)
   - Timestamps: created\_at, updated\_at
6. **mentorship\_matches** — links mentor to beneficiary
   - `id` uuid PK, mentor\_id (ref mentors, not null), beneficiary\_id (ref beneficiaries, not null)
   - `status` text default 'pending\_consent' check (pending\_consent, active, paused, completed, terminated)
   - Consent: consent\_mentor (bool default false), consent\_guardian (bool default false), consent\_mentor\_at, consent\_guardian\_at
   - Dates: started\_at, ends\_at, termination\_reason, created\_at
7. **mentorship\_messages** — monitored messaging
   - `id` uuid PK, match\_id (ref mentorship\_matches, not null), sender\_id (ref profiles, not null)
   - `sender_type` text check (mentor, beneficiary, guardian, admin)
   - `content` text not null
   - Flagging: is\_flagged (bool default false), flag\_reason, flagged\_by (ref profiles), flagged\_at
   - `read_at` timestamptz, `created_at` timestamptz default now()
8. **mentorship\_notes** — monthly progress notes from mentors
   - `id` uuid PK, match\_id (ref mentorship\_matches, not null), mentor\_id (ref mentors, not null)
   - `topics_discussed` text, `improvements` text, `concerns` text, `next_steps` text
   - `check_in_date` date, `created_at` timestamptz default now()
9. **projects** — fundraising/programme projects
   - `id` uuid PK, title (not null), description, target\_amount (numeric 12,2), current\_amount (numeric 12,2 default 0)
   - `start_date` date, `end_date` date
   - `status` text default 'draft' check (draft, active, completed, archived)
   - `is_published` boolean default false
   - `created_by` uuid ref profiles, created\_at, updated\_at
10. **project\_beneficiaries** — junction table
    - `id` uuid PK, project\_id (ref projects not null), beneficiary\_id (ref beneficiaries not null)
    - `support_type` text, `amount_needed` numeric(12,2)
    - unique(project\_id, beneficiary\_id)
11. **donations** — all donation records
    - `id` uuid PK, donor\_name (not null), donor\_email, donor\_phone
    - `sponsor_id` uuid ref sponsors (null for one-time), project\_id (ref projects), beneficiary\_id (ref beneficiaries)
    - `amount` numeric(12,2) not null, currency text default 'NGN', purpose, bank\_ref
    - `receipt_sent` bool default false, receipt\_sent\_at
    - `notes` text, logged\_by (ref profiles), created\_at
12. **interventions** — support given to beneficiaries
    - `id` uuid PK, beneficiary\_id (ref beneficiaries not null)
    - `type` text not null, `amount` numeric(12,2), `description` text, `notes` text
    - `given_by` uuid ref profiles, `given_at` date, created\_at
13. **progress\_updates** — admin-posted beneficiary progress
    - `id` uuid PK, beneficiary\_id (ref beneficiaries not null)
    - `title` text not null, `content` text not null, `posted_by` uuid ref profiles
    - `created_at` timestamptz default now()
14. **announcements** — admin announcements for member dashboard
    - `id` uuid PK, title (not null), content (not null)
    - `is_published` bool default false, published\_at, created\_by (ref profiles), created\_at
15. **stories** — impact stories on public website
    - `id` uuid PK, title (not null), content (not null), photo\_url, excerpt
    - `beneficiary_id` uuid ref beneficiaries, is\_published (bool default false)
    - `published_at` timestamptz, created\_by (ref profiles), created\_at
16. **events** — foundation events and meetings
    - `id` uuid PK, title (not null), description, location, event\_date (timestamptz)
    - `event_type` text check (meeting, event, training, outreach)
    - `created_by` uuid ref profiles, created\_at
17. **audit\_log** — all admin actions
    - `id` uuid PK, user\_id (ref profiles not null), action (text not null)
    - `entity_type` text, `entity_id` uuid, `details` jsonb
    - `created_at` timestamptz default now()

**HELPER FUNCTIONS TO CREATE:**

```sql
-- Get current user's role
create or replace function public.get_role() returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- Get current user's mentor record id
create or replace function public.get_mentor_id() returns uuid as $$
  select id from public.mentors where profile_id = auth.uid();
$$ language sql security definer stable;

-- Get current user's sponsor record id
create or replace function public.get_sponsor_id() returns uuid as $$
  select id from public.sponsors where profile_id = auth.uid();
$$ language sql security definer stable;
```

**TACE ID AUTO-GENERATION:**

```sql
create sequence if not exists tace_id_seq start 1;

create or replace function generate_tace_id() returns trigger as $$
begin
  new.tace_id := 'TACE-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('tace_id_seq')::text, 3, '0');
  return new;
end;
$$ language plpgsql;

create trigger set_tace_id before insert on beneficiaries
  for each row when (new.tace_id is null)
  execute function generate_tace_id();
```

**AUTO-UPDATE `updated_at` TRIGGER:** Create a reusable trigger function and attach it to every table that has `updated_at`.

**RLS POLICIES (critical — enable on EVERY table):**

For each table, enable RLS and create policies following these rules:

- **profiles**: users read own; admin reads/updates all; users can update own (limited fields)
- **applications**: admin full access; public can insert (the application form is public)
- **beneficiaries**: admin full access; sponsor reads linked child (where sponsor\_id matches); mentor reads linked child (where mentor\_id matches); beneficiary reads own (where profile\_id matches)
- **mentorship\_matches**: admin full access; mentor reads own matches
- **mentorship\_messages**: admin reads all; mentor reads/writes own match messages; beneficiary reads/writes own match messages
- **mentorship\_notes**: admin reads all; mentor reads/writes own notes
- **sponsors**: admin full access; sponsor reads own record
- **mentors**: admin full access; mentor reads own record
- **donations**: admin full access; sponsor reads own donations
- **projects**: admin full access; published projects readable by authenticated users
- **project\_beneficiaries**: admin full access; readable by authenticated users (for public sponsor page)
- **interventions**: admin full access; beneficiary reads own
- **progress\_updates**: admin full access; beneficiary reads own; sponsor reads linked child's updates
- **announcements**: admin full access; published announcements readable by members
- **stories**: admin full access; published stories readable by everyone (including anon for landing page)
- **events**: admin full access; readable by authenticated users
- **audit\_log**: admin only — insert and read
- **PUBLIC BENEFICIARIES VIEW (required for the anonymous landing page):**

  The beneficiaries table holds sensitive child PII (address, guardian contact, household income, health conditions) and must never be directly readable by anonymous visitors — RLS on beneficiaries grants no access to anon, and that must stay true. Instead, create a security-definer view that exposes only the minimum safe fields, gated by consent:

  Create `public_beneficiaries` as a view selecting only: id, first\_name (never last\_name), a computed age (from date\_of\_birth — never expose the raw date of birth), current\_stage, support\_needed, photo\_url. Join beneficiaries to applications on application\_id and filter where beneficiaries.status = 'active' AND applications.consent\_photography = true. A child whose guardian did not consent to public photography/profile exposure must not appear in this view at all, regardless of status. Grant select on this view to anon and authenticated. Ticket 1D's landing page (sponsor cards, child search, impact stats) must query this view, never the beneficiaries table directly, for any unauthenticated or public-facing context.

  **SELF-ESCALATION PREVENTION TRIGGER (required on profiles):**

  RLS alone cannot express "a user may update their own profile row, but only non-privileged columns." Add a before-update trigger function on profiles that reverts role, status, member\_type, trustee\_role, and committee to their old values whenever the person making the update is not an admin (checked via get\_role()) and is updating their own row — so a user editing their display name cannot also silently grant themselves admin.

**STORAGE BUCKETS:**

Create these buckets with the specified access:

| Bucket | Access | Contents |
| --- | --- | --- |
| beneficiary-photos | Private — admin + linked sponsor/mentor | Child profile photos |
| documents | Private — admin only | Consent forms, school reports, CAC docs |
| certificates | Private — admin + beneficiary | Training and programme certificates |
| public-assets | Public | Landing page images, approved story photos |

For private buckets, create storage policies that restrict access by role.

Storage path convention (required for the policies above to work): objects in beneficiary-photos and certificates must be uploaded at {beneficiary\_id}/filename.ext — the policies match against this path shape. Document this convention clearly since Ticket 2C (admin beneficiary management, which builds the upload UI) must follow it exactly or the RLS storage policies will silently deny access.

**AUTO-CREATE PROFILE ON SIGNUP:** Create a trigger function that inserts a row into `profiles` whenever a new user is created in `auth.users`. The role, full\_name, email, and phone should come from the user's `raw_user_meta_data`.

```sql
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, phone, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

**ACCEPTANCE CRITERIA:**

- [ ] All 17 tables created with correct columns and constraints
- [ ] RLS is enabled on every table — verify with: `select tablename, rowsecurity from pg_tables where schemaname = 'public'`
- [ ] All RLS policies are in place — verify with: `select * from pg_policies`
- [ ] Helper functions work — test `get_role()`, `get_mentor_id()`, `get_sponsor_id()` with test users
- [ ] TACE ID auto-generates on beneficiary insert (e.g. TACE-2026-001)
- [ ] Profile auto-creates when a new auth user signs up
- [ ] `updated_at` triggers fire on every table that has the column
- [ ] All 4 storage buckets exist with correct access policies
- [ ] The public\_beneficiaries view returns only first\_name, computed age, current\_stage, support\_needed, photo\_url — never last\_name or raw date\_of\_birth — and excludes any child whose application lacks consent\_photography
- [ ] The self-escalation trigger on profiles blocks a non-admin from changing their own role, status, member\_type, trustee\_role, or committee via a direct update
- [ ] No table allows access without a matching RLS policy
- [ ] SQL migration runs cleanly in one execution with no errors

**DO NOT:**

- Do not skip RLS on any table — security is non-negotiable
- Do not expose the service role key in any client-side code
- Do not create edge functions — those come in Phase 2
- Do not create any frontend code
- Do not use Supabase Dashboard UI to create tables — everything must be in the SQL migration file for reproducibility

## Ticket 1C — Authentication

**Copy everything below this line and paste into your agent.**

---

**ROLE:** You are an Auth Agent building the complete authentication system for the TACE Welfare Foundation platform.

**CONTEXT:** TACE is a Nigerian children's welfare nonprofit with 5 user roles: Admin, Member, Sponsor, Mentor, Beneficiary. Authentication uses Supabase Auth with email/password. All new users (except admin) start with `status='pending'` and must be approved by admin before accessing their dashboard. Admin accounts are pre-created directly in Supabase — no public admin signup.

**PREREQUISITES (already completed):**

- Next.js 16 project with App Router, TypeScript, Tailwind, shadcn/ui (Ticket 1A)
- All Supabase tables, RLS policies, and the `handle_new_user()` trigger (Ticket 1B)
- Supabase client files at `lib/supabase/` (client.ts, server.ts, middleware.ts, admin.ts)

**TECH STACK:**

- Supabase Auth (email/password only — no magic link, no OAuth for now)
- shadcn/ui form components (Button, Card, Input, Label, Field)
- Zod for form validation
- react-hook-form for form state management
- `@supabase/ssr` for session management

**SUPABASE AUTH SETTINGS (configure in Supabase Dashboard):**

- Enable email/password sign up
- Disable magic link (Phase 1)
- Email confirmation: required
- JWT expiry: 3600 seconds (1 hour)
- Refresh token rotation: enabled
- Refresh token reuse interval: 10 seconds
- Site URL: set to production URL
- Redirect URLs: add localhost:3000 and production URL

**YOUR DELIVERABLES:**

### 1. Enhanced Proxy (proxy.ts, at the project root — Next.js 16's replacement for `middleware.ts`)

Replace the stub from Ticket 1A with full route protection logic:

```
Logic flow:
1. Refresh session (using updateSession from lib/supabase/middleware.ts)
2. Get the current user via supabase.auth.getUser()
3. Get the user's profile (role and status) from the profiles table

Routing rules:
- Public routes (/*, /about, /sponsor, /mentor, /apply, /donate, /stories, /programmes, /contact, /member) → allow all
- Auth routes (/login, /signup/*) → if user is logged in AND active, redirect to their dashboard
- /pending → if user is active, redirect to their dashboard; if not logged in, redirect to /login
- Dashboard routes (/admin/*, /member/*, /sponsor/*, /mentor/*, /beneficiary/*) →
  a. Not logged in → redirect to /login
  b. Status is 'pending' → redirect to /pending
  c. Status is 'inactive' or 'suspended' → redirect to /login with error
  d. Role doesn't match route prefix → redirect to correct dashboard:
     - admin → /admin
     - member → /member
     - sponsor → /sponsor  
     - mentor → /mentor
     - beneficiary → /beneficiary
  e. Role matches → allow
```

The middleware must also handle session refresh to keep the user logged in.

### 2. Auth Utility Functions (`lib/auth/`)

Create these files:

`lib/auth/actions.ts` — Server Actions for auth:

- `signUp(formData)` — creates user with `supabase.auth.signUp()`, passing role, full\_name, phone in `options.data` (which becomes `raw_user_meta_data` and triggers `handle_new_user`)
- `signIn(formData)` — calls `supabase.auth.signInWithPassword()`
- `signOut()` — calls `supabase.auth.signOut()` and redirects to /
- `getSession()` — gets current user and profile, returns `{ user, profile }` or null

`lib/auth/guards.ts` — Helper functions:

- `requireAuth()` — gets session, redirects to /login if not authenticated
- `requireRole(role)` — gets session, redirects if wrong role
- `requireActive()` — gets session, redirects to /pending if status is pending
- `getDashboardPath(role)` — returns the correct dashboard path for a role

`lib/validations/auth.ts` — Zod schemas:

- `loginSchema` — email (required, valid email) + password (required, min 8 chars)
- `memberSignupSchema` — full\_name (required, min 2), email (required, valid), phone (required, Nigerian format), password (min 8), occupation, committee\_preference, reason\_for\_joining
- `sponsorSignupSchema` — full\_name, email, phone, password, beneficiary\_id (optional — linked child)
- `mentorSignupSchema` — full\_name, email, phone, password, mentor\_track (required — career or tech), profession (required), expertise, availability, preferred\_age\_group, motivation (required)

### 3. Login Page (`app/(auth)/login/page.tsx`)

- Clean, centred card layout on a light background
- TACE logo and "Welcome Back" heading
- Email + Password fields with shadcn/ui Input
- "Sign In" button — disabled while submitting, shows spinner
- Link: "Don't have an account? Join TACE" → /member (or keep generic)
- Error display: show auth errors inline below the form (invalid credentials, email not confirmed, account suspended)
- On success: redirect to the user's correct dashboard based on role
- Server Action handles the actual sign-in

### 4. Member Signup Page (`app/(auth)/signup/member/page.tsx`)

- Card layout with TACE branding
- "Become a TACE Member" heading
- Fields: Full Name, Email, Phone, Password, Confirm Password, Occupation, Committee Preference (dropdown with the 9 committees), Why do you want to join? (textarea)
- All validation via Zod schema + react-hook-form
- Server Action: calls `supabase.auth.signUp()` with `data: { full_name, phone, role: 'member' }`
- On success: show confirmation screen — "Thank you for applying! Please check your email to verify your account. Once verified, an admin will review your application and you'll receive an approval email."
- After email verification, user can log in but sees /pending page

### 5. Sponsor Signup Page (`app/(auth)/signup/sponsor/page.tsx`)

- Card layout with TACE branding
- "Create Your Sponsor Account" heading
- Fields: Full Name, Email, Phone, Password, Confirm Password
- Note: beneficiary linking is done by admin after approval
- Server Action: calls signUp with `role: 'sponsor'`
- On success: same confirmation screen

### 6. Mentor Signup Page (`app/(auth)/signup/mentor/page.tsx`)

- Card layout with TACE branding
- "Become a TACE Mentor" heading
- Fields: Full Name, Email, Phone, Password, Confirm Password, Mentorship Track (dropdown, required: Career or Tech/Digital Skills), Profession, Area of Expertise, Availability (dropdown: weekdays, weekends, both, flexible), Preferred Age Group (dropdown: 6-10, 11-14, 15-18, no preference), Why do you want to mentor? (textarea, required)
- Server Action: calls signUp with `role: 'mentor'`, then inserts into mentors table with the extra fields
- On success: same confirmation screen

### 7. Pending Page (`app/(auth)/pending/page.tsx`)

- Friendly, warm design — not an error page
- Shows user's name (from profile)
- Status message: "Hi \[Name\], your account is being reviewed. You'll receive an email once you're approved. This usually takes 1-2 business days."
- TACE logo and illustration/icon
- Link: "Return to Home" → /
- Link: "Sign Out" → signs out and redirects to /
- This page is protected — only accessible if logged in with status='pending'

### 8. Auth Layout (`app/(auth)/layout.tsx`)

- Centred layout — card floats in the middle of the page
- Light background with subtle TACE branding
- No navigation bar (just the TACE logo linking to /)
- Mobile responsive

### 9. Shared Auth Components (`components/forms/`)

- `AuthCard` — wrapper card used by all auth pages
- `PasswordInput` — input with show/hide toggle
- `FormError` — displays error messages from server actions
- `SubmitButton` — button with loading state

**ACCEPTANCE CRITERIA:**

- [ ] A new user can sign up as Member, Sponsor, or Mentor
- [ ] Email verification is required before login works
- [ ] After email verification, login works and redirects to /pending (since status='pending')
- [ ] The pending page shows the user's name and a friendly message
- [ ] An admin can change a user's status to 'active' in Supabase Dashboard → user can now log in to their dashboard
- [ ] Middleware correctly blocks unauthenticated users from all dashboard routes
- [ ] Middleware correctly redirects users to their role-specific dashboard
- [ ] Middleware redirects pending users to /pending on any dashboard route
- [ ] Already logged-in active users visiting /login are redirected to their dashboard
- [ ] Sign out works and clears the session
- [ ] All forms show validation errors inline
- [ ] All forms show server-side auth errors (wrong password, email taken, etc.)
- [ ] All auth pages are mobile responsive
- [ ] No auth credentials are exposed in client-side code

**DO NOT:**

- Do not build any admin dashboard UI — that is Phase 2
- Do not implement OAuth or magic link — Phase 3
- Do not create admin signup — admin accounts are pre-created
- Do not build the beneficiary application form — that is Ticket 3B
- Do not skip email confirmation — it is required
- Do not store passwords anywhere other than Supabase Auth
- Do not use any auth library other than Supabase Auth

## Ticket 1D — Public Landing Page

**Copy everything below this line and paste into your agent.**

---

**ROLE:** You are a Frontend Agent building the complete public landing page for the TACE Welfare Foundation platform.

**CONTEXT:** TACE Welfare Foundation is a Nigerian children's welfare nonprofit. The landing page is the foundation's primary conversion tool — it must turn visitors into donors, sponsors, mentors, or members within 60 seconds of arrival. A complete HTML reference design (tace\_landing.html) has been built — the agent MUST follow this file as the single source of truth for all colours, layouts, spacing, typography, and component patterns. Attach the HTML file to the agent session alongside this prompt.

**PREREQUISITES (already completed):**

- Next.js 16 project initialised with Tailwind + shadcn/ui (Ticket 1A)
- Supabase database with all tables and RLS (Ticket 1B)
- Authentication system with login/signup flows (Ticket 1C)
- Supabase clients at `lib/supabase/` already configured

**TECH STACK:**

- Next.js 16 App Router — Server Components by default
- Tailwind CSS with TACE brand colours (tace-blue: #29ABE2, tace-yellow: #F7C100, tace-navy: #1A1A2E, tace-red: #ED1C24, tace-green: #27AE60, tace-gray: #6B7280, tace-lgray: #F4F6F8)
- shadcn/ui components
- Fonts: Quicksand (headings) + General Sans (body)
- next/image for all images (WebP, lazy loading)
- Lucide React for icons
- Supabase for live data (beneficiaries, stories, projects)

**DESIGN PRINCIPLES:**

- Mobile-first — all sections must work at 375px
- Emotional but not manipulative — warm photography, real impact language
- Nigerian context — Naira amounts, Nigerian phone numbers, local references
- Fast — target Lighthouse 85+ mobile, 95+ desktop
- Accessible — WCAG 2.1 AA, 4.5:1 contrast, keyboard navigable

**FILE STRUCTURE:** All landing page components go in ` components/public/. The page itself is app/(public)/page.tsx. The public layout is  ``app/(public)/layout.tsx`.

**YOUR DELIVERABLES:**

### 1. Public Layout (`app/(public)/layout.tsx`)

- Wraps all public pages
- Includes the Navbar and Footer
- Does not include any auth checks — fully public

### 2. Navbar Component (`components/public/navbar.tsx`)

- Sticky, fixed to top
- Transparent background on hero, white (#FFFFFF) with shadow on scroll — use Intersection Observer or scroll event
- Logo on the left — "TACE Foundation" text or logo image
- Nav links: About, Programmes, Sponsor a Child, Mentor, Stories, Donate, Contact
- Right side: Login button (outlined) + "Sponsor a Child" button (filled, tace-blue)
- Mobile: hamburger menu → full-screen slide-out sheet with all links
- Smooth transition between transparent and white states

### 3. Hero Section (`components/public/hero-section.tsx`)

- Full-viewport height with background image (placeholder path — admin uploads real photo to public-assets bucket)
- Dark overlay gradient for text readability: `linear-gradient(135deg, rgba(13,17,23,0.85) 0%, rgba(26,26,46,0.75) 50%, rgba(13,17,23,0.6) 100%)`
- **Two-column grid layout** — hero text on the left, search card on the right (`grid-template-columns: 1fr 420px`). On mobile, stack vertically.
- Hero tag pill above headline: yellow text on yellow/transparent background, uppercase, small — e.g. "Registered NGO · RC: IT/9786795"
- Bold two-line headline: "Every Child Deserves a Chance to Thrive" (Quicksand, white, \~68px)
- Subtitle text (General Sans, white/light, 18px)
- CTA buttons below subtitle: "Sponsor a Child" (tace-blue, filled) + "Learn More" (outlined white)
- Social proof stats row below CTAs: three animated counters in white text with yellow numbers
- **Child Search Card** floated on the right of the hero:
  - White card with border-radius 20px, box-shadow, padding 28px
  - "Find a Child to Sponsor" heading
  - Filter dropdowns in 2-column grid: Gender, Age Range, Support Needed
  - "Search" button (tace-blue, full width)
  - Featured child card below the form: small card with child initial/photo, name, age, "Waiting for sponsor" tag in red, "Sponsor" link in blue
  - Connects to Supabase — queries the public\_beneficiaries view (never the beneficiaries table — this is an unauthenticated page), filtered to those with a published project

### 4. Ticker Component (`components/public/ticker.tsx`)

- Horizontal scrolling bar below the hero
- Shows foundation details: CAC Registration: IT/9786795 | Empowering Children Since 2025 | Based in Lagos, Nigeria
- Can pull from announcements table (is\_published=true) in the future
- Navy (#1A1A2E) background, muted white text (13px, 700 weight), yellow dots between items, CSS animation ticker 20s linear infinite

### 5. How It Works Section (`components/public/how-it-works.tsx`)

- Three cards side by side (stack on mobile):
  1. **Sponsor** — icon, "Sponsor a Child", "From ₦20,000/month, give a child access to education, mentorship, and life skills training.", CTA button
  2. **Donate** — icon, "Make a Donation", "Every naira makes a difference. Support our programmes with a one-time or recurring gift.", CTA button
  3. **Mentor** — icon, "Become a Mentor", "Share your professional experience with a young person. 1 hour a month can change a life.", CTA button
- Each card has a 4px coloured top border (Sponsor=blue, Donate=yellow, Mentor=green), white background, rounded 20px, hover lifts with shadow. Each card links to the relevant page (/sponsor, /donate, /mentor)

### 6. Impact Statistics Section (`components/public/impact-stats.tsx`)

- Animated counter numbers that count up when scrolled into view (use Intersection Observer)
- Four stats in a row (2x2 on mobile):
  1. Children Supported — pull count from beneficiaries table (status='active')
  2. Active Mentors — pull count from mentors table (joined with profiles where status='active')
  3. Projects Completed — pull count from projects table (status='completed')
  4. Total Donated — pull sum from donations table
- If counts are zero (new platform), use placeholder targets: "10+ Children Supported", "3+ Active Mentors", etc.
- Navy (#1A1A2E) background with yellow (#F7C100) counter numbers and white labels

### 7. Empowerment Journey Section (`components/public/empowerment-journey.tsx`)

- Visual representation of the 9 stages a beneficiary progresses through:
  1. Identified → 2. Assessed → 3. Education Support → 4. Vocational Training → 5. Certification → 6. Apprenticeship → 7. Savings Programme → 8. Employment → 9. Business Owner
- Interactive: clicking a stage highlights it and shows a description + relevant image
- On mobile: horizontal scroll or vertical accordion
- Use icons from Lucide for each stage
- Shows how TACE takes a child from identification to independence

### 8. Sponsor a Child Section (`components/public/sponsor-section.tsx`)

- Heading: "Sponsor a Child Today"
- Three featured beneficiary cards pulled from Supabase:
  - Query: public\_beneficiaries view (never the beneficiaries table) joined to published projects, limit 3
  - Each card: child photo (from beneficiary-photos bucket via signed URL), first name, age, current stage, support needed
  - Progress bar showing stage completion (e.g. stage 3 of 9 = 33%)
  - "Sponsor \[Name\]" button → links to /sponsor/\[id\]
- If no beneficiaries exist yet: show 3 placeholder cards with "Coming Soon" overlay and a "Get Notified" CTA
- "View All Children" link → /sponsor

### 9. Mentorship Programme Section (`components/public/mentorship-section.tsx`)

- Dark navy gradient background (\`linear-gradient(135deg, #1A1A2E 0%, #0d2137 100%)\`). Two-column layout: description left, mentor cards right
- Heading: "Our Mentorship Programme"
- Description of how mentorship works: two tracks — Career (general professional guidance) and Tech (digital skills mentorship) — 6-month minimum commitment, virtual sessions, monitored platform, professional guidance
- Three mentor profile cards (can be placeholder until real mentors sign up):
  - Photo (avatar), name, profession, "Mentor since \[date\]"
- "Become a Mentor" CTA button (tace-yellow) + "Learn More" button (outlined white) → /mentor

### 10. Stories Section (`components/public/stories-section.tsx`)

- Heading: "Stories of Impact"
- Asymmetric grid layout: \`grid-template-columns: 2fr 1fr 1fr\` — main story card (large) left, two smaller cards stacked right. Single column on mobile
- Pull from stories table where is\_published=true, order by published\_at desc, limit 3
- Each story card: photo, title, excerpt (first 120 chars of content), "Read More" link
- If no stories exist: show placeholder cards with "Stories coming soon"
- "View All Stories" link → /stories

### 11. Programmes Section (`components/public/programmes-section.tsx`)

- Six programme cards in a grid (3x2 desktop, 2x3 tablet, 1x6 mobile):
  1. Education Support — keeping children in school
  2. Vocational Training — practical skills development
  3. Mentorship — professional guidance and support
  4. Career Discovery — secondary school career exposure
  5. Enterprise Development — beauty salon and barber shop training
  6. Community Outreach — orphanage visits and welfare support
- Each card: icon, title, short description, "Learn More" link → /programmes

### 12. Donate Section (`components/public/donate-section.tsx`)

- Navy (#1A1A2E) background. Two-column grid layout: donation amounts (left) + bank transfer card (right). Contextualised donation amounts in a 3x2 grid of clickable cards (what each amount buys):
  - ₦5,000 → one month of school supplies
  - ₦20,000 → one month of full sponsorship
  - ₦50,000 → vocational training materials
  - ₦240,000 → one year of full sponsorship
- Each amount is a card with transparent background, white border. On hover/active: border turns yellow (#F7C100), background gets subtle yellow tint. Amount text in white, description in muted white
- Bank transfer card on the right: dark card with subtle border (rgba white), rounded 20px. Row layout for each detail (key: muted, value: white bold):
  - Bank: Stanbic IBTC Bank
  - Account Name: TACE Welfare Foundation
  - Account Number: \[to be provided by Simon\]
  - After transfer, email confirmation to tacefoundationinfo@gmail.com
- "Donate Now" CTA that scrolls to the bank details or links to /donate

### 13. Get Involved Section (`components/public/get-involved.tsx`)

- Four cards:
  1. Donate → /donate
  2. Sponsor a Child → /sponsor
  3. Become a Mentor → /mentor
  4. Partner With Us → /contact
- Each card: icon, title, one-line description, CTA button

### 14. Trust Section (`components/public/trust-section.tsx`)

- Heading: "Why Trust TACE"
- Trust indicators:
  - CAC Registered (RC: IT/9786795)
  - TIN: 2622487847179
  - Transparent governance — board of trustees
  - Every donation accounted for — impact reports published
  - Child protection policy in place
- Badge/shield icons for each indicator

### 15. Footer (`components/public/footer.tsx`)

- Full-width, dark background
- Four columns:
  1. About TACE — logo, tagline "Guiding Children Toward Independence", brief description
  2. Quick Links — About, Programmes, Sponsor, Mentor, Donate, Contact
  3. Legal — Privacy Policy, Terms, Child Protection Policy
  4. Contact — Email: tacefoundationinfo@gmail.com, Address: Festac Town, Lagos, Nigeria
- Bottom bar: © 2026 TACE Welfare Foundation. All rights reserved. | CAC: IT/9786795
- Social media links (placeholder hrefs for now)

### 16. Career Path Quiz Teaser (`components/public/career-quiz-teaser.tsx`)

- Client Component — no login, no data saved, no AI/API calls (fully static, zero cost)
- Heading: "Not Sure What Path Fits You? Find Out in 2 Minutes"
- Short 5–8 question quiz, "this or that" style (e.g. "Fix something broken, or explain something to someone?", "Work with numbers, or work with people?"), one question shown at a time with a progress bar
- Answers scored client-side (in React state only — nothing persisted) against 5–6 fixed career clusters: Builder/Technical, Creative, People & Care, Analytical/Academic, Business/Enterprise
- Result screen: shows the top matching cluster with a short static description and 2–3 example real-world roles (no AI-generated text — pre-written copy per cluster)
- Strong CTA on the result screen: "Want real guidance from a TACE mentor? Apply to become a beneficiary" → links to /apply
- Secondary CTA: "Retake Quiz"
- This is a lightweight teaser only — the full AI-personalised version lives in the beneficiary dashboard (Phase 3) and is a separate, more detailed feature

### 17. Sticky Donate Button (`components/public/sticky-donate.tsx`)

- Appears after scrolling past the hero section
- Fixed to the bottom-right corner on desktop, full-width bar at bottom on mobile
- "Donate" text with heart icon
- Uses tace-red (#ED1C24) background with white text, rounded pill shape (border-radius: 50px), box-shadow. Links to /donate or scrolls to the donate section
- Subtle animation on appear

### 18. Landing Page Assembly (`app/(public)/page.tsx`)

- Server Component
- Fetches initial data from Supabase (beneficiaries, stories, stats) and passes to client components
- Assembles all sections in order:
  1. Hero (with search card)
  2. Ticker
  3. How It Works
  4. Impact Stats
  5. Empowerment Journey
  6. Career Path Quiz Teaser
  7. Sponsor a Child
  8. Mentorship Programme
  9. Stories
  10. Programmes
  11. Donate
  12. Get Involved
  13. Trust
- Sections that need interactivity (counters, journey clicks, search card, career quiz teaser) are Client Components
- Static sections are Server Components

**SUPABASE QUERIES NEEDED:**

```typescript
// Featured beneficiaries for sponsor section — query the public_beneficiaries VIEW, never the beneficiaries table, on this unauthenticated page
const { data: beneficiaries } = await supabase
  .from('public_beneficiaries')
  .select('id, first_name, age, current_stage, photo_url, support_needed')
  .limit(3)

// Impact stories
const { data: stories } = await supabase
  .from('stories')
  .select('id, title, content, photo_url, published_at')
  .eq('is_published', true)
  .order('published_at', { ascending: false })
  .limit(3)

// Stats counts — also via the public_beneficiaries view, not the beneficiaries table
const { count: beneficiaryCount } = await supabase
  .from('public_beneficiaries')
  .select('*', { count: 'exact', head: true })
```

**ACCEPTANCE CRITERIA:**

- [ ] Landing page loads and displays all 12+ sections in correct order
- [ ] Navbar transitions from transparent to white on scroll
- [ ] Mobile hamburger menu opens and closes correctly
- [ ] Hero search card filters beneficiaries from Supabase (or shows empty state gracefully)
- [ ] Impact stat counters animate on scroll
- [ ] Empowerment Journey stages are interactive — click to see details
- [ ] Sponsor section shows real beneficiaries from Supabase or graceful empty state
- [ ] Stories section shows real stories from Supabase or graceful empty state
- [ ] All CTA buttons link to correct pages
- [ ] Career quiz teaser works end-to-end client-side, saves no data, and makes no API calls — result screen always ends with a CTA to /apply
- [ ] Sticky donate button appears after hero scroll
- [ ] Footer renders with all links and contact details
- [ ] All images use next/image with proper sizing and alt text
- [ ] Page is fully responsive — tested at 375px, 768px, 1280px
- [ ] Lighthouse mobile score ≥ 85
- [ ] All text meets 4.5:1 contrast ratio
- [ ] No horizontal scroll on any viewport width

**DO NOT:**

- Do not build the /about, /programmes, /stories, or other sub-pages — only the landing page
- Do not hardcode beneficiary data — always query Supabase and handle empty state
- Do not use stock photos of non-Nigerian children — use neutral placeholder images or illustrations
- Do not add a payment gateway — donations are bank transfer only in Phase 1
- Do not use any animation library — stick to CSS transitions and Intersection Observer
- Do not call the Claude API or any AI service for the career quiz teaser — it is fully static/rule-based; the AI-personalised version is a separate Phase 3 feature on the beneficiary dashboard
- Do not skip the empty states — the platform launches with zero data, so every data section must look good with zero results
- Do not use `<img>` tags — always use next/image