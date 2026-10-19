import { Gift, Receipt } from "lucide-react";
import { getMyDonations } from "@/lib/sponsor/queries";
import { BankDetailsCard } from "@/components/sponsor/bank-details-card";
import { getBankDetails } from "@/lib/site-settings";
import {
  EmptyState,
  PageHeader,
  Panel,
  Pill,
  Stat,
  formatDate,
} from "@/components/member/ui";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export default async function GivingPage() {
  // Only this sponsor's own gifts, through the sponsor_donations view.
  const [donations, bank] = await Promise.all([getMyDonations(), getBankDetails()]);
  const total = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My giving"
        title="Your gifts"
        subtitle="Everything you have given to TACE, with receipts."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Stat
          label="Total donated"
          value={naira.format(total)}
          foot={`${donations.length} gift${donations.length === 1 ? "" : "s"}`}
          icon={Gift}
          accent="teal"
        />
        <Stat
          label="Receipts sent"
          value={`${donations.filter((d) => d.receipt_sent).length} of ${donations.length}`}
          foot="Receipts are sent by the TACE team"
          icon={Receipt}
          accent="purple"
        />
      </div>

      <Panel title="Donation history" subtitle="Newest first">
        {donations.length > 0 ? (
          <ul>
            {donations.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#eff3f7] py-3.5 first:border-t-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="m-head text-[17px] font-extrabold text-m-ink">
                    {naira.format(Number(d.amount))}
                  </p>
                  <p className="text-xs text-m-muted">
                    {formatDate(d.created_at)}
                    {d.purpose ? ` · ${d.purpose}` : ""}
                  </p>
                </div>
                {d.receipt_sent ? (
                  <Pill accent="teal">Receipt sent</Pill>
                ) : (
                  <Pill accent="amber">Receipt pending</Pill>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Gift}
            accent="teal"
            title="No gifts recorded yet"
            message="After you make a bank transfer, the TACE team records it and it will appear here with a receipt."
          />
        )}
      </Panel>

      <BankDetailsCard details={bank} />
    </div>
  );
}
