import type { Metadata } from "next";
import Link from "next/link";
import { PageBody, PageHeader } from "@/components/public/page-shell";
import { ChildCard } from "@/components/public/sponsor-section";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/public/home-data";

export const metadata: Metadata = {
  title: "Sponsor a child | TACE Welfare Foundation",
  description: "Sponsor a child's education and follow their progress with TACE Welfare Foundation.",
  alternates: { canonical: "/sponsor" },
};

const STEPS = [
  { title: "Create a sponsor account", text: "Tell us a little about yourself. We review every account." },
  { title: "We link you to a child", text: "A member of our team links you to a child whose guardian has agreed." },
  { title: "Follow their progress", text: "See their school progress and the support given, with updates from our team." },
];

export default async function SponsorPage() {
  // Same cached, shared data as the home page: only children whose guardians
  // gave photography consent and who are part of a published project.
  const { beneficiaries } = await getHomeData();
  return (
    <>
      <PageHeader
        tag="Sponsor a child"
        title="Change one child's future"
        subtitle="These children have been assessed and approved by the TACE Board of Trustees. Only a first name, age and photo are ever shown, and only with the guardian's consent."
      />
      <PageBody wide>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-border bg-tace-lgray p-5">
              <span className="grid size-8 place-items-center rounded-full bg-tace-blue text-sm font-bold text-white" aria-hidden>
                {i + 1}
              </span>
              <h2 className="mt-3 font-heading text-lg font-extrabold text-tace-navy">{s.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-tace-gray">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button render={<Link href="/signup/sponsor" />} size="lg" className="bg-tace-blue text-white hover:bg-tace-blue/90">
            Become a sponsor
          </Button>
          <Button render={<Link href="/donate" />} size="lg" variant="outline">
            Give without sponsoring
          </Button>
        </div>

        <h2 className="mt-16 font-heading text-2xl font-extrabold text-tace-navy">Children waiting for a sponsor</h2>
        {beneficiaries.length > 0 ? (
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {beneficiaries.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-tace-lgray p-8 text-center font-semibold text-tace-gray">
            We are preparing our next children&apos;s profiles. Please check back soon, or create a sponsor account and we will be in touch.
          </p>
        )}
      </PageBody>
    </>
  );
}
