import { dmSans, manrope } from "@/lib/dashboard-fonts";
import { getNotificationSummary } from "@/lib/member/queries";
import { getMyBeneficiary } from "@/lib/beneficiary/queries";
import { MIN_AGE } from "@/lib/career/score";
import { BeneficiaryHeader } from "@/components/beneficiary/beneficiary-header";

// Role/status are enforced by proxy.ts for every /dashboard/beneficiary/*
// route; this layout only reads data for display. Mobile-first: a top bar
// with a scrollable section menu works well on small, low-end phones.
export default async function BeneficiaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, me] = await Promise.all([
    getNotificationSummary(),
    getMyBeneficiary(),
  ]);
  // Career Discovery is hidden for children under 11.
  const showDiscover = me?.age != null && me.age >= MIN_AGE;

  return (
    <div
      className={`member-theme ${manrope.variable} ${dmSans.variable} min-h-screen bg-m-bg text-base`}
    >
      <BeneficiaryHeader
        notifications={notifications.latest}
        unread={notifications.unread}
        showDiscover={showDiscover}
      />
      <main className="mx-auto w-full max-w-3xl px-4 pt-5 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
