# TACE Platform: Data Protection

**Status: DRAFT for review by the foundation's legal trustee.** It describes what the platform actually does today, written from the code and database. Items marked **[DECIDE]** need a decision from the trustees, ideally with legal advice. Nothing here is legal advice.

The platform holds personal data about children, including health information and photographs, so it is treated as high risk. Under the Nigeria Data Protection Act 2023 (NDPA), information about a child and health information are sensitive.

---

## 1. Who is responsible

TACE Welfare Foundation decides why and how this data is used, so it is the **data controller**. The outside services in section 7 process data on its behalf.

**[DECIDE]** Name the person responsible for data protection (a trustee, or a data protection officer), and publish a contact address for data requests. **[DECIDE]** Ask the legal trustee whether the foundation must register with the Nigeria Data Protection Commission, and whether a data protection impact assessment is required (likely, given children's data and health information).

---

## 2. What personal data is collected, and why

### 2.1 Applications for a child (public form)
| Data | Why |
|---|---|
| Child: name, date of birth, gender, nationality, state, address, phone, email, photograph | To identify the child, assess need and, if approved, run the programme |
| Guardian: name, relationship, phone, email, address, occupation | To contact the family and obtain consent |
| Organisation applying: name, contact person and role, phone, email, identification | To verify who is applying on a child's behalf |
| School and education: status, school, class, performance, learning difficulties | To decide which support is needed |
| Household: living situation, siblings, household income, challenges | To assess need fairly |
| **Health:** health conditions, disabilities, current treatment | To make sure support is safe and suitable |
| Interests, aspirations, talents, subjects and skills | To match mentors and programmes |
| Consents (information, contact, assessment, no-guarantee, **photography**) and the declarant's name and time | To record that consent was given. Photography consent controls whether a child's first name, age and photo may appear publicly |

An application that is not approved stays in the database with its status. **[DECIDE]** how long (see section 5).

### 2.2 Once a child is accepted
The child record (copied from the application), a TACE ID, the stage they have reached, progress updates written by staff, support given (type, amount, description, and **internal staff notes**), documents and certificates uploaded by staff, thank-you messages the child writes to a sponsor, results of the career quiz, notifications, and (if matched) the mentor match, the **messages between mentor and child**, and the mentor's session notes.

### 2.3 Adults
- **Sponsors, members, mentors, admins:** name, email, phone, role and status; sign-in details held by the authentication service (password is stored only as a hash).
- **Mentors** also give profession, expertise, availability, preferred age group and motivation. Vetting is recorded as a checklist (identity, references, background check, interview), who decided and when, and notes. **[DECIDE]** where the actual identity and background-check documents are kept; they are not stored in this platform.
- **Members** may give occupation, committee preference and reason for joining, and write monthly committee updates.
- **Donations:** donor name, email, phone, amount, purpose and bank reference, logged by an admin from bank transfers. No card or bank details are held; there is no payment gateway.
- **Safeguarding concerns** raised by mentors or children: the concern text, who raised it, which child, and how it was handled.
- **Security records:** an audit log of important admin actions (who, what, when; ids and short reasons, no names or message text), and short-lived rate-limit counters that hold only a salted hash of an IP address or email, deleted after a day.

### 2.4 Visitors
No analytics or advertising cookies are used. The site sets only the cookies needed to keep a signed-in user signed in. **[DECIDE]** Error monitoring is planned (Ticket 5C); when it is added it must not send names, emails or message text, and this section must be updated.

---

## 3. Where it is stored

| What | Where |
|---|---|
| Database records, sign-in accounts | Supabase (Postgres and Auth) |
| Photographs, certificates, documents, resources | Supabase Storage. Buckets are private; files are opened only through links that expire after one hour. Only story photos are in a public bucket |
| The website and server code | Vercel |
| Emails sent | Resend |
| Career quiz wording | Google Gemini API (see section 7) |

**[DECIDE]** Record the region of the production Supabase project. Data leaving Nigeria needs a lawful basis under the NDPA; confirm the position with the legal trustee.

---

## 4. Who can see it

Access is enforced inside the database (row-level security), not only in the website, and is tested automatically (`npm run test:rls`). In summary:

| Who | Can see |
|---|---|
| **Visitors (not signed in)** | Only: published stories and projects; for children whose guardian ticked photography consent, first name, age, stage and photo; the foundation's public details |
| **Admins** (sign in with a second factor) | Everything, including the audit log. Staff notes on a child are visible to admins only |
| **The child / guardian account** | Their own record and everything about them, except internal staff notes and other people's data |
| **A sponsor** | Only their linked child: first name, age, stage, photo, interests, aspirations, class, progress and support given. Never the surname, address, guardian details, income, health or school |
| **A mentor** | Only children they are matched to: first name, age, interests, aspirations, class, skills, photo, career quiz result; the messages and their own notes. Never address, guardian, income or health. A mentor can read a child's record only after the vetting and both consents (mentor and guardian) are complete |
| **A member** | Events, announcements and resources; the first name, age and photo of children whose guardians gave photography consent |

Safeguards on messaging: contact details are blocked or held for review; 30 messages per person per hour; admins can read every conversation (read-only) and pause a match.

---

## 5. How long it is kept

**[DECIDE]** The trustees must set these. The platform does not delete anything automatically today, except the items marked *automatic*. Suggested starting points, for the legal trustee to confirm:

| Data | Suggested retention |
|---|---|
| Application not approved | 12 months after the decision, then delete |
| Child record, progress, support, messages | While the child is in the programme, plus 6 years after they leave (financial and accountability duties), then delete or anonymise |
| Photographs | Until consent is withdrawn or the child leaves, whichever is first |
| Mentor messages and notes | Same as the child record |
| Safeguarding concerns | **Do not delete** without legal advice; these may need to be kept far longer |
| Donation records | At least 6 years (financial records) |
| Unused application photos | *Automatic:* deleted after 7 days if no application was submitted |
| Rate-limit counters | *Automatic:* deleted after 1 day |
| Audit log | At least 6 years; it cannot be edited or deleted by anyone through the platform |

---

## 6. Requests from families and individuals

Under the NDPA a person (or a child's guardian) may ask for a copy of their data, to correct it, or to have it deleted.

1. **Verify who is asking** before releasing or deleting anything. For a child, the requester must be the guardian named on the application, or the child's own account. **[DECIDE]** the verification steps and who does them.
2. **A copy of a child's data:** an admin opens the child's page (Admin, Beneficiaries) and chooses **Download all data (JSON)**. The file lists the child's record, application, progress, support, quiz results, thank-you messages, mentor matches, messages and notes, and links to files that work for one hour. It deliberately **leaves out** safeguarding concerns and other people's contact details (donors, mentors). Releasing safeguarding information is a legal decision. The download is recorded in the audit log.
3. **Deleting a child's data:** an admin opens the same page and chooses **Delete all data for this child**, then types the child's TACE ID to confirm. This removes the child's record, application, mentor messages and notes, quiz results, thank-yous, progress and support records, notifications, photographs, certificates, documents, and sign-in account, in one step. Donation records are kept with the link to the child removed, and any story about the child is unpublished and unlinked (an admin should then edit or delete the story text). The deletion is recorded in the audit log (TACE ID and counts only).
4. **Safeguarding records:** deletion is refused while any exist. The admin must tick a separate box to delete them too. **Ask the legal trustee first.**
5. **Backups:** deleted data can remain in Supabase backups until they expire. **[DECIDE]** and state this in the privacy notice (Ticket 5E covers backups).
6. **Respond within** the time the NDPA requires (**[DECIDE]**: confirm the period, often one month) and keep a record of each request.
7. **Corrections** are made by an admin in the normal screens.

---

## 7. Outside services that receive data

| Service | Receives | Purpose | Notes |
|---|---|---|---|
| **Supabase** | All stored data, sign-in accounts, files | Database, authentication, file storage | Production project region **[DECIDE]**; sign a data processing agreement |
| **Vercel** | Web requests (IP addresses, pages visited) and the server-side code that handles the data | Hosting | Standard hosting logs |
| **Resend** | Recipient email address and the email text | Sending approval, rejection, receipt, notification and sign-up emails | Emails never include a child's surname or health details. Plain language, no marketing |
| **Google (Gemini API)** | An age bracket, the two career themes with example jobs, and up to two short sentences the child typed, **with names, school, phone numbers, emails, links and social media names removed first** | Writing the friendly career message after the quiz | See 7.1 |
| **Google (sign-in)** | Name and email of adults who choose "Continue with Google" | Sign-in | Optional |
| **Error monitoring (planned, 5C)** | Error details only, with personal data scrubbed | Fixing faults | Not yet in use |

### 7.1 The career quiz and the AI provider
- The request contains **no name, surname, TACE ID, location, school, contact details or account id**. The only free text is what the child typed in two optional boxes, and the platform removes the child's own names and school, phone numbers, emails, links and social media names before sending it. The quiz also asks children not to write names, their school or phone numbers.
- The AI never chooses the career themes. Scores are worked out by the platform; the AI only words a message about two themes it is given, and its answer is discarded if it names a programme the foundation does not run, contains links, or looks wrong. If anything fails the child sees a fixed message instead.
- **[DECIDE] Before launch the foundation must use a paid Gemini API plan** whose terms state that API data is not used to train models, and confirm this in writing from the current terms. The free tier may use submitted content to improve products, so it must not be used with real children. The privacy page must say plainly that a short, anonymous summary of a child's quiz answers is sent to Google to write the message.
- The provider is isolated in one function (`callModel` in `lib/career/ai.ts`), so it can be switched or the feature turned off by removing the API key.

---

## 8. Security measures (summary)

- Sign-in with a password or Google. **Admins must also use an authenticator app** (two-factor), enforced on every admin page and action. At least two admins are recommended.
- Row-level security on every table, tested automatically against seven kinds of user, plus the storage buckets.
- Suspended or inactive accounts lose all database access immediately.
- Input checked on the server for every action; rate limits on sign-in, sign-up and password reset; security headers and a content security policy.
- Files are private; links expire after one hour; unused application photos are deleted after 7 days.
- Every important admin action is written to an audit log that cannot be edited.
- Secrets are kept in environment variables, never in the code; the repository has been checked for leaked keys.

---

## 9. Breaches

**[DECIDE]** A written breach procedure: who is told, how fast. The NDPA requires notifying the Commission, and affected people where there is a high risk, within 72 hours of becoming aware. `docs/RUNBOOK.md` (Ticket 5E) should include how to switch off access quickly (deactivate accounts, pause every match, rotate keys).

---

## 10. Checklist for the legal trustee

- [ ] Registration with the Nigeria Data Protection Commission, and whether a data protection impact assessment is needed
- [ ] Lawful basis for each kind of data; consent wording on the application form; how a guardian's consent for a child is recorded and withdrawn
- [ ] Retention periods in section 5
- [ ] Safeguarding records: how long to keep, and who may see them
- [ ] Transfer of data outside Nigeria (Supabase region, Vercel, Resend, Google)
- [ ] Data processing agreements with Supabase, Vercel, Resend and Google
- [ ] Wording of the privacy, terms and child-protection pages, including the AI sentence in 7.1
- [ ] The request and breach procedures in sections 6 and 9
