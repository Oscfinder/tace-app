import type { Metadata } from "next";
import { ApplyForm } from "@/components/apply/apply-form";

export const metadata: Metadata = {
  title: "Apply for support | TACE Welfare Foundation",
  description:
    "Apply for education, mentorship and skills support for a child through TACE Welfare Foundation.",
};

export default function ApplyPage() {
  return (
    <main className="bg-[#f3f7fc] px-4 pt-28 pb-16 sm:px-6 sm:pt-32">
      <div className="mx-auto max-w-2xl">
        <div className="mb-7 text-center">
          <p className="text-xs font-bold tracking-[1.3px] text-tace-blue uppercase">
            Apply for support
          </p>
          <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-tight text-tace-navy sm:text-4xl">
            Tell us about the child
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-[15px] leading-relaxed text-tace-gray">
            It takes about 10 minutes. Your answers are private and are only
            seen by the TACE team. You don&apos;t need an account to apply.
          </p>
        </div>
        <ApplyForm />
      </div>
    </main>
  );
}
