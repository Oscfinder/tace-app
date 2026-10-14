import { getThankYouMessages } from "@/lib/admin/thank-you";
import { ModerationList } from "@/components/admin/thank-you/moderation-list";

export default async function ThankYouMessagesPage() {
  const items = await getThankYouMessages();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          Thank-You Messages
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Children write these to their sponsors. Sponsors only see a message
          after you approve it.
        </p>
      </div>
      <ModerationList items={items} />
    </div>
  );
}
