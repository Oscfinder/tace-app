import Link from "next/link";
import type { LucideIcon } from "lucide-react";

const ACCENTS = {
  blue: "bg-[#E8F6FD] text-tace-blue",
  red: "bg-[#FDECEC] text-tace-red",
  yellow: "bg-[#FEF6E2] text-tace-yellow",
  green: "bg-[#EAF8EF] text-tace-green",
  slate: "bg-[#F1EFFB] text-tace-gray",
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = "blue",
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: keyof typeof ACCENTS;
  href?: string;
}) {
  const content = (
    <div className="flex flex-col gap-2.5 rounded-[14px] border border-[#ECEFF3] bg-white p-5 transition-shadow hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-tace-gray">{label}</span>
        <span
          className={`flex size-[34px] shrink-0 items-center justify-center rounded-[9px] ${ACCENTS[accent]}`}
        >
          <Icon className="size-[17px]" />
        </span>
      </div>
      <span className="font-heading text-[28px] font-bold text-tace-navy">
        {value}
      </span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
