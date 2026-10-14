import Link from "next/link";
import { Target, MessageCircle, BarChart3 } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Target,
    title: "Two Mentorship Tracks",
    description:
      "Career mentors offer general professional guidance; Tech mentors focus on digital skills.",
  },
  {
    icon: MessageCircle,
    title: "Safe, Monitored Connection",
    description:
      "All communication happens on the TACE platform — monitored, consent-based, and admin-visible.",
  },
  {
    icon: BarChart3,
    title: "Monthly Progress",
    description:
      "Mentors submit a brief monthly update. Every child's development is tracked and documented.",
  },
];

const PLACEHOLDER_MENTORS = [
  { initial: "E", name: "Dr. Emeka", role: "Medical Doctor", track: "Career" },
  { initial: "A", name: "Adaeze", role: "Software Engineer", track: "Tech" },
  { initial: "J", name: "Mr. Joseph", role: "Educator", track: "Career" },
  { initial: "T", name: "Theresa", role: "Lawyer", track: "Career" },
];

export function MentorshipSection() {
  return (
    <section
      id="mentor"
      className="bg-gradient-to-br from-tace-navy to-[#0d2137] px-4 py-20 md:px-8 md:py-[88px]"
    >
      <div className="mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            tag="Mentorship Programme"
            title="Our Mentorship Programme"
            subtitle="Every TACE beneficiary can be matched with a professional mentor across two tracks — Career (general professional guidance) and Tech (digital skills) — for a minimum 6-month commitment of monitored, virtual sessions."
            dark
          />
          <div className="mt-9 flex flex-col gap-5">
            {STEPS.map((step) => (
              <div key={step.title} className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-tace-blue/30 bg-tace-blue/15 text-tace-blue">
                  <step.icon className="size-5" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-white">
                    {step.title}
                  </h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/60">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button
              render={<Link href="/signup/mentor" />}
              size="lg"
              className="bg-tace-yellow text-tace-navy hover:bg-tace-yellow/90"
            >
              Become a Mentor
            </Button>
            <Button
              render={<Link href="/signup/mentor" />}
              size="lg"
              variant="outline"
              className="border-white/50 bg-transparent text-white hover:bg-white/10"
            >
              Learn More
            </Button>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-4">
            {PLACEHOLDER_MENTORS.map((mentor) => (
              <div
                key={mentor.name}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition-all hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-tace-blue text-lg font-bold text-white">
                  {mentor.initial}
                </div>
                <h4 className="mt-3 text-sm font-bold text-white">
                  {mentor.name}
                </h4>
                <p className="text-xs font-medium text-white/50">
                  {mentor.role}
                </p>
                <span className="mt-2 inline-block rounded-full bg-tace-blue/20 px-2.5 py-1 text-[11px] font-bold text-tace-blue">
                  {mentor.track}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-center">
            <div className="font-heading text-3xl font-extrabold text-tace-yellow">
              6 months
            </div>
            <div className="mt-1 text-sm font-medium text-white/50">
              Minimum mentor commitment
            </div>
            <div className="mt-2 text-[13px] font-medium text-white/40">
              1 check-in per month · Fully virtual
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
