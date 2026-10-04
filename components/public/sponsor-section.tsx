import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";
import { stageProgress } from "@/lib/beneficiary-stages";

export type FeaturedBeneficiary = {
  id: string;
  first_name: string;
  age: number;
  current_stage: string;
  support_needed: string[] | null;
  photoUrl: string | null;
};

function ChildCard({ child }: { child: FeaturedBeneficiary }) {
  const progress = stageProgress(child.current_stage);
  const need = child.support_needed?.[0] ?? "General support";

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-white transition-all hover:-translate-y-1.5 hover:border-tace-blue hover:shadow-xl">
      <div className="relative h-56 bg-gradient-to-br from-tace-blue to-tace-navy">
        {child.photoUrl ? (
          <Image
            src={child.photoUrl}
            alt={child.first_name}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl font-extrabold text-white/90">
            {child.first_name.charAt(0)}
          </div>
        )}
        <span className="absolute left-3.5 top-3.5 rounded-full bg-tace-yellow px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-tace-navy">
          {progress.label}
        </span>
      </div>
      <div className="p-5">
        <div className="font-heading text-lg font-extrabold text-tace-navy">
          {child.first_name}, {child.age}
        </div>
        <div className="mt-1 mb-3.5 text-sm font-medium text-tace-gray">
          Needs: <strong className="font-bold text-tace-blue">{need}</strong>
        </div>
        <div className="mb-4">
          <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-tace-blue transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold text-tace-gray">
            <span>
              Stage {progress.position} of {progress.total}
            </span>
            <span>{progress.percent}%</span>
          </div>
        </div>
        <Button
          render={<Link href={`/sponsor/${child.id}`} />}
          className="w-full bg-tace-blue text-white hover:bg-tace-blue/90"
        >
          Sponsor {child.first_name}
        </Button>
      </div>
    </div>
  );
}

function PlaceholderCard() {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-border bg-white">
      <div className="flex h-56 items-center justify-center bg-tace-lgray text-sm font-semibold text-tace-gray">
        Coming Soon
      </div>
      <div className="p-5">
        <div className="h-4 w-2/3 rounded bg-tace-lgray" />
        <div className="mt-3 h-3 w-1/2 rounded bg-tace-lgray" />
        <Button variant="outline" className="mt-5 w-full" disabled>
          Get Notified
        </Button>
      </div>
    </div>
  );
}

export function SponsorSection({
  beneficiaries,
}: {
  beneficiaries: FeaturedBeneficiary[];
}) {
  return (
    <section className="bg-white px-4 py-20 md:px-8 md:py-[88px]" id="sponsor">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionHeading
            tag="Sponsor a Child"
            title="Sponsor a Child Today"
            subtitle="These children have been assessed and approved by the TACE Board of Trustees."
          />
          <Button render={<Link href="/sponsor" />} variant="outline" size="lg">
            View All Children
          </Button>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {beneficiaries.length > 0
            ? beneficiaries.map((child) => (
                <ChildCard key={child.id} child={child} />
              ))
            : [0, 1, 2].map((i) => <PlaceholderCard key={i} />)}
        </div>
      </div>
    </section>
  );
}
