import { escapeHtml } from "./escape.ts";

// One look for every email the platform sends, and a plain-text twin made from
// the same content, so the two can never disagree. Everything a person typed is
// escaped here, in one place. No images are needed to read the message, because
// many phones block them.

export type Block =
  | { kind: "p"; text: string }
  | { kind: "button"; label: string; href: string }
  | { kind: "note"; text: string };

export type EmailContent = {
  subject: string;
  /** Short line shown next to the subject in some inboxes. */
  preheader: string;
  heading: string;
  blocks: Block[];
};

export type RenderedEmail = { subject: string; html: string; text: string };

const BLUE = "#1597d1";
const NAVY = "#102a4d";
const GRAY = "#4a607f";

// Text inside a paragraph may mark words in bold with **double stars**. The
// markers become <strong> in HTML and disappear in plain text.
function inlineHtml(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
function inlineText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

export function renderEmail(content: EmailContent, supportEmail?: string): RenderedEmail {
  const body = content.blocks
    .map((b) => {
      if (b.kind === "p") {
        return `<p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:${NAVY};">${inlineHtml(b.text)}</p>`;
      }
      if (b.kind === "note") {
        return `<p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:${GRAY};">${inlineHtml(b.text)}</p>`;
      }
      return (
        `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;"><tr><td style="border-radius:8px;background:${BLUE};">` +
        `<a href="${escapeHtml(b.href)}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;">${escapeHtml(b.label)}</a>` +
        `</td></tr></table>` +
        `<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:${GRAY};">If the button does not work, copy this address into your browser:<br><a href="${escapeHtml(b.href)}" style="color:${BLUE};word-break:break-all;">${escapeHtml(b.href)}</a></p>`
      );
    })
    .join("\n");

  const support = supportEmail
    ? `Questions? Reply to this email or write to ${escapeHtml(supportEmail)}.`
    : "Please do not reply to this email.";

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f8fc;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8fc;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
<tr><td style="background:${NAVY};padding:20px 28px;"><span style="font-size:20px;font-weight:bold;color:#ffffff;">TACE Foundation</span><br><span style="font-size:13px;color:#b9cae0;">Guiding Children Toward Independence</span></td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:${NAVY};">${escapeHtml(content.heading)}</h1>
${body}
</td></tr>
<tr><td style="padding:18px 28px;background:#f7faff;font-size:12px;line-height:1.5;color:${GRAY};">TACE Welfare Foundation. ${support}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    content.heading,
    "",
    ...content.blocks.map((b) =>
      b.kind === "button" ? `${b.label}:\n${b.href}\n` : `${inlineText(b.text)}\n`,
    ),
    "--",
    "TACE Welfare Foundation, Guiding Children Toward Independence",
    supportEmail ? `Questions? Reply to this email or write to ${supportEmail}.` : "Please do not reply to this email.",
  ].join("\n");

  return { subject: content.subject, html, text };
}
