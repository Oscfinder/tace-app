import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, PageBody, PageHeader, Prose } from "@/components/public/page-shell";
import { getFoundationSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Child protection policy | TACE Welfare Foundation",
  description: "How TACE Welfare Foundation keeps children safe, and how to raise a concern.",
  alternates: { canonical: "/child-protection-policy" },
};

const FALLBACK_EMAIL = "tacefoundationinfo@gmail.com";

// Remove <DraftNotice /> only after the legal trustee and the safeguarding lead
// have signed the text off. Name the safeguarding lead here once decided.
export default async function ChildProtectionPage() {
  const settings = await getFoundationSettings();
  const email = settings.contact_email || FALLBACK_EMAIL;
  return (
    <>
      <PageHeader
        tag="Legal"
        title="Child protection policy"
        subtitle="Every child has the right to be safe. This is what we do to make that true, and what we ask of everyone who works with us."
      />
      <PageBody>
        <DraftNotice />
        <div className="mb-8 rounded-xl border border-tace-red/30 bg-tace-red/5 p-5 text-tace-navy">
          <p className="font-heading text-lg font-extrabold">If a child is in danger now</p>
          <p className="mt-1 text-sm leading-relaxed">
            Call <strong>112</strong> (Nigeria&apos;s emergency number) or go to the nearest police station or hospital first. Then tell us at <a className="font-semibold underline" href={`mailto:${email}`}>{email}</a>, so that we can protect the child within our programmes.
          </p>
        </div>
        <Prose>
          <h2>Our promise</h2>
          <p>
            TACE Welfare Foundation does not tolerate abuse, neglect, exploitation or harm of any kind towards a child. We believe every concern should be taken seriously, and that a child will never be blamed for telling us about one.
          </p>

          <h2>Who this applies to</h2>
          <p>Our trustees, staff, volunteers, mentors, sponsors, members and anyone else acting for the foundation. By taking part, they agree to follow this policy.</p>

          <h2>How we keep children safe</h2>
          <ul>
            <li><strong>Checks before contact.</strong> A mentor is vetted before they are matched with a child. We check identity and references and make background checks and an interview, and record who decided and when.</li>
            <li><strong>Two agreements.</strong> A mentoring match opens only after both the mentor and the child&apos;s guardian have given consent.</li>
            <li><strong>Messages stay on the platform.</strong> Mentors and children write to each other only inside the TACE platform, where our administrators can read every conversation. There is a limit on how many messages can be sent each hour.</li>
            <li><strong>No private contact details.</strong> Phone numbers, addresses, social media names and similar details are blocked or held for review. Mentors and sponsors must never ask a child to talk elsewhere, meet in private, or keep a secret.</li>
            <li><strong>We can stop it at once.</strong> An administrator can pause or end any mentoring match, and can suspend any account, immediately.</li>
            <li><strong>Limited information.</strong> A sponsor or mentor never sees a child&apos;s address, family details, income or health information.</li>
            <li><strong>Photographs and names.</strong> A child&apos;s photo or first name appears publicly only with their guardian&apos;s written consent, which can be withdrawn at any time. We never publish a surname, address or school.</li>
            <li><strong>A record of what staff do.</strong> Important actions by administrators are written to a log that nobody can edit.</li>
          </ul>

          <h2>How to behave</h2>
          <ul>
            <li>Treat every child with respect, patience and kindness.</li>
            <li>Never be alone with a child outside the platform, give gifts or money privately, or ask for anything in return.</li>
            <li>Never use language or behaviour that is abusive, sexual, frightening or shaming.</li>
            <li>Never take or share a child&apos;s photo, or share information about a child, without permission.</li>
          </ul>

          <h2>How to raise a concern</h2>
          <p>Tell us if you are worried about a child, even if you are not sure. You do not need proof.</p>
          <ul>
            <li><strong>On the platform:</strong> mentors, sponsors and children&apos;s accounts can raise a concern from their dashboard. It goes straight to our administrators, and only they can see it.</li>
            <li><strong>By email:</strong> <a href={`mailto:${email}`}>{email}</a>.</li>
            <li>Children and young people can also tell a trusted adult, such as a teacher, a parent or guardian, or a mentor, who can pass it on to us.</li>
          </ul>

          <h2>What happens next</h2>
          <ol className="ml-5 list-decimal space-y-2 pl-1">
            <li>We record the concern and a member of our safeguarding team reviews it promptly.</li>
            <li>If a child may be at risk, we act first to make them safe, which may include pausing a match or an account.</li>
            <li>We may involve the child&apos;s guardian, and where the law or the child&apos;s safety requires it, the police or child welfare authorities.</li>
            <li>We keep the details confidential, shared only with those who need to know, and we keep the record securely.</li>
            <li>No one will be punished for raising a concern in good faith.</li>
          </ol>

          <h2>Review</h2>
          <p>
            Our trustees review this policy regularly and after any serious incident. See also our <Link href="/privacy">privacy policy</Link> and <Link href="/terms">terms of use</Link>.
          </p>
        </Prose>
      </PageBody>
    </>
  );
}
