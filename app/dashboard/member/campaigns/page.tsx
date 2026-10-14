import { HeartHandshake } from "lucide-react";
import { getCampaigns } from "@/lib/member/queries";
import { ShareButton } from "@/components/member/share-button";
import { Card, EmptyState, PageHeader, Pill } from "@/components/member/ui";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Campaigns"
        title="Make a difference"
        subtitle="Active fundraising campaigns you can help spread the word about."
      />
      {campaigns.length > 0 ? (
        <div className="flex flex-col gap-5">
          {campaigns.map((c) => {
            const percent =
              c.target && c.target > 0
                ? Math.min(100, Math.round((c.raised / c.target) * 100))
                : null;
            return (
              <Card key={c.id} className="flex flex-col gap-5">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-extrabold tracking-[-0.3px]">
                      {c.title}
                    </h2>
                    <Pill accent="teal">Active</Pill>
                  </div>
                  {c.description ? (
                    <p className="text-[13px] leading-[1.7] whitespace-pre-line text-[#6d8199]">
                      {c.description}
                    </p>
                  ) : null}
                </div>

                {percent !== null ? (
                  <div className="rounded-[13px] border border-[#edf1f6] bg-[#fbfcfe] p-4">
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <p className="text-xs text-m-muted">
                        <strong className="m-head text-xl text-m-ink">
                          {naira.format(c.raised)}
                        </strong>{" "}
                        raised of {naira.format(c.target ?? 0)}
                      </p>
                      <strong className="m-head text-lg text-[#0caf91]">
                        {percent}%
                      </strong>
                    </div>
                    <div
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${c.title} funding progress`}
                      className="h-2.5 overflow-hidden rounded-full bg-[#e6edf4]"
                    >
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#08a4e8] to-[#20c4d8]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                {c.children.length > 0 ? (
                  <div>
                    <p className="mb-2.5 text-[11px] font-bold tracking-[1.1px] text-m-muted uppercase">
                      Children this campaign supports
                    </p>
                    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {c.children.map((child) => (
                        <li
                          key={child.id}
                          className="overflow-hidden rounded-[14px] border border-m-line bg-white"
                        >
                          {child.photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={child.photoUrl}
                              alt={`${child.first_name}, age ${child.age}`}
                              className="aspect-square w-full object-cover"
                            />
                          ) : (
                            <div
                              className="aspect-square w-full bg-gradient-to-br from-[#e5f6ff] to-[#f0ebff]"
                              aria-hidden
                            />
                          )}
                          <p className="px-3 py-2.5 text-[13px] font-bold">
                            {child.first_name}, {child.age}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <ShareButton
                  title={c.title}
                  text={`Help us support children at TACE Foundation: ${c.title}.`}
                />
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={HeartHandshake}
          accent="pink"
          title="No active campaigns"
          message="When a new campaign goes live, you'll be able to share it from here."
        />
      )}
    </div>
  );
}
