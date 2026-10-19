import { APPLICATION_STATUSES, getReportData } from "@/lib/admin/reports";
import { PrintButton } from "@/components/admin/reports/print-button";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
const card =
  "break-inside-avoid rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)] print:shadow-none";

const STATUS_STYLE: Record<(typeof APPLICATION_STATUSES)[number], { label: string; color: string }> = {
  pending: { label: "Pending", color: "#efad13" },
  flagged: { label: "Flagged", color: "#f45b69" },
  approved: { label: "Approved", color: "#08aa7a" },
  rejected: { label: "Rejected", color: "#7889a4" },
};

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="h-3 w-full rounded-full bg-[#eef3f9] print:border print:border-[#d5e1ee]">
      <div
        className="h-3 rounded-full"
        style={{ width: `${pct}%`, background: color, printColorAdjust: "exact" }}
      />
    </div>
  );
}

export default async function ReportsPage() {
  const r = await getReportData();
  const maxStage = Math.max(...r.childrenByStage.map((s) => s.count), 0);
  const maxGift = Math.max(...r.donationsByMonth.map((m) => m.total), 0);
  const totalSponsorable = r.sponsoredChildren + r.unsponsoredChildren;

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-tace-navy">Reports</h1>
          <p className="mt-1 text-sm text-tace-gray">
            Counts and totals only. No names or contact details.
            <span className="hidden print:inline">
              {" "}
              Generated {new Date(r.generatedAt).toLocaleDateString("en-GB")}.
            </span>
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Children in the programme", r.totalChildren],
          ["Active mentors", r.activeMentors],
          ["Active mentor matches", r.activeMatches],
          [`Given in the last ${r.months.length} months`, naira.format(r.donationsTotal)],
        ].map(([label, value]) => (
          <div key={label} className={card}>
            <div className="text-xs font-bold tracking-wide text-tace-gray uppercase">{label}</div>
            <div className="mt-1 text-2xl font-extrabold text-tace-navy">{value}</div>
          </div>
        ))}
      </div>

      <section className={card} aria-labelledby="apps-h">
        <h2 id="apps-h" className="font-heading text-base font-semibold text-tace-navy">
          Applications by month
        </h2>
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-tace-gray">
          {APPLICATION_STATUSES.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span
                className="size-3 rounded-sm"
                style={{ background: STATUS_STYLE[s].color, printColorAdjust: "exact" }}
              />
              {STATUS_STYLE[s].label}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          {r.months.map((m) => {
            const row = r.applicationsByMonth[m.key];
            const sum = APPLICATION_STATUSES.reduce((n, s) => n + row[s], 0);
            const maxSum = Math.max(
              ...r.months.map((mm) => APPLICATION_STATUSES.reduce((n, s) => n + r.applicationsByMonth[mm.key][s], 0)),
              1,
            );
            return (
              <div key={m.key} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-sm">
                <span className="text-tace-gray">{m.label}</span>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#eef3f9]" style={{ maxWidth: `${(sum / maxSum) * 100}%`, minWidth: sum ? 8 : 0 }}>
                  {APPLICATION_STATUSES.map((s) =>
                    row[s] > 0 ? (
                      <div
                        key={s}
                        title={`${STATUS_STYLE[s].label}: ${row[s]}`}
                        style={{ width: `${(row[s] / sum) * 100}%`, background: STATUS_STYLE[s].color, printColorAdjust: "exact" }}
                      />
                    ) : null,
                  )}
                </div>
                <span className="text-xs text-tace-gray">
                  {sum === 0
                    ? "None"
                    : APPLICATION_STATUSES.filter((s) => row[s] > 0)
                        .map((s) => `${row[s]} ${STATUS_STYLE[s].label.toLowerCase()}`)
                        .join(", ")}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} aria-labelledby="stage-h">
          <h2 id="stage-h" className="font-heading text-base font-semibold text-tace-navy">
            Children by stage
          </h2>
          {r.totalChildren === 0 ? (
            <p className="mt-3 text-sm text-tace-gray">No children yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {r.childrenByStage.map((s) => (
                <li key={s.stage} className="grid grid-cols-[140px_1fr_28px] items-center gap-3 text-sm">
                  <span className="text-tace-gray">{s.label}</span>
                  <Bar value={s.count} max={maxStage} color="#0795e8" />
                  <span className="text-right font-bold text-tace-navy">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card} aria-labelledby="gifts-h">
          <h2 id="gifts-h" className="font-heading text-base font-semibold text-tace-navy">
            Donations per month
          </h2>
          {r.donationsTotal === 0 ? (
            <p className="mt-3 text-sm text-tace-gray">No donations logged in this period.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-2.5">
              {r.donationsByMonth.map((m) => (
                <li key={m.key} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-tace-gray">{m.label}</span>
                  <Bar value={m.total} max={maxGift} color="#08aa7a" />
                  <span className="text-right text-xs font-bold whitespace-nowrap text-tace-navy">
                    {naira.format(m.total)} <span className="font-normal text-tace-gray">({m.count})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={card} aria-labelledby="spons-h">
        <h2 id="spons-h" className="font-heading text-base font-semibold text-tace-navy">
          Sponsored and unsponsored children
        </h2>
        {totalSponsorable === 0 ? (
          <p className="mt-3 text-sm text-tace-gray">No children yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Sponsored", r.sponsoredChildren, "#7759e8"],
              ["Waiting for a sponsor", r.unsponsoredChildren, "#efad13"],
            ].map(([label, n, color]) => (
              <div key={label as string} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-tace-gray">{label}</span>
                  <b className="text-tace-navy">{n}</b>
                </div>
                <Bar value={n as number} max={totalSponsorable} color={color as string} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
