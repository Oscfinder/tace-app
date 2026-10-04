"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Search,
  ClipboardCheck,
  GraduationCap,
  Hammer,
  Award,
  Briefcase,
  PiggyBank,
  Building2,
  Rocket,
} from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { STOCK_IMAGES } from "@/lib/public/stock-images";
import { cn } from "@/lib/utils";

const STAGES = [
  {
    icon: Search,
    title: "Identified",
    description:
      "We find vulnerable children through community outreach, school referrals, and partner organisations.",
  },
  {
    icon: ClipboardCheck,
    title: "Assessed",
    description:
      "Every child is assessed for their needs, situation, and what kind of support would make the biggest difference.",
  },
  {
    icon: GraduationCap,
    title: "Education Support",
    description:
      "School fees, learning materials, tutoring, and examination support — keeping children in school.",
  },
  {
    icon: Hammer,
    title: "Vocational Training",
    description:
      "Practical skills training in our enterprise centres — real skills in a real business environment.",
  },
  {
    icon: Award,
    title: "Certification",
    description:
      "Children complete their training and earn a recognised certificate in their chosen skill.",
  },
  {
    icon: Briefcase,
    title: "Apprenticeship",
    description:
      "Hands-on, supervised work experience with an established tradesperson or business.",
  },
  {
    icon: PiggyBank,
    title: "Savings Programme",
    description:
      "Guided financial literacy and a structured savings plan to build a foundation for independence.",
  },
  {
    icon: Building2,
    title: "Employment",
    description:
      "Job placement support — connecting young adults with employers ready to hire.",
  },
  {
    icon: Rocket,
    title: "Business Owner",
    description:
      "Startup support and mentorship for young adults ready to run their own enterprise.",
  },
];

export function EmpowermentJourney() {
  const [active, setActive] = useState(0);
  const stage = STAGES[active];

  return (
    <section className="bg-tace-lgray px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          tag="The TACE Journey"
          title="From vulnerability to independence"
          subtitle="We walk with every child through nine structured stages — from the moment they are identified, to employment and business ownership."
        />
        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex gap-3 overflow-x-auto pb-2 lg:flex-col lg:gap-0 lg:overflow-visible lg:pb-0">
            {STAGES.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "flex shrink-0 items-start gap-4 border-b border-border py-3 text-left transition-colors lg:w-full lg:shrink lg:border-b lg:py-4",
                  "w-56 flex-col lg:flex-row lg:items-center",
                  active === i && "lg:bg-white/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors",
                    active === i
                      ? "bg-tace-blue text-white"
                      : "bg-border text-tace-gray",
                  )}
                >
                  {i + 1}
                </span>
                <span>
                  <span
                    className={cn(
                      "block text-sm font-extrabold transition-colors",
                      active === i ? "text-tace-blue" : "text-tace-navy",
                    )}
                  >
                    {s.title}
                  </span>
                </span>
              </button>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl">
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={STOCK_IMAGES.journey}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-tace-navy/95 via-tace-navy/10 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 p-8 text-white">
              <div className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-tace-yellow backdrop-blur-sm">
                <stage.icon className="size-5" />
              </div>
              <h4 className="mt-4 font-heading text-xl font-extrabold">
                {stage.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {stage.description}
              </p>
              <div className="mt-5 text-xs font-semibold text-white/40">
                Stage {active + 1} of {STAGES.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
