import Link from "next/link";
import { ScrollText } from "lucide-react";
import {
  AUDIT_PAGE_SIZE,
  getAuditFilterOptions,
  getAuditLog,
  parseAuditFilters,
} from "@/lib/admin/audit-log";

const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";
const field =
  "min-h-11 w-full rounded-lg border border-[#d5e1ee] bg-white px-3 text-sm text-tace-navy";

function label(action: string) {
  const text = action.replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function detailText(details: Record<string, unknown> | null) {
  if (!details) return "";
  return Object.entries(details)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseAuditFilters(await searchParams);
  const [{ rows, total, page }, options] = await Promise.all([
    getAuditLog(filters),
    getAuditFilterOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(total / AUDIT_PAGE_SIZE));
  const filtered = Boolean(filters.user || filters.action || filters.from || filters.to);

  const pageHref = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filters)) if (v && k !== "page") q.set(k, String(v));
    q.set("page", String(p));
    return `/dashboard/admin/audit?${q.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">Audit log</h1>
        <p className="mt-1 text-sm text-tace-gray">
          A read-only record of important admin actions. Entries cannot be
          edited or deleted.
        </p>
      </div>

      <form method="get" className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-5`}>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          Admin
          <select name="user" defaultValue={filters.user ?? ""} className={field}>
            <option value="">Everyone</option>
            {options.users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          Action
          <select name="action" defaultValue={filters.action ?? ""} className={field}>
            <option value="">All actions</option>
            {options.actions.map((a) => (
              <option key={a} value={a}>{label(a)}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          From
          <input type="date" name="from" defaultValue={filters.from} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          To
          <input type="date" name="to" defaultValue={filters.to} className={field} />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="min-h-11 flex-1 rounded-lg bg-tace-blue px-4 text-sm font-semibold text-white hover:opacity-90">
            Apply
          </button>
          {filtered ? (
            <Link href="/dashboard/admin/audit" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-tace-blue hover:underline">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <section className={`${card} overflow-x-auto`}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ScrollText className="size-8 text-tace-gray/50" />
            <p className="font-semibold text-tace-navy">
              {filtered ? "Nothing matches these filters" : "No activity recorded yet"}
            </p>
            <p className="max-w-sm text-sm text-tace-gray">
              Approvals, rejections, vetting decisions, stage changes and other
              important actions will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5edf6] text-xs font-bold tracking-wide text-tace-gray uppercase">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Action</th>
                <th className="py-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#f1f3f6] align-top last:border-b-0">
                  <td className="py-2.5 pr-3 whitespace-nowrap text-tace-gray">
                    {new Date(r.created_at).toLocaleString("en-GB", {
                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-tace-navy">{r.user_name}</td>
                  <td className="py-2.5 pr-3 text-tace-navy">
                    {label(r.action)}
                    {r.entity_type ? (
                      <span className="block text-xs text-tace-gray">{r.entity_type.replace(/_/g, " ")}</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 break-words text-tace-gray">{detailText(r.details) || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {pages > 1 ? (
        <nav aria-label="Pages" className="flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="min-h-11 content-center font-semibold text-tace-blue hover:underline">Newer</Link>
          ) : <span />}
          <span className="text-tace-gray">Page {page} of {pages}</span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="min-h-11 content-center font-semibold text-tace-blue hover:underline">Older</Link>
          ) : <span />}
        </nav>
      ) : null}
    </div>
  );
}
