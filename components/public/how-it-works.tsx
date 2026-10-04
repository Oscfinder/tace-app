import Link from "next/link";
import { Heart, Target, Handshake } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { cn } from "@/lib/utils";

const CARDS = [
  {
    icon: Heart,
    title: "Sponsor a Child",
    description:
      "From ₦20,000/month, give a child access to education, mentorship, and life skills training.",
    amount: "From ₦20,000/month",
    href: "/sponsor",
    border: "before:bg-tace-blue",
    iconBg: "bg-tace-blue/10 text-tace-blue",
  },
  {
    icon: Target,
    title: "Make a Donation",
    description:
      "Every naira makes a difference. Support our programmes with a one-time or recurring gift.",
    amount: "Any amount",
    href: "/donate",
    border: "before:bg-tace-yellow",
    iconBg: "bg-tace-yellow/10 text-tace-yellow",
  },
  {
    icon: Handshake,
    title: "Become a Mentor",
    description:
      "Share your professional experience with a young person. 1 hour a month can change a life.",
    amount: "1 hour/month minimum",
    href: "/mentor",
    border: "before:bg-tace-green",
    iconBg: "bg-tace-green/10 text-tace-green",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-white px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          tag="How It Works"
          title="You can help end poverty — starting in childhood"
          subtitle="Three ways your support changes a child's future permanently."
          center
        />
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className={cn(
                "relative overflow-hidden rounded-[20px] border border-border bg-white p-8 text-center transition-all before:absolute before:inset-x-0 before:top-0 before:h-1 hover:-translate-y-1.5 hover:shadow-xl",
                card.border,
              )}
            >
              <div
                className={cn(
                  "mx-auto flex size-[72px] items-center justify-center rounded-2xl",
                  card.iconBg,
                )}
              >
                <card.icon className="size-8" />
              </div>
              <h3 className="mt-5 font-heading text-xl font-extrabold text-tace-navy">
                {card.title}
              </h3>
              <p className="mt-2.5 text-[15px] font-medium leading-relaxed text-tace-gray">
                {card.description}
              </p>
              <span className="mt-4 inline-block rounded-full bg-tace-lgray px-3.5 py-1.5 text-[13px] font-bold text-tace-blue">
                {card.amount}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
