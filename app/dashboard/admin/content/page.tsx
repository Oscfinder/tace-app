import Link from "next/link";
import { BookOpen, CalendarDays, FolderOpen, Megaphone, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    href: "/dashboard/admin/content/stories",
    icon: BookOpen,
    title: "Stories",
    description: "Impact stories shown on the public site.",
  },
  {
    href: "/dashboard/admin/content/announcements",
    icon: Megaphone,
    title: "Announcements",
    description: "Shown on the member dashboard once published.",
  },
  {
    href: "/dashboard/admin/content/events",
    icon: CalendarDays,
    title: "Events",
    description: "Meetings, trainings and outreach, with minutes.",
  },
  {
    href: "/dashboard/admin/content/resources",
    icon: FolderOpen,
    title: "Resources",
    description: "Policies, templates and guides for members.",
  },
];

export default function ContentPage() {
  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          Content
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Manage what appears publicly and on the member dashboard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-3.5 rounded-[14px] border border-[#ECEFF3] bg-white p-5 transition-shadow hover:shadow-sm"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#E8F6FD] text-tace-blue">
              <s.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-tace-navy">
                {s.title}
              </span>
              <span className="block truncate text-xs text-tace-gray">
                {s.description}
              </span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-tace-gray/50" />
          </Link>
        ))}
      </div>
    </div>
  );
}
