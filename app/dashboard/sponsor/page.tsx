import Link from "next/link";
import { Gift, Heart, TrendingUp, Users } from "lucide-react";
import {
  getMyDonations,
  getProgressUpdates,
  getSponsorChildren,
  getSponsorProfile,
} from "@/lib/sponsor/queries";
import { STAGE_LABELS, stageProgress } from "@/lib/beneficiary-stages";
import { BankDetailsCard } from "@/components/sponsor/bank-details-card";
import { getBankDetails } from "@/lib/site-settings";
import {
  EmptyState,
  Pill,
  Stat,
  formatDate,
} from "@/components/member/ui";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default async function SponsorHomePage() {
  const [profile, children, updates, donations, bank] = await Promise.all([
    getSponsorProfile(),
    getSponsorChildren(),
    getProgressUpdates(),
    getMyDonations(),
    getBankDetails(),
  ]);

  const firstName = profile?.full_name.split(" ")[0] ?? "there";
  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  const latestByChild = new Map<string, (typeof updates)[number]>();
  for (const u of updates) {
    if (!latestByChild.has(u.beneficiary_id)) latestByChild.set(u.beneficiary_id, u);
  }

  return (
    <div className="flex flex-col gap-6">
      <section>
        <p className="mb-2 text-[11px] font-bold tracking-[1.3px] text-[#0798d9] uppercase">
          Sponsor dashboard
        </p>
        <h1 className="text-[27px] font-extrabold tracking-[-1px] text-m-ink">
          Welcome, {firstName} <span className="text-2xl">💙</span>
        </h1>
        <p className="mt-1.5 text-sm text-m-muted">
          Thank you for changing a child&apos;s story. Here&apos;s how they are doing.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <Stat
          label="Total given"
          value={naira.format(total)}
          foot={donations.length > 0 ? `${donations.length} gift${donations.length === 1 ? "" : "s"}` : "No gifts recorded yet"}
          icon={Gift}
          accent="teal"
          href="/dashboard/sponsor/giving"
        />
        <Stat
          label={children.length === 1 ? "Child you sponsor" : "Children you sponsor"}
          value={children.length}
          foot={children.length > 0 ? "See their journey" : "Being linked soon"}
          icon={Users}
          accent="blue"
          href="/dashboard/sponsor/child"
        />
      </section>

      {children.length > 0 ? (
        <section className="flex flex-col gap-4" aria-label="Your children">
          {children.map((c) => {
            const progress = stageProgress(c.current_stage);
            const latest = latestByChild.get(c.id);
            return (
              <Link
                key={c.id}
                href="/dashboard/sponsor/child"
                className="flex flex-col gap-4 rounded-[18px] border border-m-line bg-white p-5 shadow-m-card transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center"
              >
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
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="m-head text-xl font-extrabold text-m-ink">
                      {c.first_name}
                    </h2>
                    <span className="text-sm text-m-muted">{c.age} years old</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Pill accent="teal">{STAGE_LABELS[c.current_stage]}</Pill>
                    <Pill accent="purple">
                      Step {progress.position} of {progress.total}
                    </Pill>
                  </div>
                  <div className="mt-3 rounded-xl bg-[#f4f8fd] p-3">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-m-muted uppercase">
                      <TrendingUp className="size-3.5" />
                      Latest update
                    </p>
                    {latest ? (
                      <>
                        <p className="mt-1 text-sm font-semibold text-m-ink">
                          {latest.title}
                        </p>
                        <p className="text-xs text-m-muted">
                          {formatDate(latest.created_at)}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-m-muted">
                        No updates yet. We&apos;ll share news as {c.first_name} grows.
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : (
        <>
          <EmptyState
            icon={Heart}
            accent="pink"
            title="Your child will be linked soon"
            message="An admin links a child to your account once your first transfer is confirmed. After that, you'll see their photo, progress and journey here. Thank you for your generosity."
          />
          <BankDetailsCard details={bank} />
        </>
      )}
    </div>
  );
}
