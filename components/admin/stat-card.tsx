import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

// Icon tile, corner arrow and the soft circle behind the card each take a
// colour from the design's palette.
const ACCENTS = {
  blue: { tile: "#e4f5ff", fg: "#0795e8", arrow: "#e8f6ff", wash: "rgba(21,159,234,.06)" },
  red: { tile: "#ffecef", fg: "#f45b69", arrow: "#fff0f2", wash: "rgba(244,91,105,.07)" },
  yellow: { tile: "#fff5d9", fg: "#efad13", arrow: "#fff8e7", wash: "rgba(245,181,27,.08)" },
  green: { tile: "#ddf8ef", fg: "#08aa7a", arrow: "#e8faf5", wash: "rgba(18,184,134,.08)" },
  purple: { tile: "#eee8ff", fg: "#7759e8", arrow: "#f1edff", wash: "rgba(119,89,232,.08)" },
  teal: { tile: "#ddf8fa", fg: "#06a7af", arrow: "#e8fbfc", wash: "rgba(21,195,200,.07)" },
  slate: { tile: "#eee8ff", fg: "#7759e8", arrow: "#f1edff", wash: "rgba(119,89,232,.08)" },
} as const;

export function StatCard({
  icon: Icon,
  label,
  value,
  accent = "blue",
  href,
  caption,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: keyof typeof ACCENTS;
  href?: string;
  caption?: string;
}) {
  const a = ACCENTS[accent];
  const content = (
    <div className="relative flex min-h-[106px] gap-3.5 overflow-hidden rounded-[13px] border border-[#e5edf6] bg-white px-[18px] py-[13px] shadow-[0_8px_28px_rgba(20,55,95,0.07)] transition-transform hover:-translate-y-0.5">
      <span
        className="pointer-events-none absolute -right-[30px] -bottom-[45px] h-[100px] w-[150px] rounded-full"
        style={{ background: a.wash }}
        aria-hidden
      />
      <span
        className="relative z-10 grid size-12 shrink-0 place-items-center rounded-[14px]"
        style={{ background: a.tile, color: a.fg }}
      >
        <Icon className="size-[23px]" />
      </span>
      <div className="relative z-10 min-w-0">
        <div className="mt-px text-[13px] font-bold text-[#62779a]">{label}</div>
        <div className="mt-[5px] mb-px truncate text-[23px] font-extrabold tracking-[-0.6px] text-[#102a4d]">
          {value}
        </div>
        {caption ? (
          <div className="text-[10px] font-semibold" style={{ color: a.fg }}>
            {caption}
          </div>
        ) : null}
      </div>
      {href ? (
        <span
          className="absolute top-3.5 right-[17px] z-10 grid size-7 place-items-center rounded-[10px]"
          style={{ background: a.arrow, color: a.fg }}
          aria-hidden
        >
          <ArrowUpRight className="size-4" />
        </span>
      ) : null}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
