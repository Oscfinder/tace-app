import { getConcerns } from "@/lib/admin/concerns";
import { ConcernsList } from "@/components/admin/concerns/concerns-list";

export default async function ConcernsPage() {
  const items = await getConcerns();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          Safeguarding Concerns
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Concerns raised by mentors, sponsors and children&apos;s accounts. Review them promptly
          and record the outcome by closing them.
        </p>
      </div>
      <ConcernsList items={items} />
    </div>
  );
}
