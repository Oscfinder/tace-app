import { Heart } from "lucide-react";
import {
  getMyBeneficiary,
  getMySponsor,
  getMyThankYous,
} from "@/lib/beneficiary/queries";
import { ThankYouForm } from "@/components/beneficiary/thank-you-form";
import {
  Card,
  EmptyState,
  PageHeader,
  Pill,
  formatDate,
  type Accent,
} from "@/components/member/ui";

const STATUS: Record<string, { label: string; accent: Accent }> = {
  pending: { label: "Waiting to be shared", accent: "amber" },
  approved: { label: "Shared with your sponsor", accent: "teal" },
  rejected: { label: "Not shared", accent: "pink" },
};

export default async function SponsorPage() {
  const [me, sponsor] = await Promise.all([getMyBeneficiary(), getMySponsor()]);
  const messages = me && sponsor ? await getMyThankYous(me.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My sponsor"
        title="Your sponsor"
        subtitle="A kind person who is helping you on your journey."
      />

      {sponsor ? (
        <>
          <Card>
            <div className="flex items-center gap-4">
              <span
                className="m-head flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f6b83f] to-[#ec4f7b] text-2xl font-extrabold text-white"
                aria-hidden
              >
                {sponsor.first_name.charAt(0).toUpperCase()}
              </span>
              <div>
                <h2 className="m-head text-xl font-extrabold text-m-ink">
                  {sponsor.first_name}
                </h2>
                <p className="text-[15px] text-m-muted">Your sponsor 💙</p>
              </div>
            </div>
          </Card>

          <Card>
            <ThankYouForm sponsorName={sponsor.first_name} />
            <p className="mt-3 text-sm text-m-muted">
              We read every message first, then pass it on to your sponsor.
            </p>
          </Card>

          {messages.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="m-head text-lg font-extrabold">Your messages</h2>
              {messages.map((m) => {
                const s = STATUS[m.status] ?? STATUS.pending;
                return (
                  <Card key={m.id}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <Pill accent={s.accent}>{s.label}</Pill>
                      <span className="text-sm text-m-muted">
                        {formatDate(m.created_at)}
                      </span>
                    </div>
                    <p className="text-[16px] leading-relaxed whitespace-pre-line text-[#4d6584]">
                      {m.content}
                    </p>
                    {m.status === "rejected" ? (
                      <p className="mt-2 text-sm text-m-muted">
                        We couldn&apos;t share this one. Please feel free to write
                        another message.
                      </p>
                    ) : null}
                  </Card>
                );
              })}
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          icon={Heart}
          accent="amber"
          title="A sponsor is being found for you"
          message="When someone kind joins your journey, you'll meet them here and can say thank you. For now, keep shining!"
        />
      )}
    </div>
  );
}
