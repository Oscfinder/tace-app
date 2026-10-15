import { TrendingUp } from "lucide-react";
import { getProgressUpdates, getSponsorChildren } from "@/lib/sponsor/queries";
import {
  EmptyState,
  IconTile,
  PageHeader,
  Panel,
  formatDate,
} from "@/components/member/ui";

export default async function SponsorProgressPage() {
  const [children, updates] = await Promise.all([
    getSponsorChildren(),
    getProgressUpdates(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Progress"
        title="Progress updates"
        subtitle="News from the TACE team, newest first."
      />

      {children.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          accent="teal"
          title="Updates will appear here"
          message="Once a child is linked to your account, you'll see their progress updates here."
        />
      ) : (
        children.map((c) => {
          const mine = updates.filter((u) => u.beneficiary_id === c.id);
          return (
            <Panel
              key={c.id}
              title={children.length > 1 ? `${c.first_name}'s updates` : "Updates"}
              subtitle={`${mine.length} update${mine.length === 1 ? "" : "s"}`}
            >
              {mine.length > 0 ? (
                <ul>
                  {mine.map((u) => (
                    <li
                      key={u.id}
                      className="flex gap-3 border-t border-[#eff3f7] py-4 first:border-t-0"
                    >
                      <IconTile icon={TrendingUp} accent="teal" size="sm" />
                      <div className="min-w-0 flex-1">
                        <h3 className="m-head text-[16px] font-extrabold text-m-ink">
                          {u.title}
                        </h3>
                        <p className="text-xs text-m-muted">{formatDate(u.created_at)}</p>
                        <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-[#4d6584]">
                          {u.content}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-m-muted">
                  No updates yet. We&apos;ll share news as {c.first_name} reaches new steps.
                </p>
              )}
            </Panel>
          );
        })
      )}
    </div>
  );
}
