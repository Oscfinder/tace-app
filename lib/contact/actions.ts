"use server";

import { z } from "zod";
import { allowAttempt, LIMITS, RATE_LIMITED_MESSAGE } from "@/lib/security/rate-limit";
import { getFoundationSettings } from "@/lib/site-settings";
import { emailContext, sendEmail } from "@/lib/email/send";
import { contactMessage } from "@/lib/email/templates";

export type ContactState = { ok: boolean; message: string };

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(200),
  message: z
    .string()
    .trim()
    .min(10, "Please write a little more (at least 10 characters).")
    .max(2000, "Please keep your message under 2,000 characters."),
});

const FALLBACK_INBOX = "tacefoundationinfo@gmail.com";

// Public contact form. No account, so it is rate limited by IP and has a hidden
// field that people never fill in but simple bots do. The message is emailed to
// the foundation's contact address (Admin > Settings); nothing is stored.
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Bots fill every field. Pretend it worked so they learn nothing.
  if (String(formData.get("website") ?? "") !== "") {
    return { ok: true, message: "Thank you. Your message has been sent." };
  }

  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
    };
  }

  if (!(await allowAttempt(LIMITS.contactIp))) {
    return { ok: false, message: RATE_LIMITED_MESSAGE };
  }

  try {
    const settings = await getFoundationSettings();
    const to = settings.contact_email || FALLBACK_INBOX;
    const result = await sendEmail({
      to,
      replyTo: parsed.data.email,
      ...contactMessage(emailContext(), parsed.data),
    });
    if (!result.stubbed && result.error) {
      // Log why (type and text from the email service), never the visitor's message.
      throw new Error(`${result.error.name}: ${result.error.message}`);
    }
  } catch (err) {
    console.error("Contact form email failed:", err instanceof Error ? err.message : "unknown");
    return {
      ok: false,
      message: "We could not send your message just now. Please try again, or email us directly.",
    };
  }
  return {
    ok: true,
    message: "Thank you. Your message has been sent. We will reply as soon as we can.",
  };
}
