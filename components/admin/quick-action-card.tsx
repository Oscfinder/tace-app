import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

const ACCENTS = {
  blue: { bg: "bg-[#E8F6FD]", icon: "bg-tace-blue text-white" },
  navy: { bg: "bg-[#ECEDF4]", icon: "bg-tace-navy text-white" },
  green: { bg: "bg-[#EAF8EF]", icon: "bg-tace-green text-white" },
  pink: { bg: "bg-[#FFF1F4]", icon: "bg-tace-red text-white" },
  purple: { bg: "bg-[#F4F1FF]", icon: "bg-[#7759E8] text-white" },
} as const;

export function QuickActionCard({
  icon: Icon,
  label,
  subtitle,
  href,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  href: string;
  accent: keyof typeof ACCENTS;
}) {
  const { bg, icon } = ACCENTS[accent];

  return (
    <Link
      href={href}
      className={`flex min-h-[68px] items-center gap-2.5 rounded-[12px] p-3 transition-transform hover:-translate-y-0.5 ${bg}`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${icon}`}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-bold leading-tight text-tace-navy">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-tace-gray">
          {subtitle}
        </span>
      </span>
      <ArrowRight className="size-3.5 shrink-0 text-tace-gray/50" />
    </Link>
  );
}
