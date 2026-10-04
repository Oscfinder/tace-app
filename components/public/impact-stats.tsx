import { SectionHeading } from "@/components/public/section-heading";
import { AnimatedCounter } from "@/components/public/animated-counter";

export type ImpactStatsData = {
  childrenCount: number;
  mentorsCount: number;
  projectsCount: number;
  totalDonated: number;
};

function Stat({
  value,
  prefix,
  suffix,
  fallbackSuffix,
  label,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  fallbackSuffix: string;
  label: string;
}) {
  const hasData = value > 0;
  return (
    <div
      className="rounded px-6 py-10 text-center"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      <div className="font-heading text-[52px] font-extrabold leading-none text-tace-yellow">
        <AnimatedCounter
          value={value}
          prefix={prefix}
          suffix={hasData ? suffix : fallbackSuffix}
        />
      </div>
      <div className="mt-2.5 text-sm font-semibold leading-tight text-white/60">
        {label}
      </div>
    </div>
  );
}

export function ImpactStats({ data }: { data: ImpactStatsData }) {
  return (
    <section className="bg-tace-navy px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-[1280px]">
        <SectionHeading
          tag="Our Impact"
          title="Real children. Real change."
          subtitle="Every number below is a child whose life was touched by the generosity of our supporters."
          center
          dark
        />
        <div className="mt-14 grid grid-cols-2 gap-0.5 md:grid-cols-4">
          <Stat
            value={data.childrenCount || 10}
            fallbackSuffix="+"
            label="Children Supported"
          />
          <Stat
            value={data.mentorsCount || 3}
            fallbackSuffix="+"
            label="Active Mentors"
          />
          <Stat
            value={data.projectsCount || 0}
            fallbackSuffix="+"
            label="Projects Completed"
          />
          <Stat
            value={data.totalDonated || 0}
            prefix="₦"
            fallbackSuffix="0"
            label="Total Donated"
          />
        </div>
      </div>
    </section>
  );
}
