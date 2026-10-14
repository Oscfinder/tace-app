"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { QUESTIONS, MAX_TEXT_LENGTH } from "@/lib/career/questions";
import { submitAssessment } from "@/lib/career/actions";
import { ResultView, type ResultData } from "@/components/career/result-view";

const RATING_LABELS = ["Not like me", "A little", "Sometimes", "Quite a lot", "Very much me"];

// One question at a time. Answers live in component state only.
export function Quiz() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const total = QUESTIONS.length;
  const q = QUESTIONS[index];
  const isLast = index === total - 1;
  const percent = Math.round((index / total) * 100);

  function focusHeading() {
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  function answer(value: string | number) {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    // Choices and ratings move on by themselves; text uses the Next button.
    if (q.type !== "text") {
      setTimeout(() => {
        setIndex((i) => Math.min(i + 1, total - 1));
        focusHeading();
      }, 180);
    }
  }

  async function finish() {
    setSubmitting(true);
    setError(null);
    const res = await submitAssessment(answers);
    setSubmitting(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setResult({
      topClusters: res.result.topClusters,
      scores: res.result.scores,
      maxScore: res.result.maxScore,
      narrative: res.result.narrative,
      mentorTrack: res.result.mentorTrack,
    });
    router.refresh();
  }

  if (result) return <ResultView data={result} />;

  const current = answers[q.id];
  const textValue = typeof current === "string" ? current : "";

  return (
    <div className="rounded-[22px] border border-m-line bg-white p-5 shadow-m-card sm:p-7">
      <div className="flex items-center justify-between text-sm font-semibold text-m-muted">
        <span>
          Question {index + 1} of {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Quiz progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-3 overflow-hidden rounded-full bg-[#e6edf4]"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-m-blue to-[#20c4d8] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="m-head mt-6 mb-5 text-2xl leading-snug font-extrabold text-m-ink outline-none"
      >
        {q.prompt}
      </h2>

      {q.type === "choice" ? (
        <div className="grid gap-3" role="group" aria-label={q.prompt}>
          {(["a", "b"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => answer(key)}
              aria-pressed={current === key}
              className={`min-h-16 rounded-2xl border-2 px-5 py-4 text-left text-[18px] font-semibold transition active:scale-[0.99] ${
                current === key
                  ? "border-m-blue bg-[#e5f6ff] text-m-ink"
                  : "border-m-line bg-white text-[#35597d] hover:border-[#bfe6fb]"
              }`}
            >
              {q[key].label}
            </button>
          ))}
        </div>
      ) : null}

      {q.type === "rating" ? (
        <div role="group" aria-label={q.prompt}>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => answer(n)}
                aria-pressed={current === n}
                aria-label={`${n} — ${RATING_LABELS[n - 1]}`}
                className={`m-head min-h-16 rounded-2xl border-2 text-2xl font-extrabold transition active:scale-95 ${
                  current === n
                    ? "border-m-blue bg-gradient-to-br from-m-blue to-[#19b2ed] text-white"
                    : "border-m-line bg-white text-[#35597d] hover:border-[#bfe6fb]"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-sm text-m-muted">
            <span>Not like me</span>
            <span>Very much me</span>
          </div>
        </div>
      ) : null}

      {q.type === "text" ? (
        <div>
          <label htmlFor={q.id} className="sr-only">
            {q.prompt}
          </label>
          <textarea
            id={q.id}
            value={textValue}
            onChange={(e) => answer(e.target.value.slice(0, MAX_TEXT_LENGTH))}
            rows={4}
            maxLength={MAX_TEXT_LENGTH}
            placeholder={q.placeholder}
            className="w-full rounded-2xl border-2 border-m-line bg-[#fbfcfe] px-4 py-3 text-[18px] leading-relaxed outline-none focus-visible:border-[#89d3f5] focus-visible:ring-4 focus-visible:ring-[#0ba6e820]"
          />
          <p className="mt-1 text-right text-sm text-m-muted">
            {textValue.length}/{MAX_TEXT_LENGTH}
          </p>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-[#ffecf2] px-4 py-3 text-base font-medium text-[#d63e69]">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setIndex((i) => Math.max(0, i - 1));
            focusHeading();
          }}
          disabled={index === 0 || submitting}
          className={`min-h-12 rounded-xl border border-m-line bg-white px-6 text-base font-bold text-[#35597d] disabled:opacity-40 ${index === 0 ? "invisible" : ""}`}
        >
          Back
        </button>

        {q.type === "text" && !isLast ? (
          <button
            type="button"
            onClick={() => {
              setIndex((i) => i + 1);
              focusHeading();
            }}
            className="min-h-12 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-8 text-base font-bold text-white shadow-[0_8px_18px_#009de832]"
          >
            Next
          </button>
        ) : null}

        {isLast ? (
          <button
            type="button"
            onClick={finish}
            disabled={submitting}
            className="flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-m-blue to-m-blue2 px-6 text-base font-bold text-white shadow-[0_8px_18px_#009de832] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-5 animate-spin" /> : null}
            {submitting ? "Working on your result…" : "See my result"}
          </button>
        ) : null}
      </div>

      {q.type !== "text" && current === undefined ? (
        <p className="mt-4 text-center text-sm text-m-muted">
          Tap an answer to carry on.
        </p>
      ) : null}
    </div>
  );
}
