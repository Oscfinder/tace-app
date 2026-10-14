import Link from "next/link";
import { Heart, UserPlus, GraduationCap, Building, Users } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";

const CARDS = [
  {
    icon: Heart,
    title: "Donate",
    description:
      "Give once or regularly to support a child's education and welfare.",
    href: "/donate",
    cta: "Give Now",
    color: "bg-tace-blue/10 text-tace-blue",
  },
  {
    icon: UserPlus,
    title: "Sponsor a Child",
    description:
      "Build a long-term relationship with a child and follow their progress.",
    href: "/sponsor",
    cta: "Sponsor Now",
    color: "bg-tace-yellow/10 text-tace-yellow",
  },
  {
    icon: GraduationCap,
    title: "Become a Mentor",
    description:
      "Give your professional expertise to a child who needs guidance.",
    href: "/signup/mentor",
    cta: "Mentor a Child",
    color: "bg-tace-green/10 text-tace-green",
  },
  {
    icon: Building,
    title: "Partner With Us",
    description:
      "Churches, corporates, and NGOs — build something meaningful with us.",
    href: "/contact",
    cta: "Partner Now",
    color: "bg-tace-navy/[0.06] text-tace-navy",
  },
  {
    icon: Users,
    title: "Become a Member",
    description:
      "Join TACE as a member and take part in our mission year-round.",
    href: "/signup/member",
    cta: "Join TACE",
    color: "bg-[#7759E8]/10 text-[#7759E8]",
  },
];

export function GetInvolved() {
  return (
    <section className="bg-white px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          tag="Get Involved"
          title="Join the Movement"
          subtitle="There are many ways to be part of TACE. Choose the one that fits your heart, your time, and your capacity."
          center
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border p-7 text-center transition-all hover:-translate-y-1.5"
            >
              <div
                className={`mx-auto flex size-16 items-center justify-center rounded-2xl ${card.color}`}
              >
                <card.icon className="size-7" />
              </div>
              <h3 className="mt-5 font-heading text-[17px] font-extrabold text-tace-navy">
                {card.title}
              </h3>
              <p className="mt-2 mb-5 text-[13px] leading-relaxed text-tace-gray">
                {card.description}
              </p>
              <Button
                render={<Link href={card.href} />}
                className="w-full bg-tace-blue text-white hover:bg-tace-blue/90"
              >
                {card.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
