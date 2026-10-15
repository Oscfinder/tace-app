import {
  Gift,
  HandHeart,
  Heart,
  Home,
  MessageSquareHeart,
  TrendingUp,
  UserCircle,
} from "lucide-react";
import { dmSans, manrope } from "@/lib/dashboard-fonts";
import { getNotificationSummary } from "@/lib/member/queries";
import { TopNavHeader, type NavTab } from "@/components/shared/top-nav-header";

const TABS: NavTab[] = [
  { href: "/dashboard/sponsor", label: "Home", icon: Home, exact: true },
  { href: "/dashboard/sponsor/child", label: "My Child", icon: Heart },
  { href: "/dashboard/sponsor/progress", label: "Progress", icon: TrendingUp },
  { href: "/dashboard/sponsor/support", label: "How my support is used", icon: HandHeart },
  { href: "/dashboard/sponsor/giving", label: "My Giving", icon: Gift },
  { href: "/dashboard/sponsor/thank-you", label: "Thank-yous", icon: MessageSquareHeart },
  { href: "/dashboard/sponsor/profile", label: "My Profile", icon: UserCircle },
];

// Role/status are enforced by proxy.ts for every /dashboard/sponsor/* route
// (pending, inactive, suspended and wrong-role users are redirected there);
// this layout only reads data for display.
export default async function SponsorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const notifications = await getNotificationSummary();

  return (
    <div
      className={`member-theme ${manrope.variable} ${dmSans.variable} min-h-screen bg-m-bg`}
    >
      <TopNavHeader
        homeHref="/dashboard/sponsor"
        tabs={TABS}
        notifications={notifications.latest}
        unread={notifications.unread}
      />
      <main className="mx-auto w-full max-w-4xl px-4 pt-5 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
