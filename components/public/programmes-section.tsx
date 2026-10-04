import Link from "next/link";
import {
  BookOpen,
  Wrench,
  Handshake,
  Target,
  Store,
  HeartHandshake,
  ArrowRight,
} from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";

const PROGRAMMES = [
  {
    icon: BookOpen,
    title: "Education Support",
    description:
      "Keeping vulnerable children in school and academically supported.",
    color: "bg-tace-blue/10 text-tace-blue",
  },
  {
    icon: Wrench,
    title: "Vocational Training",
    description: "Practical skills development in trades and crafts.",
    color: "bg-tace-yellow/10 text-tace-yellow",
  },
  {
    icon: Handshake,
    title: "Mentorship",
    description: "Professional guidance and support from caring mentors.",
    color: "bg-tace-green/10 text-tace-green",
  },
  {
    icon: Target,
    title: "Career Discovery",
    description:
      "Secondary school career exposure to futures students never knew existed.",
    color: "bg-tace-red/10 text-tace-red",
  },
  {
    icon: Store,
    title: "Enterprise Development",
    description:
      "Beauty salon and barber shop training in TACE enterprise centres.",
    color: "bg-[rgba(142,68,173,0.1)] text-[#8e44ad]",
  },
  {
    icon: HeartHandshake,
    title: "Community Outreach",
    description: "Orphanage visits and welfare support across our communities.",
    color: "bg-tace-navy/[0.06] text-tace-navy",
  },
];

export function ProgrammesSection() {
  return (
    <section className="bg-tace-lgray px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          tag="Our Programmes"
          title="Six ways we walk with children"
          subtitle="From keeping a child in school to walking them into a career — TACE programmes address every stage of a child's journey to independence."
          center
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMMES.map((programme) => (
            <Link
              key={programme.title}
              href="/programmes"
              className="rounded-2xl border border-border bg-white p-7 transition-all hover:-translate-y-1 hover:border-tace-blue hover:shadow-lg"
            >
              <div
                className={`flex size-[52px] items-center justify-center rounded-xl ${programme.color}`}
              >
                <programme.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-heading text-[17px] font-extrabold text-tace-navy">
                {programme.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tace-gray">
                {programme.description}
              </p>
              <span className="mt-3.5 inline-flex items-center gap-1 text-[13px] font-bold text-tace-blue">
                Learn more <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
