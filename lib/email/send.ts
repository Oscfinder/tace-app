import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// No verified sending domain configured yet — onboarding@resend.dev works
// out of the box for testing. Swap for a verified TACE domain address once
// one exists in the Resend dashboard.
const FROM_ADDRESS = "TACE Foundation <onboarding@resend.dev>";

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.log("[email stub — RESEND_API_KEY not set] Would send:", {
      to: input.to,
      subject: input.subject,
    });
    return { stubbed: true as const };
  }

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  if (error) {
    console.error("Resend send failed:", error);
  }

  return { stubbed: false as const, data, error };
}
