import { CLUSTER_IDS, type ClusterId } from "@/lib/career/clusters";

export type ChoiceQuestion = {
  id: string;
  type: "choice";
  prompt: string;
  a: { label: string; cluster: ClusterId };
  b: { label: string; cluster: ClusterId };
};
export type RatingQuestion = {
  id: string;
  type: "rating";
  prompt: string;
  cluster: ClusterId;
};
export type TextQuestion = {
  id: string;
  type: "text";
  prompt: string;
  placeholder: string;
};
export type Question = ChoiceQuestion | RatingQuestion | TextQuestion;

export const MAX_TEXT_LENGTH = 300;

// 10 this-or-that questions: every pair of the five clusters appears exactly
// once, so each cluster is offered 4 times and no cluster is favoured.
export const QUESTIONS: Question[] = [
  { id: "c1", type: "choice", prompt: "Which sounds more fun?",
    a: { label: "Fixing a broken phone or radio", cluster: "builder" },
    b: { label: "Drawing or designing something new", cluster: "creative" } },
  { id: "c2", type: "choice", prompt: "Which would you rather do?",
    a: { label: "Build something with tools", cluster: "builder" },
    b: { label: "Help someone who feels sad or sick", cluster: "people" } },
  { id: "c3", type: "choice", prompt: "Which sounds more like you?",
    a: { label: "Work out how a machine works", cluster: "builder" },
    b: { label: "Solve a hard maths or science puzzle", cluster: "analytical" } },
  { id: "c4", type: "choice", prompt: "Which would you pick?",
    a: { label: "Fix things and make them work", cluster: "builder" },
    b: { label: "Start a small business and sell things", cluster: "business" } },
  { id: "c5", type: "choice", prompt: "Which sounds more fun?",
    a: { label: "Make music, art or a story", cluster: "creative" },
    b: { label: "Look after and teach younger children", cluster: "people" } },
  { id: "c6", type: "choice", prompt: "Which would you rather do?",
    a: { label: "Design a poster or an outfit", cluster: "creative" },
    b: { label: "Find out why things happen in science", cluster: "analytical" } },
  { id: "c7", type: "choice", prompt: "Which sounds more like you?",
    a: { label: "Share your ideas through art or video", cluster: "creative" },
    b: { label: "Sell something and earn your own money", cluster: "business" } },
  { id: "c8", type: "choice", prompt: "Which would you pick?",
    a: { label: "Listen to a friend and give advice", cluster: "people" },
    b: { label: "Work through numbers and facts carefully", cluster: "analytical" } },
  { id: "c9", type: "choice", prompt: "Which sounds more fun?",
    a: { label: "Help people in your community", cluster: "people" },
    b: { label: "Lead a team to reach a goal", cluster: "business" } },
  { id: "c10", type: "choice", prompt: "Which would you rather do?",
    a: { label: "Read and learn how the world works", cluster: "analytical" },
    b: { label: "Plan how to grow a shop or idea", cluster: "business" } },

  // 1–5 ratings, one per cluster.
  { id: "r1", type: "rating", cluster: "builder",
    prompt: "I enjoy making or repairing things with my hands." },
  { id: "r2", type: "rating", cluster: "creative",
    prompt: "I love coming up with creative ideas that are my own." },
  { id: "r3", type: "rating", cluster: "people",
    prompt: "I feel good when I am helping other people." },
  { id: "r4", type: "rating", cluster: "analytical",
    prompt: "I like finding answers by thinking things through." },
  { id: "r5", type: "rating", cluster: "business",
    prompt: "I like the idea of running my own business one day." },

  // Two short open prompts (treated strictly as data, never as instructions).
  { id: "t1", type: "text",
    prompt: "What is something you are really proud of doing?",
    placeholder: "Write a sentence or two (optional)" },
  { id: "t2", type: "text",
    prompt: "What would you love to do when you grow up?",
    placeholder: "Write a sentence or two (optional)" },
];

export const QUESTION_IDS = QUESTIONS.map((q) => q.id);

// Sanity guard (runs at import): every cluster appears the same number of times.
if (process.env.NODE_ENV !== "production") {
  const seen = Object.fromEntries(CLUSTER_IDS.map((c) => [c, 0])) as Record<ClusterId, number>;
  for (const q of QUESTIONS) {
    if (q.type === "choice") {
      seen[q.a.cluster]++;
      seen[q.b.cluster]++;
    }
  }
  const counts = new Set(Object.values(seen));
  if (counts.size !== 1) {
    console.warn("career/questions: clusters are not evenly offered", seen);
  }
}
