import { Sparkles } from "lucide-react";
import { getImpactStoriesPage } from "@/lib/member/queries";
import { STAGE_LABELS } from "@/lib/beneficiary-stages";
import {
  EmptyState,
  PageHeader,
  Pagination,
  Pill,
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
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Impact feed"
        title="Stories of change"
        subtitle="Stories from the children and families we walk with."
      />
      {rows.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {rows.map((s) => (
            <article
              key={s.id}
              className="overflow-hidden rounded-[18px] border border-m-line bg-white shadow-m-card"
            >
              {s.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.photoUrl}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                />
              ) : (
                <div
                  className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-[#e5f6ff] via-[#e4fbf4] to-[#f0ebff] text-[#079ce8]"
                  aria-hidden
                >
                  <Sparkles className="size-10" />
                </div>
              )}
              <div className="p-5">
                {s.stage ? (
                  <div className="mb-2">
                    <Pill accent="teal">
                      {s.childFirstName ? `${s.childFirstName} · ` : ""}
                      {STAGE_LABELS[s.stage]}
                    </Pill>
                  </div>
                ) : null}
                <h2 className="text-base font-extrabold tracking-[-0.3px]">
                  {s.title}
                </h2>
                <p className="mt-1 text-[11px] text-[#8b9bb0]">
                  {formatDate(s.publishedAt)}
                </p>
                <p className="mt-2.5 line-clamp-5 text-[13px] leading-[1.7] whitespace-pre-line text-[#6d8199]">
                  {s.excerpt ?? s.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          accent="teal"
          title="No stories yet"
          message="As children reach new milestones, their stories will be shared here."
        />
      )}
      <Pagination basePath="/dashboard/member/impact" page={page} total={total} />
    </div>
  );
}
