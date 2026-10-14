import { getImpactStoriesPage } from "@/lib/member/queries";
import { STAGE_LABELS } from "@/lib/beneficiary-stages";
import {
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  formatDate,
  parsePage,
} from "@/components/member/ui";

export default async function ImpactPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = parsePage((await searchParams).page);
  const { rows, total } = await getImpactStoriesPage(page);

  return (
    <div className="flex flex-col gap-6 pt-5">
      <PageHeader
        title="Impact Feed"
        subtitle="Stories from the children and families we walk with."
      />
      {rows.length > 0 ? (
        <div className="flex flex-col gap-4">
          {rows.map((s) => (
            <Card key={s.id} className="overflow-hidden !p-0">
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photoUrl}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : null}
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-tace-navy">{s.title}</h2>
                  {s.stage ? (
                    <span className="rounded-full bg-tace-green/15 px-2 py-0.5 text-[11px] font-bold text-tace-green">
                      {s.childFirstName ? `${s.childFirstName}: ` : ""}
                      {STAGE_LABELS[s.stage]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-tace-gray">
                  {formatDate(s.publishedAt)}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm text-tace-gray">
                  {s.excerpt ?? s.content}
                </p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No stories yet"
          message="As children reach new milestones, their stories will be shared here."
        />
      )}
      <Pagination basePath="/dashboard/member/impact" page={page} total={total} />
    </div>
  );
}
