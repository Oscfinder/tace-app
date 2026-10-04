"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FeaturedBeneficiary } from "@/components/public/sponsor-section";

const AGE_RANGES: Record<string, [number, number]> = {
  "4-8": [4, 8],
  "9-12": [9, 12],
  "13-17": [13, 17],
  "18-24": [18, 24],
};

const SUPPORT_OPTIONS = [
  "Education Support",
  "Vocational Training",
  "Mentorship",
  "Healthcare",
  "Emergency Welfare",
];

export function ChildSearchCard({
  beneficiaries,
}: {
  beneficiaries: FeaturedBeneficiary[];
}) {
  const [ageRange, setAgeRange] = useState("");
  const [support, setSupport] = useState("");

  const filtered = useMemo(() => {
    return beneficiaries.filter((child) => {
      if (ageRange && AGE_RANGES[ageRange]) {
        const [min, max] = AGE_RANGES[ageRange];
        if (child.age < min || child.age > max) return false;
      }
      if (support) {
        const needs = (child.support_needed ?? []).map((s) => s.toLowerCase());
        if (!needs.some((n) => n.includes(support.toLowerCase()))) return false;
      }
      return true;
    });
  }, [beneficiaries, ageRange, support]);

  const featured = filtered[0] ?? beneficiaries[0] ?? null;

  return (
    <div className="rounded-[20px] bg-white/[0.97] p-7 shadow-2xl">
      <div className="text-lg font-extrabold text-tace-navy">
        Find a Child to Sponsor
      </div>
      <p className="mb-5 mt-1.5 text-[13px] font-medium text-tace-gray">
        Search for a child whose story connects with your heart.
      </p>

      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-tace-gray">
            Age Range
          </label>
          <select
            value={ageRange}
            onChange={(e) => setAgeRange(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm font-semibold text-tace-navy outline-none focus:border-tace-blue"
          >
            <option value="">Any Age</option>
            {Object.keys(AGE_RANGES).map((range) => (
              <option key={range} value={range}>
                {range} years
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-tace-gray">
            Support Needed
          </label>
          <select
            value={support}
            onChange={(e) => setSupport(e.target.value)}
            className="w-full rounded-lg border border-[#E5E7EB] px-3.5 py-2.5 text-sm font-semibold text-tace-navy outline-none focus:border-tace-blue"
          >
            <option value="">Any Support</option>
            {SUPPORT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <Button
          render={<Link href="/sponsor" />}
          className="mt-1 w-full bg-tace-blue text-white hover:bg-tace-blue/90"
        >
          <Search className="size-4" />
          Find a Child
        </Button>
      </div>

      <div className="mt-5 border-t border-[#F3F4F6] pt-5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wide text-tace-gray">
          Featured — Waiting for a Sponsor
        </div>
        {featured ? (
          <Link
            href={`/sponsor/${featured.id}`}
            className="flex items-center gap-3.5 rounded-xl bg-tace-lgray p-3.5 transition-colors hover:bg-[#E8F6FD]"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-tace-blue to-tace-navy text-xl font-bold text-white">
              {featured.first_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-bold text-tace-navy">
                {featured.first_name}, {featured.age} years old
              </div>
              <div className="mt-0.5 text-xs font-medium text-tace-gray">
                {featured.support_needed?.[0] ?? "General support"}
              </div>
            </div>
            <span className="shrink-0 text-xs font-bold text-tace-blue">
              View →
            </span>
          </Link>
        ) : (
          <p className="rounded-xl bg-tace-lgray p-3.5 text-sm font-medium text-tace-gray">
            No children match yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
