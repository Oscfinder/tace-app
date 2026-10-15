import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { STAGE_LABELS } from "@/lib/beneficiary-stages";
import { Pill } from "@/components/member/ui";
import type { Mentee } from "@/lib/mentor/queries";

// A mentee at a glance. Server-rendered (no icons are passed across the
// server/client boundary).
export function MenteeCard({ mentee }: { mentee: Mentee }) {
  return (
    <Link
      href={`/dashboard/mentor/mentees/${mentee.id}`}
      className="flex gap-4 rounded-[18px] border border-m-line bg-white p-4 shadow-m-card transition-transform hover:-translate-y-0.5"
    >
      {mentee.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mentee.photoUrl}
          alt={`${mentee.first_name}'s photo`}
          className="size-20 shrink-0 rounded-2xl object-cover ring-4 ring-[#e5f6ff]"
        />
      ) : (
        <span
          className="m-head flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#9277f6] to-[#7759e8] text-3xl font-extrabold text-white"
          aria-hidden
        >
          {mentee.first_name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h3 className="m-head text-lg font-extrabold text-m-ink">{mentee.first_name}</h3>
          <span className="text-sm text-m-muted">{mentee.age} years old</span>
        </div>
        <div className="mt-1.5">
          <Pill accent="teal">{STAGE_LABELS[mentee.current_stage]}</Pill>
        </div>
        {mentee.interests ? (
          <p className="mt-2 line-clamp-2 text-sm text-[#4d6584]">
            <span className="font-semibold text-m-ink">Interests: </span>
            {mentee.interests}
          </p>
        ) : null}
        <p className="mt-2 flex items-center gap-1.5 text-xs text-m-muted">
          <CalendarClock className="size-3.5" />
          {mentee.nextCheckIn
            ? `Next check-in: ${new Date(mentee.nextCheckIn).toLocaleString("en-NG", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "No check-in scheduled"}
        </p>
      </div>
    </Link>
  );
}
