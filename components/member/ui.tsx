import Link from "next/link";
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
      className={`rounded-[14px] border border-[#ECEFF3] bg-white p-5 ${className}`}
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
