import { Bell } from "lucide-react";
import { getMyNotifications } from "@/lib/beneficiary/queries";
import { NotificationList } from "@/components/beneficiary/notification-list";
import { EmptyState, PageHeader } from "@/components/member/ui";

export default async function NotificationsPage() {
  const items = await getMyNotifications();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Alerts"
        title="Your notifications"
        subtitle="Good news and reminders, all in one place."
      />
      {items.length > 0 ? (
        <NotificationList items={items} />
      ) : (
        <EmptyState
          icon={Bell}
          accent="blue"
          title="Nothing new yet"
          message="When there's good news, like reaching a new step, you'll see it here."
        />
      )}
    </div>
  );
}
