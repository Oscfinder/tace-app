import { getCampaigns } from "@/lib/member/queries";
import { ShareButton } from "@/components/member/share-button";
import { Card, EmptyState, PageHeader } from "@/components/member/ui";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <PageHeader
        title="Campaigns"
        subtitle="Active fundraising campaigns you can help spread the word about."
      />
      {campaigns.length > 0 ? (
        <div className="flex flex-col gap-4">
          {campaigns.map((c) => {
            const percent =
              c.target && c.target > 0
                ? Math.min(100, Math.round((c.raised / c.target) * 100))
                : null;
            return (
              <Card key={c.id} className="flex flex-col gap-4">
                <div>
                  <h2 className="font-heading text-lg font-semibold text-tace-navy">
                    {c.title}
                  </h2>
                  {c.description ? (
                    <p className="mt-1 whitespace-pre-line text-sm text-tace-gray">
                      {c.description}
                    </p>
                  ) : null}
                </div>

                {percent !== null ? (
                  <div>
                    <div
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${c.title} funding progress`}
                      className="h-3 overflow-hidden rounded-full bg-tace-lgray"
                    >
                      <div
                        className="h-full rounded-full bg-tace-green"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-sm text-tace-gray">
                      <span className="font-semibold text-tace-navy">
                        {naira.format(c.raised)}
                      </span>{" "}
                      raised of {naira.format(c.target ?? 0)} ({percent}%)
                    </p>
                  </div>
                ) : null}

                {c.children.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {c.children.map((child) => (
                      <li
                        key={child.id}
                        className="overflow-hidden rounded-xl border border-[#ECEFF3]"
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
                            className="aspect-square w-full bg-tace-lgray"
                            aria-hidden
                          />
                        )}
                        <p className="px-3 py-2 text-sm font-medium text-tace-navy">
                          {child.first_name}, {child.age}
                        </p>
                      </li>
                    ))}
                  </ul>
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
          title="No active campaigns"
          message="When a new campaign goes live, you'll be able to share it from here."
        />
      )}
    </div>
  );
}
