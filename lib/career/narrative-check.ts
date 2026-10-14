import { PROGRAMMES } from "@/lib/career/clusters";

// Words that make a capitalised phrase look like the name of a programme,
// course or scheme. ("Foundation" is deliberately absent: "TACE Foundation"
// is the organisation, not a programme.)
const PROGRAMME_WORDS =
  "Programmes?|Programs?|Workshops?|Academy|Academies|Schemes?|Initiatives?|Courses?|Bootcamps?|Apprenticeships?|Fellowships?|Scholarships?|Classes";

const PROGRAMME_LIKE = new RegExp(
  `\\b([A-Z][\\w'&-]*(?:\\s+(?:&|and|of|for)?\\s*[A-Z][\\w'&-]*)*)\\s+(?:${PROGRAMME_WORDS})\\b`,
  "g",
);

/**
 * True if the narrative names any programme that is not one of TACE's six
 * real ones, or names a real programme other than the ones that were supplied
 * for this child. Provider-neutral: runs on whatever text a model returns.
 */
export function mentionsUnsuppliedProgramme(
  text: string,
  suppliedProgrammes: readonly string[],
): boolean {
  // 1. A real programme that was NOT supplied for this child.
  for (const name of PROGRAMMES) {
    if (suppliedProgrammes.includes(name)) continue;
    // Case-sensitive on purpose: "mentorship" in a normal sentence is fine,
    // "Mentorship" as a capitalised name is not (unless it was supplied).
    if (new RegExp(`\\b${name}\\b`).test(text)) return true;
  }

  // 2. Anything programme-like that is not one of the six. Remove the real
  //    names first so "Vocational Training programme" is not flagged.
  let rest = text;
  for (const name of PROGRAMMES) {
    rest = rest.replace(new RegExp(`\\b${name}\\b`, "gi"), " ");
  }
  PROGRAMME_LIKE.lastIndex = 0;
  return PROGRAMME_LIKE.test(rest);
}
