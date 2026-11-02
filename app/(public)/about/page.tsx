import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageHeader, Prose } from "@/components/public/page-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About us | TACE Welfare Foundation",
  description:
    "TACE Welfare Foundation helps vulnerable children in Lagos become skilled, self-sufficient young adults through education, mentorship and training.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { title: "Children first", text: "Every decision starts with what keeps a child safe, in school and growing." },
  { title: "Dignity", text: "Families are treated with respect. A child is never shown or named publicly without their guardian's consent." },
  { title: "Accountability", text: "Every application is reviewed by people. Gifts are recorded, and our trustees can see where they go." },
  { title: "Safety", text: "Mentors are vetted, and all messages between a mentor and a child happen inside the platform where trained staff can see them." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        tag="About us"
        title="Guiding children toward independence"
        subtitle="We help vulnerable children become skilled, self-sufficient young adults, through education, mentorship, vocational training and genuine human connection."
      />
      <PageBody>
        <Prose>
          <h2>Who we are</h2>
          <p>
            TACE Welfare Foundation is a registered charity (CAC registration IT/9786795) based in Festac Town, Lagos, Nigeria. We work with children whose families cannot, on their own, keep them in school or open a path to a future of their own.
          </p>
          <h2>What we want to change</h2>
          <p>
            Too many bright children stop learning because of cost, distance or a lack of guidance. We want each child we support to stay in school, discover what they are good at, learn a skill, and one day stand on their own feet.
          </p>
          <h2>Our mission</h2>
          <ul>
            <li>Keep vulnerable children in school and academically supported.</li>
            <li>Connect children with professional mentors who guide their development.</li>
            <li>Let donors and sponsors give with confidence and see the difference they make.</li>
            <li>Follow every child&apos;s journey, from the day they are identified to the day they are independent.</li>
          </ul>
          <h2>Our values</h2>
        </Prose>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border bg-tace-lgray p-5">
              <dt className="font-heading text-lg font-extrabold text-tace-navy">{v.title}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-tace-gray">{v.text}</dd>
            </div>
          ))}
        </dl>
        <Prose>
          <h2>How we are run</h2>
          <p>
            The foundation is governed by a Board of Trustees, who assess and approve every child accepted into our programmes. Staff and trustees use this website to review applications, match mentors and record every gift and every kind of support given. Our{" "}
            <Link href="/child-protection-policy">child protection policy</Link> and{" "}
            <Link href="/privacy">privacy policy</Link> explain how we keep children safe and how we look after information about them.
          </p>
        </Prose>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button render={<Link href="/programmes" />} size="lg" className="bg-tace-blue text-white hover:bg-tace-blue/90">
            See our programmes
          </Button>
          <Button render={<Link href="/contact" />} size="lg" variant="outline">
            Get in touch
          </Button>
        </div>
      </PageBody>
    </>
  );
}
