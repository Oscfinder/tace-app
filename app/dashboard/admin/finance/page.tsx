import { Download, Landmark } from "lucide-react";
import {
  getActiveSponsorOptions,
  getAllBeneficiaries,
  getProjectOptions,
} from "@/lib/admin/sponsors";
import {
  FINANCE_ROW_LIMIT,
  getFinanceRows,
  parseFinanceFilters,
} from "@/lib/admin/finance";
import { DonationLogger } from "@/components/admin/sponsors/donation-logger";
import { ReceiptButton } from "@/components/admin/finance/receipt-button";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
const card =
  "rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]";
const field =
  "min-h-11 w-full rounded-lg border border-[#d5e1ee] bg-white px-3 text-sm text-tace-navy";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFinanceFilters(await searchParams);
  const [{ rows, total, truncated }, sponsors, projects, beneficiaries] =
    await Promise.all([
      getFinanceRows(filters),
      getActiveSponsorOptions(),
      getProjectOptions(),
      getAllBeneficiaries(),
    ]);

  const exportQuery = new URLSearchParams(
    Object.entries(filters) as [string, string][],
  ).toString();
  const filtered = Object.keys(filters).length > 0;

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">
            Finance &amp; Donations
          </h1>
          <p className="mt-1 text-sm text-tace-gray">
            Every gift that has been logged, with receipt status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`/dashboard/admin/finance/export${exportQuery ? `?${exportQuery}` : ""}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d5e1ee] bg-white px-4 text-sm font-semibold text-tace-navy hover:bg-[#f3f8fd]"
          >
            <Download className="size-4" />
            Export CSV
          </a>
          <DonationLogger
            sponsors={sponsors}
            beneficiaries={beneficiaries}
            projects={projects}
          />
        </div>
      </div>

      <form
        method="get"
        className={`${card} grid gap-3 sm:grid-cols-2 lg:grid-cols-6`}
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          From
          <input type="date" name="from" defaultValue={filters.from} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          To
          <input type="date" name="to" defaultValue={filters.to} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          Sponsor
          <select name="sponsor" defaultValue={filters.sponsor ?? ""} className={field}>
            <option value="">All sponsors</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          Project
          <select name="project" defaultValue={filters.project ?? ""} className={field}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-tace-gray">
          Receipt
          <select name="receipt" defaultValue={filters.receipt ?? ""} className={field}>
            <option value="">Any</option>
            <option value="sent">Sent</option>
            <option value="pending">Not sent</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="min-h-11 flex-1 rounded-lg bg-tace-blue px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            Apply
          </button>
          {filtered ? (
            <a
              href="/dashboard/admin/finance"
              className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-tace-blue hover:underline"
            >
              Clear
            </a>
          ) : null}
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <div className="text-xs font-bold tracking-wide text-tace-gray uppercase">
            {filtered ? "Total (filtered)" : "Total"}
          </div>
          <div className="mt-1 text-2xl font-extrabold text-tace-navy">
            {naira.format(total)}
          </div>
        </div>
        <div className={card}>
          <div className="text-xs font-bold tracking-wide text-tace-gray uppercase">
            Donations
          </div>
          <div className="mt-1 text-2xl font-extrabold text-tace-navy">
            {rows.length}
          </div>
        </div>
      </div>

      {truncated ? (
        <p
          role="status"
          className="rounded-lg bg-[#fff5d9] px-4 py-3 text-sm text-[#7a5a00]"
        >
          Showing the newest {FINANCE_ROW_LIMIT.toLocaleString()} gifts only.
          Narrow the date range to see the rest.
        </p>
      ) : null}

      <section className={`${card} overflow-x-auto`}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Landmark className="size-8 text-tace-gray/50" />
            <p className="font-semibold text-tace-navy">
              {filtered
                ? "No donations match these filters"
                : "No donations logged yet"}
            </p>
            <p className="max-w-sm text-sm text-tace-gray">
              {filtered
                ? "Try a wider date range or clear the filters."
                : "When a bank transfer arrives, use Log donation to record it."}
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e5edf6] text-xs font-bold tracking-wide text-tace-gray uppercase">
                <th className="py-2 pr-3">Date</th>
                <th className="py-2 pr-3">Donor</th>
                <th className="py-2 pr-3">Sponsor</th>
                <th className="py-2 pr-3">Project</th>
                <th className="py-2 pr-3">Child</th>
                <th className="py-2 pr-3 text-right">Amount</th>
                <th className="py-2 pr-3">Purpose</th>
                <th className="py-2">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#f1f3f6] last:border-b-0"
                >
                  <td className="py-2.5 pr-3 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString("en-GB")}
                  </td>
                  <td className="py-2.5 pr-3 font-semibold text-tace-navy">
                    {r.donor_name}
                  </td>
                  <td className="py-2.5 pr-3">{r.sponsor_name ?? "—"}</td>
                  <td className="py-2.5 pr-3">{r.project_title ?? "—"}</td>
                  <td className="py-2.5 pr-3">{r.child_name ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-right font-bold whitespace-nowrap text-tace-navy">
                    {naira.format(r.amount)}
                  </td>
                  <td className="py-2.5 pr-3">{r.purpose ?? "—"}</td>
                  <td className="py-2.5">
                    {r.receipt_sent ? (
                      <span className="text-xs font-semibold text-tace-green">
                        Sent
                      </span>
                    ) : (
                      <ReceiptButton donationId={r.id} hasEmail={r.has_email} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
