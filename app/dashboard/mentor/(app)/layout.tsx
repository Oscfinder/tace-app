import { redirect } from "next/navigation";
import { getNotificationSummary } from "@/lib/member/queries";
import { getMentorContext } from "@/lib/mentor/queries";
import { TopNavHeader, type NavTab } from "@/components/shared/top-nav-header";

const TABS: NavTab[] = [
  { href: "/dashboard/mentor", label: "Home", icon: "home", exact: true },
];

// THE GATE. Every mentor page lives inside this group, so a mentor who hasn't
// accepted the code of conduct is sent to it and cannot reach anything else.
// (proxy.ts has already checked role and account status.)
export default async function MentorAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getMentorContext();
  if (!ctx) redirect("/login");
  if (!ctx.codeAcceptedAt) redirect("/dashboard/mentor/code-of-conduct");

  const notifications = await getNotificationSummary();

  return (
    <>
      <TopNavHeader
        homeHref="/dashboard/mentor"
        tabs={TABS}
        notifications={notifications.latest}
        unread={notifications.unread}
      />
      <main className="mx-auto w-full max-w-4xl px-4 pt-5 pb-16 sm:px-6">{children}</main>
    </>
  );
}
