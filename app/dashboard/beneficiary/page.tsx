import Link from "next/link";
import {
  Route,
  HandHeart,
  GraduationCap,
  Heart,
  Award,
  Sparkles,
} from "lucide-react";
import { getMyBeneficiary } from "@/lib/beneficiary/queries";
import { STAGE_LABELS, stageProgress } from "@/lib/beneficiary-stages";
import { STAGE_MESSAGES } from "@/lib/beneficiary/stages";
import { EmptyState, IconTile, Pill, formatDate } from "@/components/member/ui";

const LINKS = [
  { href: "/dashboard/beneficiary/journey", label: "My Journey", hint: "See how far you've come", icon: Route, accent: "blue" },
  { href: "/dashboard/beneficiary/support", label: "My Support", hint: "Help you've received", icon: HandHeart, accent: "pink" },
  { href: "/dashboard/beneficiary/mentor", label: "My Mentor", hint: "Your guide and cheerleader", icon: GraduationCap, accent: "purple" },
  { href: "/dashboard/beneficiary/sponsor", label: "My Sponsor", hint: "Say thank you", icon: Heart, accent: "amber" },
  { href: "/dashboard/beneficiary/progress", label: "My Progress", hint: "Updates and certificates", icon: Award, accent: "teal" },
] as const;

export default async function BeneficiaryHomePage() {
  const me = await getMyBeneficiary();

  if (!me) {
    return (
      <EmptyState
        icon={Sparkles}
        title="We're getting your page ready"
        message="Your profile isn't linked just yet. Please check back soon, or contact the TACE team if this keeps showing."
      />
    );
  }

  const progress = stageProgress(me.current_stage);

  return (
    <div className="flex flex-col gap-5">
      <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#087dbd] via-[#0a93d6] to-[#05a9e6] p-6 text-white shadow-[0_12px_25px_#068dd51c]">
        <span
          className="pointer-events-none absolute -top-5 right-3 text-[120px] leading-none text-white/10"
          aria-hidden
        >
          ✦
        </span>
        <div className="relative flex items-center gap-4">
          {me.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.photoUrl}
              alt={`${me.first_name}'s photo`}
              className="size-24 shrink-0 rounded-full object-cover ring-4 ring-white/40"
            />
          ) : (
            <span
              className="m-head flex size-24 shrink-0 items-center justify-center rounded-full bg-white/20 text-4xl font-extrabold ring-4 ring-white/30"
              aria-hidden
            >
              {me.first_name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#d9f3ff]">Welcome back</p>
            <h1 className="m-head text-3xl font-extrabold tracking-[-0.5px] break-words">
              Hi {me.first_name}! 👋
            </h1>
            {me.tace_id ? (
              <p className="mt-1.5 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-bold">
                {me.tace_id}
              </p>
            ) : null}
          </div>
        </div>
        <p className="relative mt-5 text-[17px] leading-relaxed text-[#eaf8ff]">
          {STAGE_MESSAGES[me.current_stage]}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[18px] border border-m-line bg-white p-4 shadow-m-card">
          <p className="text-sm font-semibold text-m-muted">Where you are now</p>
          <p className="m-head mt-1 text-xl leading-tight font-extrabold text-m-ink">
            {STAGE_LABELS[me.current_stage]}
          </p>
          <div className="mt-2">
            <Pill accent="teal">
              Step {progress.position} of {progress.total}
            </Pill>
          </div>
        </div>
        <div className="rounded-[18px] border border-m-line bg-white p-4 shadow-m-card">
          <p className="text-sm font-semibold text-m-muted">Part of TACE since</p>
          <p className="m-head mt-1 text-xl leading-tight font-extrabold text-m-ink">
            {formatDate(me.created_at)}
          </p>
          <div className="mt-2">
            <Pill accent="purple">Welcome!</Pill>
          </div>
        </div>
      </section>

      <section aria-label="Your pages" className="grid gap-3">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex min-h-[72px] items-center gap-4 rounded-[18px] border border-m-line bg-white p-4 shadow-m-card transition-transform active:scale-[0.99]"
          >
            <IconTile icon={l.icon} accent={l.accent} />
            <span className="min-w-0 flex-1">
              <span className="m-head block text-[17px] font-extrabold text-m-ink">
                {l.label}
              </span>
              <span className="block text-sm text-m-muted">{l.hint}</span>
            </span>
            <span className="text-xl text-[#008fda]" aria-hidden>
              →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
