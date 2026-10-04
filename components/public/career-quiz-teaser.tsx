"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { SectionHeading } from "@/components/public/section-heading";
import { Button } from "@/components/ui/button";

type Cluster = "builder" | "creative" | "people" | "analytical" | "business";

const CLUSTER_INFO: Record<
  Cluster,
  { label: string; description: string; roles: string[] }
> = {
  builder: {
    label: "Builder / Technical",
    description: "You like making and fixing things with your hands.",
    roles: ["Mechanic", "Electrician", "Fabricator"],
  },
  creative: {
    label: "Creative",
    description: "You express yourself through art, design, or performance.",
    roles: ["Graphic Designer", "Fashion Designer", "Musician"],
  },
  people: {
    label: "People & Care",
    description: "You're energised by helping and connecting with others.",
    roles: ["Nurse", "Teacher", "Social Worker"],
  },
  analytical: {
    label: "Analytical / Academic",
    description: "You enjoy solving problems and working things out logically.",
    roles: ["Software Developer", "Accountant", "Research Scientist"],
  },
  business: {
    label: "Business / Enterprise",
    description: "You like organising, leading, and building ventures.",
    roles: ["Entrepreneur", "Sales Manager", "Project Manager"],
  },
};

const QUESTIONS: {
  prompt: string;
  options: [
    { label: string; cluster: Cluster },
    { label: string; cluster: Cluster },
  ];
}[] = [
  {
    prompt: "Would you rather...",
    options: [
      { label: "Fix something broken", cluster: "builder" },
      { label: "Explain something to someone", cluster: "people" },
    ],
  },
  {
    prompt: "Would you rather...",
    options: [
      { label: "Work with numbers", cluster: "analytical" },
      { label: "Work with people", cluster: "people" },
    ],
  },
  {
    prompt: "Would you rather...",
    options: [
      { label: "Design something beautiful", cluster: "creative" },
      { label: "Organise a plan", cluster: "business" },
    ],
  },
  {
    prompt: "Would you rather...",
    options: [
      { label: "Build something with your hands", cluster: "builder" },
      { label: "Solve a tricky problem", cluster: "analytical" },
    ],
  },
  {
    prompt: "Would you rather...",
    options: [
      { label: "Start your own small business", cluster: "business" },
      { label: "Help someone who is struggling", cluster: "people" },
    ],
  },
  {
    prompt: "Would you rather...",
    options: [
      { label: "Create a piece of art or music", cluster: "creative" },
      { label: "Take something apart to see how it works", cluster: "builder" },
    ],
  },
];

export function CareerQuizTeaser() {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<Cluster, number>>({
    builder: 0,
    creative: 0,
    people: 0,
    analytical: 0,
    business: 0,
  });

  const finished = step >= QUESTIONS.length;

  function answer(cluster: Cluster) {
    setScores((prev) => ({ ...prev, [cluster]: prev[cluster] + 1 }));
    setStep((s) => s + 1);
  }

  function retake() {
    setStep(0);
    setScores({
      builder: 0,
      creative: 0,
      people: 0,
      analytical: 0,
      business: 0,
    });
  }

  const topCluster = (Object.entries(scores) as [Cluster, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
  const result = CLUSTER_INFO[topCluster];

  return (
    <section className="bg-white px-4 py-20 md:px-8 md:py-[88px]">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          tag="Career Path Quiz"
          title="Not Sure What Path Fits You? Find Out in 2 Minutes"
          center
        />

        <div className="mt-10 rounded-[20px] border border-border bg-tace-lgray p-8 md:p-10">
          {!finished ? (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-tace-blue transition-all"
                  style={{ width: `${(step / QUESTIONS.length) * 100}%` }}
                />
              </div>
              <p className="mt-6 text-center text-sm font-semibold text-tace-gray">
                Question {step + 1} of {QUESTIONS.length}
              </p>
              <p className="mt-2 text-center font-heading text-xl font-extrabold text-tace-navy">
                {QUESTIONS[step].prompt}
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {QUESTIONS[step].options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => answer(option.cluster)}
                    className="rounded-2xl border-2 border-border bg-white px-6 py-8 text-center text-base font-bold text-tace-navy transition-all hover:border-tace-blue hover:-translate-y-1 hover:shadow-lg"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <span className="inline-flex items-center rounded-full bg-tace-blue/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-tace-blue">
                Your Result
              </span>
              <h3 className="mt-4 font-heading text-2xl font-extrabold text-tace-navy">
                {result.label}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-tace-gray">
                {result.description}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {result.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-tace-navy ring-1 ring-border"
                  >
                    {role}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Button
                  render={<Link href="/apply" />}
                  size="lg"
                  className="bg-tace-blue text-white hover:bg-tace-blue/90"
                >
                  Want real guidance from a TACE mentor? Apply to become a
                  beneficiary
                </Button>
                <Button variant="ghost" onClick={retake}>
                  <RotateCcw className="size-4" />
                  Retake Quiz
                </Button>
              </div>
            </div>
          )}

          {!finished && step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="mx-auto mt-6 flex items-center gap-1 text-sm font-semibold text-tace-gray hover:text-tace-navy"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
