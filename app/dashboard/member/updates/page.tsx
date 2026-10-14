import { Megaphone } from "lucide-react";
import { getAnnouncementsPage } from "@/lib/member/queries";
import {
  Card,
  EmptyState,
  IconTile,
  PageHeader,
  Pagination,
  Pill,
  formatDate,
  parsePage,
  type Accent,
} from "@/components/member/ui";

const ACCENT_CYCLE: Accent[] = ["blue", "teal", "purple", "amber", "pink"];

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePage((await searchParams).page);
  const { rows, total } = await getAnnouncementsPage(page);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Foundation updates"
        title="News & announcements"
        subtitle="Important news from the foundation, newest first."
      />
      {rows.length > 0 ? (
        <div className="flex flex-col gap-4">
          {rows.map((a, i) => (
            <Card
              key={a.id}
              className="flex items-start gap-3.5 bg-gradient-to-br from-white to-[#f8fbff]"
            >
              <IconTile
                icon={Megaphone}
                accent={ACCENT_CYCLE[(i + (page - 1) * 10) % ACCENT_CYCLE.length]}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-[9px]">
                  <h2 className="text-[15px] font-extrabold">{a.title}</h2>
                  {i === 0 && page === 1 ? <Pill accent="teal">Latest</Pill> : null}
                </div>
                <p className="mb-2.5 text-[11px] text-[#8b9bb0]">
                  {formatDate(a.published_at)}
                </p>
                <p className="text-[13px] leading-[1.7] whitespace-pre-line text-[#6d8199]">
                  {a.content}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Megaphone}
          accent="amber"
          title="No announcements yet"
          message="Published announcements will appear here."
        />
      )}
      <Pagination basePath="/dashboard/member/updates" page={page} total={total} />
    </div>
  );
}
