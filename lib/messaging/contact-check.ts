// Detects contact details in a message so it can be BLOCKED before sending,
// with a kind explanation. The database has the same idea as a backstop
// (it flags what slips through); this is the friendly first line.
//
// Deliberately a little strict: a false alarm just asks the writer to
// rephrase; a miss could put a child in touch with someone off the platform.

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;
const LINK = /(https?:\/\/|www\.)\S+/i;
const DOMAIN = /\b[a-z0-9-]+\.(com|ng|org|net|co|io|me|app|info|biz|xyz)\b/i;
const HANDLE = /(^|\s)@[a-z0-9._]{3,}/i;
// A run of 9+ digits, allowing spaces, dots, dashes and brackets between them
// (phone numbers), including the +234 form.
const PHONE = /(\+?\d[\s().-]?){9,}/;
const APP_WITH_NUMBER =
  /\b(whatsapp|telegram|instagram|snapchat|facebook|tiktok)\b.{0,30}\d/i;
const APP_NAME = /\b(whatsapp|telegram|instagram|snapchat|tiktok|signal)\b/i;

export type ContactKind = "phone" | "email" | "link" | "handle" | "app";

export function findContactDetails(text: string): ContactKind | null {
  if (EMAIL.test(text)) return "email";
  if (LINK.test(text) || DOMAIN.test(text)) return "link";
  if (PHONE.test(text)) return "phone";
  if (HANDLE.test(text)) return "handle";
  if (APP_WITH_NUMBER.test(text) || APP_NAME.test(text)) return "app";
  return null;
}

export const CONTACT_BLOCKED_MESSAGE =
  "To keep everyone safe, messages on TACE can't include phone numbers, email addresses, links or social media names. Please take those out and send again. You can talk about anything else here.";
