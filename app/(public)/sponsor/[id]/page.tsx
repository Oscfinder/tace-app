import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBody, PageHeader } from "@/components/public/page-shell";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/public/home-data";
import { stageProgress } from "@/lib/beneficiary-stages";

// A child is shown only if they are in the shared public list (guardian gave
// photography consent and the child is part of a published project). Anyone
// else, or an invalid id, gets the same "not found" page, so the page reveals
// nothing about children who are not public.
async function loadChild(id: string) {
  const { beneficiaries } = await getHomeData();
  return beneficiaries.find((b) => b.id === id) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const child = await loadChild(id);
  if (!child) return { title: "Not found | TACE Welfare Foundation" };
  return { title: `Sponsor ${child.first_name} | TACE Welfare Foundation` };
}

export default async function SponsorChildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const child = await loadChild(id);
  if (!child) notFound();
  const progress = stageProgress(child.current_stage);

  return (
    <>
      <PageHeader tag="Sponsor a child" title={`${child.first_name}, ${child.age}`} subtitle={`Stage ${progress.position} of ${progress.total}: ${progress.label}`} />
      <PageBody>
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <div className="relative aspect-square overflow-hidden rounded-[20px] bg-gradient-to-br from-tace-blue to-tace-navy">
            {child.photoUrl ? (
              <Image src={child.photoUrl} alt={child.first_name} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-7xl font-extrabold text-white/90" aria-hidden>
                {child.first_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="space-y-4 text-tace-gray">
            <p className="text-lg leading-relaxed">
              {child.first_name} has been assessed and approved by the TACE Board of Trustees.
              {child.support_needed?.length ? (
                <> Support needed: <strong className="text-tace-navy">{child.support_needed.join(", ")}</strong>.</>
              ) : null}
            </p>
            <p className="text-sm leading-relaxed">
              To protect {child.first_name}, we share only a first name, age, stage and photo here, with the guardian&apos;s consent. A sponsor who is linked to {child.first_name} can follow their progress after we have reviewed and approved the sponsor account.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button render={<Link href="/signup/sponsor" />} size="lg" className="bg-tace-blue text-white hover:bg-tace-blue/90">
                Become a sponsor
              </Button>
              <Button render={<Link href="/sponsor" />} size="lg" variant="outline">
                See other children
              </Button>
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
