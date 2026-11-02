import { Resend } from "resend";
import type { RenderedEmail } from "./layout.ts";
import { getSiteUrl } from "@/lib/site-url";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// One sender address for everything. Until the foundation's domain is verified in
// Resend, onboarding@resend.dev works for testing but can only reach the Resend
// account's own address. Once the domain is verified, set EMAIL_FROM, for example
//   EMAIL_FROM="TACE Foundation <no-reply@tacefoundation.org>"
// See docs/EMAIL_SETUP.md.
const FROM_ADDRESS = process.env.EMAIL_FROM || "TACE Foundation <onboarding@resend.dev>";
// Where replies go. Leave unset for "do not reply".
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

/** The context every template needs (the site address and the support email shown in the footer). */
export function emailContext() {
  return { siteUrl: getSiteUrl(), supportEmail: REPLY_TO };
}

export async function sendEmail(input: { to: string; replyTo?: string } & RenderedEmail) {
  if (!resend) {
    console.log("[email stub: RESEND_API_KEY not set] Would send:", {
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
    text: input.text,
    ...(input.replyTo || REPLY_TO ? { replyTo: input.replyTo || REPLY_TO } : {}),
  });

  if (error) {
    console.error("Resend send failed:", error);
  }

  return { stubbed: false as const, data, error };
}
