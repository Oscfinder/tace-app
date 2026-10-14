import Link from "next/link";
import { Inbox, type LucideIcon } from "lucide-react";
import { PAGE_SIZE } from "@/lib/member/constants";

// Shared building blocks for the member dashboard, following
// docs/tace_member_dashboard_v2.html: white rounded panels on a pale-blue
// canvas, with blue / teal / purple / amber / pink accents.

export const ACCENTS = {
  blue: { fg: "#079ce8", wash: "#e5f6ff" },
  teal: { fg: "#0caf91", wash: "#e4fbf4" },
  purple: { fg: "#9277f6", wash: "#f0ebff" },
  amber: { fg: "#d99412", wash: "#fff4dc" },
  pink: { fg: "#ec4f7b", wash: "#ffecf2" },
} as const;
export type Accent = keyof typeof ACCENTS;

// Primary button look used across the member area (replaces the default
// near-black button): bright blue gradient.
export const PRIMARY_BTN =
  "bg-gradient-to-r from-m-blue to-m-blue2 text-white shadow-[0_8px_18px_#009de832] hover:opacity-95 hover:bg-gradient-to-r";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-m-blue uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-[27px] font-extrabold tracking-[-1px] text-m-ink">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1.5 text-sm text-m-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[18px] border border-m-line bg-white p-[22px] shadow-m-card ${className}`}
    >
      {children}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  href,
  linkLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-m-line bg-white shadow-m-card">
      <div className="flex items-center justify-between gap-3 px-[22px] pt-5 pb-3.5">
        <div>
          <h2 className="text-base font-extrabold tracking-[-0.3px] text-m-ink">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-xs text-m-muted">{subtitle}</p>
          ) : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-11 items-center text-xs font-bold whitespace-nowrap text-[#008fda] hover:underline"
          >
            {linkLabel ?? "View all"} ↗
          </Link>
        ) : null}
      </div>
      <div className="px-[22px] pb-[22px]">{children}</div>
    </section>
  );
}

export function Stat({
  label,
  value,
  foot,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  foot?: React.ReactNode;
  icon: LucideIcon;
  accent: Accent;
  href?: string;
}) {
  const { fg, wash } = ACCENTS[accent];
  const body = (
    <article className="relative min-h-[140px] overflow-hidden rounded-[17px] border border-m-line bg-white px-[21px] py-5 shadow-m-card transition-transform hover:-translate-y-0.5">
      <span
        className="absolute -right-[30px] -bottom-[51px] size-[100px] rounded-full"
        style={{ background: wash }}
        aria-hidden
      />
      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-m-muted">{label}</span>
        <span
          className="flex size-[41px] shrink-0 items-center justify-center rounded-[13px]"
          style={{ background: wash, color: fg }}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p
        className="m-head relative z-10 mt-3 mb-1 truncate text-[29px] font-extrabold tracking-[-1px] text-m-ink"
        title={String(value)}
      >
        {value}
      </p>
      {foot ? (
        <p className="relative z-10 text-[11px] text-[#8294a8]">
          <span className="font-bold" style={{ color: fg }}>
            {foot}
          </span>
        </p>
      ) : null}
    </article>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Pill({
  children,
  accent = "teal",
}: {
  children: React.ReactNode;
  accent?: Accent;
}) {
  const { fg, wash } = ACCENTS[accent];
  return (
    <span
      className="rounded-full px-2 py-1 text-[10px] font-bold whitespace-nowrap"
      style={{ background: wash, color: fg }}
    >
      {children}
    </span>
  );
}

export function ProgressRing({ percent }: { percent: number }) {
  return (
    <div
      className="relative grid size-[52px] shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(#0da7e8 0 ${percent}%, #e7f0f7 ${percent}% 100%)`,
      }}
      role="img"
      aria-label={`${percent}% complete`}
    >
      <span className="absolute inset-[5px] rounded-full bg-white" />
      <b className="relative text-xs">{percent}%</b>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  icon: Icon = Inbox,
  accent = "blue",
}: {
  title: string;
  message: string;
  icon?: LucideIcon;
  accent?: Accent;
}) {
  const { fg, wash } = ACCENTS[accent];
  return (
    <div className="rounded-[18px] border border-dashed border-[#cfdcea] bg-white/70 px-5 py-10 text-center">
      <span
        className="mx-auto mb-3 flex size-11 items-center justify-center rounded-[14px]"
        style={{ background: wash, color: fg }}
      >
        <Icon className="size-5" />
      </span>
      <p className="m-head text-base font-extrabold text-m-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-m-muted">{message}</p>
    </div>
  );
}

export function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "Date to be confirmed";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function parsePage(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

export function Pagination({
  basePath,
  page,
  total,
}: {
  basePath: string;
  page: number;
  total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  const linkClass =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-m-line bg-white px-4 text-sm font-bold text-[#008fda] shadow-m-card hover:bg-[#e5f6ff]";
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link href={`${basePath}?page=${page - 1}`} className={linkClass}>
          ← Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-m-muted">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={`${basePath}?page=${page + 1}`} className={linkClass}>
          Older →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

// Calendar tile from the design's "Upcoming events" list.
export function DateBadge({
  iso,
  accent = "blue",
}: {
  iso: string | null;
  accent?: Accent;
}) {
  if (!iso) return null;
  const d = new Date(iso);
  const { fg, wash } = ACCENTS[accent];
  return (
    <div
      className="flex h-[51px] w-[46px] shrink-0 flex-col items-center justify-center rounded-xl"
      style={{ background: wash, color: fg }}
    >
      <span className="text-[9px] font-extrabold tracking-[0.6px]">
        {d.toLocaleString("en-US", { month: "short" }).toUpperCase()}
      </span>
      <strong className="m-head text-[19px] leading-[1.1]">
        {d.toLocaleString("en-US", { day: "2-digit" })}
      </strong>
    </div>
  );
}

export function IconTile({
  icon: Icon,
  accent = "blue",
  size = "md",
}: {
  icon: LucideIcon;
  accent?: Accent;
  size?: "sm" | "md";
}) {
  const { fg, wash } = ACCENTS[accent];
  return (
    <span
      className={`flex shrink-0 items-center justify-center ${
        size === "md" ? "size-[42px] rounded-[13px]" : "size-[34px] rounded-[11px]"
      }`}
      style={{ background: wash, color: fg }}
    >
      <Icon className={size === "md" ? "size-5" : "size-[15px]"} />
    </span>
  );
}

// Dark gradient banner used for the committee card.
export function DarkBanner({
  label,
  title,
  text,
}: {
  label: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="relative mb-4 overflow-hidden rounded-[14px] bg-gradient-to-br from-[#082747] to-[#0e4973] p-[18px] text-white">
      <span
        className="pointer-events-none absolute -top-4 right-4 text-[92px] leading-none text-white/5"
        aria-hidden
      >
        ✳
      </span>
      <p className="text-[10px] font-bold tracking-[1.1px] text-[#83d9ff] uppercase">
        {label}
      </p>
      <h3 className="relative mt-2 mb-1 text-lg font-extrabold">{title}</h3>
      {text ? <p className="relative text-[11px] text-[#b4cde2]">{text}</p> : null}
    </div>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#edf1f6] py-[11px] text-xs last:border-b-0">
      <span className="text-m-muted">{label}</span>
      <strong className="text-right font-semibold">{value}</strong>
    </div>
  );
}
