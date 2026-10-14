import { getAnnouncementsPage } from "@/lib/member/queries";
import {
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  formatDate,
  parsePage,
} from "@/components/member/ui";

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePage((await searchParams).page);
  const { rows, total } = await getAnnouncementsPage(page);

  return (
    <div className="flex flex-col gap-6 pt-5">
      <PageHeader
        title="Foundation Updates"
        subtitle="News and announcements, newest first."
      />
      {rows.length > 0 ? (
        <div className="flex flex-col gap-3">
          {rows.map((a) => (
            <Card key={a.id}>
              <h2 className="font-semibold text-tace-navy">{a.title}</h2>
              <p className="mt-0.5 text-xs text-tace-gray">
                {formatDate(a.published_at)}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm text-tace-gray">
                {a.content}
              </p>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No announcements yet"
          message="Published announcements will appear here."
        />
      )}
      <Pagination basePath="/dashboard/member/updates" page={page} total={total} />
    </div>
  );
}
