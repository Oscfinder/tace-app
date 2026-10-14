export const EVENT_TYPES = ["meeting", "event", "training", "outreach"] as const;
export type EventTypeValue = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventTypeValue, string> = {
  meeting: "Meeting",
  event: "Event",
  training: "Training",
  outreach: "Outreach",
};
