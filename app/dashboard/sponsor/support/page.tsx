import { HandHeart } from "lucide-react";
import { getSponsorChildren, getSupportUsed } from "@/lib/sponsor/queries";
import {
  EmptyState,
  IconTile,
  PageHeader,
  Panel,
  formatDate,
  type Accent,
} from "@/components/member/ui";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
const CYCLE: Accent[] = ["blue", "teal", "purple", "amber", "pink"];

function label(type: string) {
  const t = type.replace(/[_-]/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default async function SponsorSupportPage() {
  const [children, support] = await Promise.all([
    getSponsorChildren(),
    getSupportUsed(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Your impact"
        title="How my support is used"
        subtitle="What TACE has provided for the child you sponsor."
      />

      {children.length === 0 ? (
        <EmptyState
          icon={HandHeart}
          accent="pink"
          title="Nothing to show yet"
          message="When a child is linked to your account, the school fees, books and training provided for them will be listed here."
        />
      ) : (
        children.map((c) => {
          const items = support.filter((s) => s.beneficiary_id === c.id);
          const total = items.reduce((sum, s) => sum + Number(s.amount ?? 0), 0);
          return (
            <Panel
              key={c.id}
              title={children.length > 1 ? `${c.first_name}'s support` : "Support provided"}
              subtitle={
                items.length > 0
                  ? `${items.length} item${items.length === 1 ? "" : "s"} · ${naira.format(total)} in total`
                  : undefined
              }
            >
              {items.length > 0 ? (
                <ul>
                  {items.map((it, i) => (
                    <li
                      key={`${it.type}-${it.given_at}-${i}`}
                      className="flex gap-3 border-t border-[#eff3f7] py-4 first:border-t-0"
                    >
                      <IconTile icon={HandHeart} accent={CYCLE[i % CYCLE.length]} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-3">
                          <h3 className="m-head text-[16px] font-extrabold text-m-ink">
                            {label(it.type)}
                          </h3>
                          {it.amount !== null ? (
                            <strong className="m-head text-[16px] text-[#0caf91]">
                              {naira.format(Number(it.amount))}
                            </strong>
                          ) : null}
                        </div>
                        <p className="text-xs text-m-muted">{formatDate(it.given_at)}</p>
                        {it.description ? (
                          <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-[#4d6584]">
                            {it.description}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-m-muted">
                  Nothing has been recorded for {c.first_name} yet. It will appear here as support is provided.
                </p>
              )}
            </Panel>
          );
        })
      )}
    </div>
  );
}
