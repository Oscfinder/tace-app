"use client";

import { useState } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AMOUNTS = [
  { amount: "₦5,000", label: "One month of school supplies" },
  { amount: "₦20,000", label: "One month of full sponsorship" },
  { amount: "₦50,000", label: "Vocational training materials" },
  { amount: "₦240,000", label: "One year of full sponsorship" },
];

export function DonateSection() {
  const [active, setActive] = useState(0);

  return (
    <section
      className="bg-tace-navy px-4 py-20 md:px-8 md:py-[88px]"
      id="donate"
    >
      <div className="mx-auto grid max-w-[1280px] gap-16 lg:grid-cols-2 lg:items-center">
        <div>
          <SectionHeading
            tag="Make a Donation"
            title="Your gift changes lives — today"
            subtitle="See exactly what your support does for a child:"
            dark
          />
          <div className="mt-8 grid grid-cols-2 gap-3">
            {AMOUNTS.map((item, i) => (
              <button
                key={item.amount}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-2xl border-2 border-white/10 bg-white/[0.06] p-5 text-center transition-all",
                  active === i && "border-tace-yellow bg-tace-yellow/[0.08]",
                )}
              >
                <div className="font-heading text-xl font-extrabold text-white">
                  {item.amount}
                </div>
                <div className="mt-1 text-xs leading-snug text-white/50">
                  {item.label}
                </div>
              </button>
            ))}
          </div>
          <Button
            render={<Link href="/donate" />}
            size="lg"
            className="mt-7 bg-tace-yellow text-tace-navy hover:bg-tace-yellow/90"
          >
            Donate Now
          </Button>
        </div>

        <div className="rounded-[20px] border border-white/10 bg-white/[0.06] p-8">
          <h3 className="text-xs font-bold uppercase tracking-wide text-white/40">
            Foundation Bank Account
          </h3>
          <div className="mt-5 flex flex-col divide-y divide-white/[0.06]">
            {[
              ["Bank Name", "Stanbic IBTC Bank"],
              ["Account Name", "TACE Welfare Foundation"],
              ["Account Number", "Coming Soon"],
              ["TIN", "2622487847179"],
            ].map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between py-3.5"
              >
                <span className="text-sm text-white/40">{key}</span>
                <span
                  className={cn(
                    "text-sm font-bold text-white",
                    value === "Coming Soon" && "text-tace-yellow",
                  )}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-center text-[13px] leading-relaxed text-white/40">
            After your transfer, send your receipt to{" "}
            <strong className="text-tace-yellow">
              tacefoundationinfo@gmail.com
            </strong>{" "}
            and we will send you a formal acknowledgement.
          </p>
        </div>
      </div>
    </section>
  );
}
