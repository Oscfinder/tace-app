import { Award, FileBadge, TrendingUp } from "lucide-react";
import {
  getMyBeneficiary,
  getMyCertificates,
  getMyProgress,
} from "@/lib/beneficiary/queries";
import {
  EmptyState,
  IconTile,
  PageHeader,
  Panel,
  formatDate,
} from "@/components/member/ui";

export default async function ProgressPage() {
  const me = await getMyBeneficiary();
  const [updates, certificates] = me
    ? await Promise.all([getMyProgress(me.id), getMyCertificates(me.id)])
    : [[], []];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My progress"
        title="Your progress"
        subtitle="Updates from the TACE team and the certificates you've earned."
      />

      <Panel title="Updates" subtitle="What's been happening on your journey">
        {updates.length > 0 ? (
          <ul>
            {updates.map((u) => (
              <li
                key={u.id}
                className="flex gap-3 border-t border-[#eff3f7] py-4 first:border-t-0"
              >
                <IconTile icon={TrendingUp} accent="teal" size="sm" />
                <div className="min-w-0 flex-1">
                  <h3 className="m-head text-[16px] font-extrabold text-m-ink">
                    {u.title}
                  </h3>
                  <p className="text-sm text-m-muted">{formatDate(u.created_at)}</p>
                  <p className="mt-1.5 text-[15px] leading-relaxed whitespace-pre-line text-[#4d6584]">
                    {u.content}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-base text-m-muted">
            No updates yet. As you grow and reach new steps, we&apos;ll share
            the good news here. 🌱
          </p>
        )}
      </Panel>

      <Panel title="Certificates" subtitle="Proof of your hard work">
        {certificates.length > 0 ? (
          <ul>
            {certificates.map((c) => (
              <li key={c.name} className="border-t border-[#eff3f7] first:border-t-0">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center gap-3 py-3 text-[16px] font-semibold hover:text-[#008fda]"
                >
                  <IconTile icon={FileBadge} accent="amber" size="sm" />
                  <span className="min-w-0 flex-1 break-words">{c.name}</span>
                  <span className="text-sm font-bold text-[#008fda]">Open ↗</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-6 text-center">
            <EmptyState
              icon={Award}
              accent="amber"
              title="Your first certificate is waiting"
              message="When you finish a course or training, your certificate will be kept safely here for you."
            />
          </div>
        )}
      </Panel>
    </div>
  );
}
