import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, PageBody, PageHeader, Prose } from "@/components/public/page-shell";
import { getFoundationSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Privacy policy | TACE Welfare Foundation",
  description: "What information TACE Welfare Foundation collects, why, who can see it, and your rights.",
  alternates: { canonical: "/privacy" },
};

const FALLBACK_EMAIL = "tacefoundationinfo@gmail.com";

// Written from docs/DATA_PROTECTION.md, which describes what the platform really
// does. Keep the two in step. Remove <DraftNotice /> only after the legal trustee
// has signed the text off.
export default async function PrivacyPage() {
  const settings = await getFoundationSettings();
  const email = settings.contact_email || FALLBACK_EMAIL;
  return (
    <>
      <PageHeader
        tag="Legal"
        title="Privacy policy"
        subtitle="We look after information about children with great care. This page explains what we hold and why, in plain words."
      />
      <PageBody>
        <DraftNotice />
        <Prose>
          <h2>Who we are</h2>
          <p>
            TACE Welfare Foundation (CAC registration IT/9786795, Festac Town, Lagos, Nigeria) decides why and how the information on this website is used. This makes us the &quot;data controller&quot; under the Nigeria Data Protection Act 2023. To ask us anything about your information, write to <a href={`mailto:${email}`}>{email}</a>.
          </p>

          <h2>What we collect, and why</h2>
          <h3>If you apply for support for a child</h3>
          <ul>
            <li>The child&apos;s name, date of birth, gender, nationality, address, contact details and photograph.</li>
            <li>The guardian&apos;s name, relationship, contact details, address and occupation, and details of any organisation applying on the family&apos;s behalf.</li>
            <li>School and education details, household circumstances and income.</li>
            <li><strong>Health information</strong> (conditions, disabilities, treatment), so that support is safe and suitable.</li>
            <li>Interests, talents and hopes, so we can match the right support and mentor.</li>
            <li>The consents given, including whether the child&apos;s first name, age and photograph may be shown publicly, who gave them and when.</li>
          </ul>
          <p>We use this to decide whether we can help, to contact the family, and, if a child is accepted, to run the programme and follow their progress.</p>
          <h3>If a child is accepted</h3>
          <p>
            We keep progress updates written by our staff, the support given, certificates and documents, thank-you messages the child writes to a sponsor, the result of the career quiz, and, if the child has a mentor, the messages between them and the mentor&apos;s notes.
          </p>
          <h3>If you are a sponsor, member, mentor or donor</h3>
          <ul>
            <li>Your name, email, phone number and role. Your password is never stored in a readable form.</li>
            <li>Mentors also tell us their profession, expertise and availability, and we record the checks made before a mentor is approved.</li>
            <li>For donations: your name, contact details, the amount, purpose and bank reference. We never receive your card or bank login details; gifts are made by bank transfer.</li>
          </ul>
          <h3>If you visit the website</h3>
          <p>
            We do not use advertising or analytics cookies. We use only the cookies needed to keep a signed-in person signed in. To protect the site from abuse, we briefly count requests using a scrambled (hashed) form of your internet address, which is deleted within a day.
          </p>

          <h2>Who can see it</h2>
          <ul>
            <li><strong>Visitors</strong> see only published stories and projects, and, for children whose guardians agreed, a first name, age, stage and photograph.</li>
            <li><strong>A sponsor</strong> sees only their linked child&apos;s first name, age, stage, photo, interests, school class, progress and support given. Never a surname, address, family details, income or health information.</li>
            <li><strong>A mentor</strong> sees only the children they are matched with, and only after they have been vetted and both the mentor and the guardian have agreed. Never an address, family details, income or health information.</li>
            <li><strong>The child and guardian</strong> see their own record.</li>
            <li><strong>Our administrators</strong> can see everything, so that they can run the programme and keep children safe. Their actions are recorded in a log that cannot be edited.</li>
          </ul>
          <p>These rules are enforced inside the database itself, not only on the website, and are tested automatically.</p>

          <h2>Messages between mentors and children</h2>
          <p>
            For a child&apos;s safety, messages between a mentor and a child are kept on this platform, where our administrators can read them. Contact details such as phone numbers are blocked or held for review. Either side can raise a concern, and we can pause a mentoring match at any time. See our <Link href="/child-protection-policy">child protection policy</Link>.
          </p>

          <h2>The career quiz and artificial intelligence</h2>
          <p>
            <strong>
              To write the friendly message at the end of the career quiz, a short, anonymous summary of a child&apos;s quiz answers is sent to Google&apos;s Gemini artificial intelligence service.
            </strong>{" "}
            It contains no name, surname, school, location, contact details or account number; we remove names, phone numbers, email addresses and links from anything a child typed before it is sent. The AI does not choose the careers suggested: our own system does, and the AI only words a message about them. If anything looks wrong, the child sees a fixed message instead.
          </p>

          <h2>Outside services we use</h2>
          <ul>
            <li><strong>Supabase</strong> stores our database, sign-in accounts, photographs and documents.</li>
            <li><strong>Vercel</strong> runs the website.</li>
            <li><strong>Resend</strong> sends our emails.</li>
            <li><strong>Google</strong> provides the quiz message service above and, if you choose &quot;Continue with Google&quot;, sign-in (we receive your name and email).</li>
            <li>An error-tracking service tells us when something breaks. We configure it so that it receives no names, emails or message text.</li>
          </ul>
          <p>These services process information for us under our instructions. Some may store it outside Nigeria.</p>

          <h2>How long we keep it</h2>
          <p>
            We keep information only as long as we need it for the reasons above, and for as long as the law requires us to keep financial and safeguarding records. Applications that are not approved are deleted after a limited period. Photographs are removed when consent is withdrawn or the child leaves the programme. Deleted information may remain in secure backups until they expire.
          </p>

          <h2>Your rights</h2>
          <p>
            You, or a child&apos;s guardian, may ask us for a copy of the information we hold, ask us to correct it, or ask us to delete it. We will check who you are first, because we must not give a child&apos;s information to the wrong person. Some safeguarding and financial records may have to be kept by law, and we will explain if so. You may also complain to the Nigeria Data Protection Commission.
          </p>
          <p>To make a request, write to <a href={`mailto:${email}`}>{email}</a>.</p>

          <h2>Keeping it secure</h2>
          <p>
            Children&apos;s photographs and documents are kept private and opened only through links that expire after an hour. Everything travels over encrypted connections. If we ever learn that personal information has been lost or seen by someone who should not have seen it, we will act at once and tell the people affected and the regulator as the law requires.
          </p>

          <h2>Changes</h2>
          <p>If we change this policy in an important way, we will say so on this page.</p>
        </Prose>
      </PageBody>
    </>
  );
}
