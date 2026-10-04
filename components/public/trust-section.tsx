import {
  Landmark,
  FileCheck,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";

const INDICATORS = [
  { icon: Landmark, label: "CAC Registered (RC: IT/9786795)" },
  { icon: FileCheck, label: "TIN: 2622487847179" },
  { icon: Users, label: "Transparent governance — board of trustees" },
  {
    icon: ScrollText,
    label: "Every donation accounted for — impact reports published",
  },
  { icon: ShieldCheck, label: "Child protection policy in place" },
];

export function TrustSection() {
  return (
    <section className="bg-tace-lgray px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-[1280px] text-center">
        <SectionHeading
          tag="Committed to Transparency"
          title="Why Trust TACE"
          subtitle="We are fully registered, accountable, and committed to showing you exactly how every naira is used."
          center
        />
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {INDICATORS.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-5 py-3.5 text-left text-sm font-bold text-tace-navy"
            >
              <item.icon className="size-5 shrink-0 text-tace-blue" />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
