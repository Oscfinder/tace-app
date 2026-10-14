import { HandHeart } from "lucide-react";
import { getMyBeneficiary, getMySupport } from "@/lib/beneficiary/queries";
import {
  EmptyState,
  IconTile,
  PageHeader,
  formatDate,
  type Accent,
} from "@/components/member/ui";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
const CYCLE: Accent[] = ["blue", "teal", "purple", "amber", "pink"];

function label(type: string) {
  const t = type.replace(/[_-]/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default async function SupportPage() {
  const me = await getMyBeneficiary();
  const items = me ? await getMySupport(me.id) : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My support"
        title="Help you've received"
        subtitle="Everything TACE and its supporters have done for you so far."
      />

      {items.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {items.map((it, i) => (
            <li
              key={it.id}
              className="flex gap-4 rounded-[18px] border border-m-line bg-white p-4 shadow-m-card"
            >
              <IconTile icon={HandHeart} accent={CYCLE[i % CYCLE.length]} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-x-3">
                  <h2 className="m-head text-[17px] font-extrabold text-m-ink">
                    {label(it.type)}
                  </h2>
                  {it.amount !== null ? (
                    <strong className="m-head text-[17px] text-[#0caf91]">
                      {naira.format(Number(it.amount))}
                    </strong>
                  ) : null}
                </div>
                <p className="text-sm text-m-muted">{formatDate(it.given_at)}</p>
                {it.description ? (
                  <p className="mt-2 text-[15px] leading-relaxed whitespace-pre-line text-[#4d6584]">
                    {it.description}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={HandHeart}
          accent="pink"
          title="Your support will show up here"
          message="When TACE helps with things like school fees, books or training, you'll see it listed here. We're glad you're part of our family."
        />
      )}
    </div>
  );
}
