import Link from "next/link";
import { Inbox, type LucideIcon } from "lucide-react";
import { PAGE_SIZE } from "@/lib/member/queries";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-tace-navy">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-tace-gray">{subtitle}</p>
      ) : null}
      <div className="mt-3 h-[3px] w-12 rounded-full bg-tace-blue" />
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
      className={`rounded-[14px] border border-[#ECEFF3] bg-white p-[22px] ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#D9DEE5] bg-white px-5 py-10 text-center">
      <span className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[#E8F6FD] text-tace-blue">
        <Inbox className="size-5" />
      </span>
      <p className="font-heading text-base font-semibold text-tace-navy">
        {title}
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-tace-gray">{message}</p>
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
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-tace-navy hover:bg-tace-lgray";
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link href={`${basePath}?page=${page - 1}`} className={linkClass}>
          Newer
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-tace-gray">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={`${basePath}?page=${page + 1}`} className={linkClass}>
          Older
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

// Calendar-style date tile, same look as the admin Upcoming Activities panel.
export function DateBadge({ iso }: { iso: string | null }) {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    <div className="flex w-11 shrink-0 flex-col overflow-hidden rounded-lg bg-[#EEF8FF] text-center text-tace-blue">
      <span className="bg-[#DFF2FF] text-[9px] font-bold leading-[18px]">
        {d.toLocaleString("en-US", { month: "short" }).toUpperCase()}
      </span>
      <span className="text-base font-extrabold leading-[26px]">
        {d.toLocaleString("en-US", { day: "2-digit" })}
      </span>
    </div>
  );
}

const TILE_ACCENTS = {
  blue: "bg-[#E8F6FD] text-tace-blue",
  yellow: "bg-[#FEF6E2] text-tace-yellow",
  green: "bg-[#EAF8EF] text-tace-green",
  purple: "bg-[#F4F1FF] text-[#7759E8]",
} as const;

export function IconTile({
  icon: Icon,
  accent = "blue",
}: {
  icon: LucideIcon;
  accent?: keyof typeof TILE_ACCENTS;
}) {
  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${TILE_ACCENTS[accent]}`}
    >
      <Icon className="size-[17px]" />
    </span>
  );
}
