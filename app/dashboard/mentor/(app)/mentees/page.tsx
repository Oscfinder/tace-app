import { Users } from "lucide-react";
import { getMentees } from "@/lib/mentor/queries";
import { MenteeCard } from "@/components/mentor/mentee-card";
import { EmptyState, PageHeader } from "@/components/member/ui";

export default async function MenteesPage() {
  const mentees = await getMentees();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="My mentees"
        title="The children you mentor"
        subtitle="Open a child to write notes, set the next check-in or raise a concern."
      />
      {mentees.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {mentees.map((m) => (
            <MenteeCard key={m.id} mentee={m} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          accent="purple"
          title="No active mentees yet"
          message="When you and a child's guardian have both accepted a request, the child will appear here."
        />
      )}
    </div>
  );
}
