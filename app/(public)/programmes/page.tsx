import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Wrench,
  Handshake,
  Target,
  Store,
  HeartHandshake,
} from "lucide-react";
import { PageBody, PageHeader } from "@/components/public/page-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our programmes | TACE Welfare Foundation",
  description:
    "Six programmes that take a child from school support to a career: education, vocational training, mentorship, career discovery, enterprise development and community outreach.",
  alternates: { canonical: "/programmes" },
};

const PROGRAMMES = [
  {
    icon: BookOpen,
    title: "Education Support",
    summary: "Keeping vulnerable children in school and academically supported.",
    points: ["Help with school costs so a child can stay enrolled", "Progress is recorded by staff and shared with the family and sponsor", "Extra support where a child is falling behind"],
    color: "bg-tace-blue/10 text-tace-blue",
  },
  {
    icon: Wrench,
    title: "Vocational Training",
    summary: "Practical skills development in trades and crafts.",
    points: ["Hands-on training for young people ready to learn a trade", "Certificates recorded on the child's own page", "A route to earning an income"],
    color: "bg-tace-yellow/10 text-tace-navy",
  },
  {
    icon: Handshake,
    title: "Mentorship",
    summary: "Professional guidance and support from caring mentors.",
    points: ["Mentors are vetted before they are matched with a child", "Both the mentor and the child's guardian must agree first", "All messages stay inside the platform, where trained staff can see them"],
    color: "bg-tace-green/10 text-tace-green",
  },
  {
    icon: Target,
    title: "Career Discovery",
    summary: "Secondary school career exposure to futures students never knew existed.",
    points: ["A short, friendly quiz helps a child see what they might enjoy", "Talks and exposure to different careers", "Results help match children with the right mentor"],
    color: "bg-tace-red/10 text-tace-red",
  },
  {
    icon: Store,
    title: "Enterprise Development",
    summary: "Beauty salon and barber shop training in TACE enterprise centres.",
    points: ["Practical, job-ready training", "Learning how to run a small business", "A start toward working for yourself"],
    color: "bg-[rgba(142,68,173,0.1)] text-[#8e44ad]",
  },
  {
    icon: HeartHandshake,
    title: "Community Outreach",
    summary: "Orphanage visits and welfare support across our communities.",
    points: ["Visits and practical help for children in care", "Welfare support for families in need", "Volunteers and members are welcome"],
    color: "bg-tace-navy/[0.06] text-tace-navy",
  },
];

export default function ProgrammesPage() {
  return (
    <>
      <PageHeader
        tag="Our programmes"
        title="Support at every stage of a child's journey"
        subtitle="From keeping a child in school to walking them into a career, our programmes work together."
      />
      <PageBody wide>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PROGRAMMES.map((p) => (
            <section key={p.title} className="rounded-[20px] border border-border bg-white p-6">
              <span className={`inline-grid size-12 place-items-center rounded-xl ${p.color}`}>
                <p.icon className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 font-heading text-xl font-extrabold text-tace-navy">{p.title}</h2>
              <p className="mt-2 text-sm font-medium leading-relaxed text-tace-gray">{p.summary}</p>
              <ul className="mt-4 space-y-2 text-sm leading-relaxed text-tace-gray">
                {p.points.map((pt) => (
                  <li key={pt} className="ml-5 list-disc pl-1">{pt}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Button render={<Link href="/sponsor" />} size="lg" className="bg-tace-blue text-white hover:bg-tace-blue/90">
            Sponsor a child
          </Button>
          <Button render={<Link href="/donate" />} size="lg" variant="outline">
            Donate
          </Button>
          <Button render={<Link href="/apply" />} size="lg" variant="outline">
            Apply for support
          </Button>
        </div>
      </PageBody>
    </>
  );
}
