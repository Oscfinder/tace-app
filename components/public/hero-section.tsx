import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "@/components/public/animated-counter";
import { ChildSearchCard } from "@/components/public/child-search-card";
import type { FeaturedBeneficiary } from "@/components/public/sponsor-section";
import { STOCK_IMAGES } from "@/lib/public/stock-images";

export function HeroSection({
  beneficiaries,
  childrenCount,
  totalDonated,
}: {
  beneficiaries: FeaturedBeneficiary[];
  childrenCount: number;
  totalDonated: number;
}) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      <Image
        src={STOCK_IMAGES.hero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117]/[0.88] via-tace-navy/80 to-[#0d1117]/60" />
      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] gap-14 px-4 py-28 md:px-8 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-tace-yellow/40 bg-tace-yellow/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-tace-yellow">
            <span className="size-1.5 animate-pulse rounded-full bg-tace-yellow" />
            Registered NGO · RC: IT/9786795
          </div>
          <h1 className="font-heading text-[44px] font-extrabold leading-[1.05] tracking-tight text-white md:text-[68px]">
            Empower and
            <br />
            <span className="text-tace-yellow">Transform</span>
          </h1>
          <p className="mt-6 max-w-[520px] text-base font-medium leading-relaxed text-white/80 md:text-lg">
            Change the life of a vulnerable child in Nigeria — through
            education, mentorship, vocational training, and genuine human
            connection.
          </p>
          <div className="mt-10 flex flex-wrap gap-3.5">
            <Button
              render={<Link href="/sponsor" />}
              size="lg"
              className="bg-tace-yellow text-tace-navy hover:bg-tace-yellow/90"
            >
              Sponsor a Child
            </Button>
            <Button
              render={<Link href="/apply" />}
              size="lg"
              variant="outline"
              className="border-white/50 bg-transparent text-white hover:bg-white/10"
            >
              Apply for Support
            </Button>
            <Button
              render={<Link href="/donate" />}
              size="lg"
              className="border border-white/30 bg-white/15 text-white hover:bg-white/25"
            >
              Donate
            </Button>
          </div>
          <div className="mt-14 flex gap-8">
            <div className="text-center">
              <div className="font-heading text-3xl font-extrabold text-white">
                <AnimatedCounter value={childrenCount || 10} suffix="+" />
              </div>
              <div className="mt-0.5 text-xs font-semibold text-white/60">
                Children Supported
              </div>
            </div>
            <div className="text-center">
              <div className="font-heading text-3xl font-extrabold text-white">
                ₦<AnimatedCounter value={totalDonated || 390000} suffix="+" />
              </div>
              <div className="mt-0.5 text-xs font-semibold text-white/60">
                Deployed
              </div>
            </div>
            <div className="text-center">
              <div className="font-heading text-3xl font-extrabold text-white">
                2026
              </div>
              <div className="mt-0.5 text-xs font-semibold text-white/60">
                CAC Registered
              </div>
            </div>
          </div>
        </div>

        <ChildSearchCard beneficiaries={beneficiaries} />
      </div>
    </section>
  );
}
