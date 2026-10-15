import { MessageSquareHeart } from "lucide-react";
import { getApprovedThankYous, getSponsorChildren } from "@/lib/sponsor/queries";
import { Card, EmptyState, PageHeader, formatDate } from "@/components/member/ui";

export default async function SponsorThankYouPage() {
  // Approved messages only: pending/rejected ones are hidden by RLS as well.
  const [children, messages] = await Promise.all([
    getSponsorChildren(),
    getApprovedThankYous(),
  ]);
  const nameById = new Map(children.map((c) => [c.id, c.first_name]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Thank-yous"
        title="Messages from your child"
        subtitle="Notes of thanks, shared after the TACE team has read them."
      />

      {messages.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {messages.map((m) => (
            <li key={m.id}>
              <Card className="bg-gradient-to-br from-[#fff9e8] to-white">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-[#fff4dc] text-[#d99412]">
                    <MessageSquareHeart className="size-[18px]" />
                  </span>
                  <div>
                    <p className="m-head text-[16px] font-extrabold text-m-ink">
                      From {nameById.get(m.beneficiary_id) ?? "your child"}
                    </p>
                    <p className="text-xs text-m-muted">{formatDate(m.created_at)}</p>
                  </div>
                </div>
                <p className="text-[16px] leading-relaxed whitespace-pre-line text-[#4d6584]">
                  {m.content}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={MessageSquareHeart}
          accent="amber"
          title="No thank-you messages yet"
          message="When your child writes you a message, and the TACE team has read it, it will appear here."
        />
      )}
    </div>
  );
}
