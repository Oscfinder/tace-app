import { getBeneficiaries } from "@/lib/admin/beneficiaries";
import { BeneficiariesTable } from "@/components/admin/beneficiaries/beneficiaries-table";

export default async function BeneficiariesPage() {
  const beneficiaries = await getBeneficiaries();

  return (
    <div className="flex flex-col gap-6 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">
          Beneficiaries
        </h1>
        <p className="mt-1 text-sm text-tace-gray">
          Every approved child in the system.
        </p>
      </div>

      <div className="rounded-[14px] border border-[#ECEFF3] bg-white p-5">
        <BeneficiariesTable beneficiaries={beneficiaries} />
      </div>
    </div>
  );
}
