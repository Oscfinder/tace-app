// The five career clusters. The AI is only ever allowed to talk about these
// (and only the top two for a given child); it never decides the clusters.

// TACE's six real programmes — the single source of truth. Nothing else in the
// career feature may name a programme that is not in this list.
export const PROGRAMMES = [
  "Education Support",
  "Vocational Training",
  "Mentorship",
  "Career Discovery",
  "Enterprise Development",
  "Community Outreach",
] as const;
export type Programme = (typeof PROGRAMMES)[number];

export const CLUSTER_IDS = [
  "builder",
  "creative",
  "people",
  "analytical",
  "business",
] as const;
export type ClusterId = (typeof CLUSTER_IDS)[number];

// When two clusters have the same score, the earlier one here wins. Fixed, so
// the same answers always give the same result.
export const TIE_BREAK_ORDER: readonly ClusterId[] = [
  "analytical",
  "builder",
  "people",
  "creative",
  "business",
];

export type Cluster = {
  id: ClusterId;
  name: string;
  /** Short, child-friendly description (also the no-AI fallback text). */
  description: string;
  /** 2-3 real roles that exist in Nigeria. */
  roles: string[];
  /** The matching TACE programme (one of the six real ones). */
  programme: Programme;
  /** Which mentor track this cluster points to. */
  mentorTrack: "career" | "tech";
  accent: "blue" | "pink" | "teal" | "purple" | "amber";
};

export const CLUSTERS: Record<ClusterId, Cluster> = {
  builder: {
    id: "builder",
    name: "Builder / Technical",
    description:
      "You like working with your hands and figuring out how things work. You enjoy fixing, making and building, and you are happiest when you can see something real come together.",
    roles: ["Electrician", "Software developer", "Mechanic or auto technician"],
    programme: "Vocational Training",
    mentorTrack: "tech",
    accent: "blue",
  },
  creative: {
    id: "creative",
    name: "Creative",
    description:
      "You have imagination and love making things look, sound or feel special. Stories, art, music, design or fashion can make you light up, and you see things in your own way.",
    roles: ["Graphic designer", "Fashion designer or tailor", "Photographer or videographer"],
    programme: "Vocational Training",
    mentorTrack: "career",
    accent: "pink",
  },
  people: {
    id: "people",
    name: "People & Care",
    description:
      "You care about others and are good at listening, helping and encouraging. You feel proud when you make someone's day better or help your community.",
    roles: ["Nurse or midwife", "Teacher", "Social worker or community health worker"],
    programme: "Mentorship",
    mentorTrack: "career",
    accent: "teal",
  },
  analytical: {
    id: "analytical",
    name: "Analytical / Academic",
    description:
      "You are curious and like understanding the 'why' behind things. Numbers, science, reading and solving puzzles come naturally, and you enjoy thinking things through carefully.",
    roles: ["Engineer", "Accountant", "Doctor or pharmacist"],
    programme: "Education Support",
    mentorTrack: "career",
    accent: "purple",
  },
  business: {
    id: "business",
    name: "Business / Enterprise",
    description:
      "You spot opportunities, like to lead, and enjoy buying, selling and organising. You are not afraid to try new ideas, and you dream of running something of your own.",
    roles: ["Trader or shop owner", "Entrepreneur", "Sales or marketing officer"],
    programme: "Enterprise Development",
    mentorTrack: "career",
    accent: "amber",
  },
};

export const CLUSTER_LIST: Cluster[] = CLUSTER_IDS.map((id) => CLUSTERS[id]);
