import { MapPin } from "lucide-react";
import type { UpcomingEvent } from "@/lib/admin/upcoming-events";

function formatDate(iso: string) {
  const date = new Date(iso);
  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: date.toLocaleString("en-US", { day: "2-digit" }),
  };
}

export function UpcomingEventsPanel({ events }: { events: UpcomingEvent[] }) {
  return (
    <div className="rounded-[13px] border border-[#e5edf6] bg-white shadow-[0_8px_28px_rgba(20,55,95,0.07)] p-5">
      <h3 className="font-heading text-sm font-semibold text-tace-navy">
        Upcoming Activities
      </h3>

      {events.length > 0 ? (
        <div className="mt-3.5 flex flex-col">
          {events.map((event) => {
            const { month, day } = formatDate(event.event_date);
            return (
              <div
                key={event.id}
                className="flex items-center gap-3 border-b border-[#F1F3F6] py-3 last:border-b-0"
              >
                <div className="flex w-9 shrink-0 flex-col overflow-hidden rounded-lg bg-[#EEF8FF] text-center text-tace-blue">
                  <span className="bg-[#DFF2FF] text-[9px] font-bold leading-[18px]">
                    {month}
                  </span>
                  <span className="text-sm font-extrabold leading-[22px]">
                    {day}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-tace-navy">
                    {event.title}
                  </div>
                  {event.location ? (
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-tace-gray/70">
                      <MapPin className="size-3" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-lg bg-[#e9f7ff] px-2 py-1 text-[10px] font-semibold text-[#0d91de]">
                  Scheduled
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-[13px] text-tace-gray/70">
          No upcoming activities scheduled yet.
        </p>
      )}
    </div>
  );
}
