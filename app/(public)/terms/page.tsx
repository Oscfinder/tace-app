import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, PageBody, PageHeader, Prose } from "@/components/public/page-shell";
import { getFoundationSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Terms of use | TACE Welfare Foundation",
  description: "The rules for using the TACE Welfare Foundation website and accounts.",
  alternates: { canonical: "/terms" },
};

const FALLBACK_EMAIL = "tacefoundationinfo@gmail.com";

// Remove <DraftNotice /> only after the legal trustee has signed the text off.
export default async function TermsPage() {
  const settings = await getFoundationSettings();
  const email = settings.contact_email || FALLBACK_EMAIL;
  return (
    <>
      <PageHeader tag="Legal" title="Terms of use" subtitle="The simple rules for using this website and your account." />
      <PageBody>
        <DraftNotice />
        <Prose>
          <h2>About these terms</h2>
          <p>
            This website is run by TACE Welfare Foundation (CAC registration IT/9786795), Festac Town, Lagos, Nigeria. By using it, or by creating an account, you agree to these terms and to our <Link href="/privacy">privacy policy</Link> and <Link href="/child-protection-policy">child protection policy</Link>.
          </p>

          <h2>Accounts</h2>
          <ul>
            <li>Give us true information. Every account, application and mentor is reviewed by our team, and we may refuse, pause or close an account.</li>
            <li>Keep your password private and do not share your account. If you think someone else has used it, tell us at once.</li>
            <li>Sponsors, mentors and members see only what their role allows. Do not try to reach anything else.</li>
          </ul>

          <h2>Applying for support</h2>
          <p>
            Applying does not guarantee support. Decisions are made by our team and Board of Trustees, based on need and what we can offer. We may ask for more information, and we may contact the family to check details.
          </p>

          <h2>Giving and sponsoring</h2>
          <ul>
            <li>Gifts are made by bank transfer to the account shown on our <Link href="/donate">donate page</Link>. Check the details there before sending money. We will never ask you to send money to a personal account or by any other method.</li>
            <li>Gifts are used for the education, training and mentoring of children in our programmes, as described on that page. Where a gift is for a particular purpose, we will use it for that purpose where we can.</li>
            <li>Sponsoring a child means supporting the programme that helps them. It does not give you any right to contact the child or family outside this platform, to visit, or to receive personal details.</li>
            <li>We record gifts after we see them in our bank account and can then send a receipt.</li>
          </ul>

          <h2>Mentors and messages</h2>
          <ul>
            <li>Messages between a mentor and a child are sent only through this platform and can be read by our administrators.</li>
            <li>Do not share phone numbers, addresses or social media names, and do not ask a child to move to another app. We may block these messages, and may pause or end a mentoring match at any time.</li>
            <li>Be kind and appropriate at all times. Anything that puts a child at risk will be treated as a safeguarding matter and may be reported to the authorities.</li>
          </ul>

          <h2>What you must not do</h2>
          <ul>
            <li>Use the website to harm, harass or deceive anyone, or to find or contact a child outside this platform.</li>
            <li>Try to break into the site, read other people&apos;s information or overload it.</li>
            <li>Copy photographs or stories of children for any other use.</li>
          </ul>

          <h2>Our content</h2>
          <p>
            The text, design and logos on this website belong to the foundation or are used with permission. Photographs and stories of children are shown with their guardians&apos; consent and must not be copied or used elsewhere without our written permission.
          </p>

          <h2>Availability and liability</h2>
          <p>
            We work hard to keep the website running but cannot promise it will always be available or free from errors. To the extent the law allows, the foundation is not responsible for losses that come from using the website, other than those the law does not allow us to exclude.
          </p>

          <h2>Changes and law</h2>
          <p>
            We may update these terms, and will say so on this page. These terms are governed by the laws of the Federal Republic of Nigeria.
          </p>

          <h2>Contact</h2>
          <p>Questions about these terms: <a href={`mailto:${email}`}>{email}</a>.</p>
        </Prose>
      </PageBody>
    </>
  );
}
