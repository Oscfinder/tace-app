import { Check } from "lucide-react";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/beneficiary-stages";
import { STAGE_MESSAGES } from "@/lib/beneficiary/stages";

type Stage = (typeof STAGE_ORDER)[number];

// The 9-step journey. Used on the child's My Journey page (warm, second-person
// lines) and on the sponsor's My Child page (labels only, no first-person copy).
export function JourneyTracker({
  currentStage,
  audience = "child",
}: {
  currentStage: Stage;
  audience?: "child" | "sponsor" | "mentor";
}) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  const showMessages = audience === "child";

  return (
    <ol className="flex flex-col">
      {STAGE_ORDER.map((stage, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const last = i === STAGE_ORDER.length - 1;
        return (
          <li key={stage} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-full text-base font-extrabold ${
                  done
                    ? "bg-gradient-to-br from-[#08b99c] to-[#20c4a8] text-white"
                    : current
                      ? "bg-gradient-to-br from-m-blue to-[#19b2ed] text-white ring-4 ring-[#bfe6fb]"
                      : "bg-[#e9eff6] text-[#8294a8]"
                }`}
              >
                {done ? <Check className="size-5" aria-hidden /> : i + 1}
              </span>
              {!last ? (
                <span
                  className={`my-1 w-1 flex-1 rounded-full ${
                    done ? "bg-[#08b99c]" : "bg-[#e1e9f1]"
                  }`}
                  aria-hidden
                />
              ) : null}
            </div>

            <div
              className={`mb-4 min-w-0 flex-1 rounded-[18px] border p-4 ${
                current
                  ? "border-[#bfe6fb] bg-gradient-to-br from-[#f2faff] to-white shadow-m-card"
                  : done
                    ? "border-[#cdeee6] bg-[#f4fcf9]"
                    : "border-m-line bg-white/70"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  className={`m-head text-lg font-extrabold ${
                    current || done ? "text-m-ink" : "text-[#7a8ca3]"
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </h2>
                {current ? (
                  <span className="rounded-full bg-m-blue px-2.5 py-1 text-xs font-bold text-white">
                    {audience === "child" ? "You are here" : "Current step"}
                  </span>
                ) : null}
                {done ? (
                  <span className="rounded-full bg-[#e4fbf4] px-2.5 py-1 text-xs font-bold text-[#0a8f78]">
                    Done
                  </span>
                ) : null}
              </div>
              {showMessages ? (
                <p
                  className={`mt-1 text-[15px] leading-relaxed ${
                    current || done ? "text-[#4d6584]" : "text-[#8a9bb0]"
                  }`}
                >
                  {STAGE_MESSAGES[stage]}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
