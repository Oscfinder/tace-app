import { STAGE_ORDER } from "@/lib/beneficiary-stages";

// One warm, short line per stage, shown on My Journey.
export const STAGE_MESSAGES: Record<(typeof STAGE_ORDER)[number], string> = {
  identified: "Welcome to the TACE family! We see you, and we're proud of you.",
  assessed: "We've learned about your dreams. Now we can plan together.",
  education_support: "Learning is your superpower. Keep going!",
  vocational_training: "You're building skills nobody can ever take away.",
  certification: "Your hard work now has a certificate to show for it.",
  apprenticeship: "Learning from the best. You're on your way!",
  savings: "Small savings grow into big dreams.",
  employment: "You did it: your own work and your own income!",
  business_owner: "A business owner! You're an inspiration to others.",
};
