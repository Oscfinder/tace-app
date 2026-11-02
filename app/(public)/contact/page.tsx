import type { Metadata } from "next";
import { PageBody, PageHeader } from "@/components/public/page-shell";
import { ContactForm } from "@/components/public/contact-form";
import { getFoundationSettings } from "@/lib/site-settings";

export const metadata: Metadata = {
  title: "Contact us | TACE Welfare Foundation",
  description: "Write to TACE Welfare Foundation, or find our address.",
  alternates: { canonical: "/contact" },
};

const FALLBACK_EMAIL = "tacefoundationinfo@gmail.com";

export default async function ContactPage() {
  const settings = await getFoundationSettings();
  const email = settings.contact_email || FALLBACK_EMAIL;
  return (
    <>
      <PageHeader
        tag="Contact"
        title="We would love to hear from you"
        subtitle="Questions about giving, sponsoring, mentoring or applying? Write to us and a member of the team will reply."
      />
      <PageBody>
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <ContactForm />
          <aside className="space-y-6 text-tace-gray">
            <div>
              <h2 className="font-heading text-lg font-extrabold text-tace-navy">Email</h2>
              <a className="font-semibold text-tace-blue underline" href={`mailto:${email}`}>
                {email}
              </a>
            </div>
            <div>
              <h2 className="font-heading text-lg font-extrabold text-tace-navy">Address</h2>
              <p>Festac Town, Lagos, Nigeria</p>
            </div>
            <div>
              <h2 className="font-heading text-lg font-extrabold text-tace-navy">Registered charity</h2>
              <p>CAC registration IT/9786795</p>
            </div>
            <div className="rounded-xl border border-tace-red/30 bg-tace-red/5 p-4 text-sm">
              <strong className="text-tace-navy">If a child is in danger right now,</strong> call 112 (Nigeria&apos;s emergency number) first, then tell us. See our{" "}
              <a className="font-semibold text-tace-blue underline" href="/child-protection-policy">
                child protection policy
              </a>
              .
            </div>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
