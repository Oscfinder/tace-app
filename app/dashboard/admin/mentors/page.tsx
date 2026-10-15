import { getMentorList } from "@/lib/admin/mentors";
import { MentorsTable } from "@/components/admin/mentors/mentors-table";

export default async function MentorsPage() {
  const mentors = await getMentorList();
  const pending = mentors.filter((m) => m.vetting_status === "pending").length;

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">Mentors</h1>
        <p className="mt-1 text-sm text-tace-gray">
          Vet, activate and match mentors.{" "}
          {pending > 0
            ? `${pending} ${pending === 1 ? "mentor is" : "mentors are"} waiting for vetting.`
            : "Nobody is waiting for vetting."}
        </p>
      </div>
      <div className="rounded-[13px] border border-[#e5edf6] bg-white p-5 shadow-[0_8px_28px_rgba(20,55,95,0.07)]">
        <MentorsTable mentors={mentors} />
      </div>
    </div>
  );
}
