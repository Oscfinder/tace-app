import { Heart } from "lucide-react";
import { getSponsorChildren } from "@/lib/sponsor/queries";
import { JourneyTracker } from "@/components/shared/journey-tracker";
import {
  Card,
  DetailRow,
  EmptyState,
  PageHeader,
  Pill,
} from "@/components/member/ui";
import { STAGE_LABELS } from "@/lib/beneficiary-stages";

export default async function SponsorChildPage() {
  const children = await getSponsorChildren();

  if (children.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="My child" title="Your child" />
        <EmptyState
          icon={Heart}
          accent="pink"
          title="Your child will be linked soon"
          message="An admin links a child to your account once your first transfer is confirmed. You'll see their profile and journey here."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {children.map((c) => (
        <section key={c.id} className="flex flex-col gap-5">
          <PageHeader
            eyebrow="My child"
            title={c.first_name}
            subtitle={`${c.age} years old${c.class_level ? ` · ${c.class_level}` : ""}`}
          />

          <Card>
            <div className="flex items-center gap-4">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.photoUrl}
                  alt={`${c.first_name}'s photo`}
                  className="size-24 shrink-0 rounded-2xl object-cover ring-4 ring-[#e5f6ff]"
                />
              ) : (
                <span
                  className="m-head flex size-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10b5e9] to-[#087cc5] text-4xl font-extrabold text-white"
                  aria-hidden
                >
                  {c.first_name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <h2 className="m-head text-xl font-extrabold text-m-ink">
                  {c.first_name}
                </h2>
                <div className="mt-1.5">
                  <Pill accent="teal">{STAGE_LABELS[c.current_stage]}</Pill>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <DetailRow label="Age" value={`${c.age} years`} />
              {c.class_level ? <DetailRow label="Class" value={c.class_level} /> : null}
              {c.support_needed && c.support_needed.length > 0 ? (
                <DetailRow label="Support needed" value={c.support_needed.join(", ")} />
              ) : null}
            </div>

            {c.interests || c.aspirations ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {c.interests ? (
                  <div className="rounded-xl bg-[#e5f6ff] p-4">
                    <p className="text-[11px] font-bold tracking-wide text-[#0795e8] uppercase">
                      Interests
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-m-ink">
                      {c.interests}
                    </p>
                  </div>
                ) : null}
                {c.aspirations ? (
                  <div className="rounded-xl bg-[#fff4dc] p-4">
                    <p className="text-[11px] font-bold tracking-wide text-[#d99412] uppercase">
                      Dreams for the future
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-m-ink">
                      {c.aspirations}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>

          <div>
            <h2 className="m-head mb-3 text-lg font-extrabold">
              {c.first_name}&apos;s journey
            </h2>
            <JourneyTracker currentStage={c.current_stage} audience="sponsor" />
          </div>
        </section>
      ))}
    </div>
  );
}
