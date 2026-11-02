import { renderEmail, type EmailContent, type RenderedEmail } from "./layout.ts";

// Every email the platform sends. Rules for all of them:
//  - plain, kind language; short sentences;
//  - a child is only ever called by their FIRST name, and no health, school or
//    family details appear;
//  - message emails say that a message exists, never what it says;
//  - no marketing, and no secret in a link except the one-time token Supabase
//    makes for sign-up and password links.
// Each function returns subject + HTML + plain text. They take the site address
// as a parameter so they are pure (easy to test and to preview).

type Ctx = { siteUrl: string; supportEmail?: string };
const done = (c: EmailContent, ctx: Ctx): RenderedEmail => renderEmail(c, ctx.supportEmail);
const link = (ctx: Ctx, path: string) => `${ctx.siteUrl.replace(/\/+$/, "")}${path}`;

export function applicationReceived(ctx: Ctx, p: { childFirstName: string; reference: string }) {
  return done(
    {
      subject: `TACE Foundation: we received ${p.childFirstName}'s application`,
      preheader: "Your reference number is inside.",
      heading: "We have received your application",
      blocks: [
        { kind: "p", text: `Thank you for applying to TACE Welfare Foundation for **${p.childFirstName}**.` },
        { kind: "p", text: `Your reference is **${p.reference}**. Please keep it if you need to contact us.` },
        { kind: "p", text: "We will contact you within 7 days." },
        { kind: "note", text: "Applying does not guarantee support. Every application is read carefully by our team." },
      ],
    },
    ctx,
  );
}

export function applicationApproved(
  ctx: Ctx,
  p: { greetingName: string; childFirstName: string; taceId: string; setPasswordLink: string | null },
) {
  return done(
    {
      subject: `TACE Foundation: ${p.childFirstName}'s application is approved`,
      preheader: "Good news. Set your password to sign in.",
      heading: "Your application has been approved",
      blocks: [
        { kind: "p", text: `Hello ${p.greetingName},` },
        { kind: "p", text: `We are happy to tell you that **${p.childFirstName}**'s application to TACE Welfare Foundation has been approved. Their TACE ID is **${p.taceId}**.` },
        { kind: "p", text: "We have made an account for you with this email address." },
        p.setPasswordLink
          ? { kind: "button", label: "Set your password and sign in", href: p.setPasswordLink }
          : { kind: "p", text: "You will get a separate email with a link to set your password." },
        { kind: "note", text: "The link can be used once and stops working after a short time. If it has expired, open the sign-in page and choose Forgot password." },
      ],
    },
    ctx,
  );
}

export function applicationRejected(ctx: Ctx, p: { childFirstName: string; reason: string }) {
  return done(
    {
      subject: "TACE Foundation: an update on your application",
      preheader: "Please read this message from our team.",
      heading: "An update on your application",
      blocks: [
        { kind: "p", text: `Thank you for applying to TACE Welfare Foundation for **${p.childFirstName}**.` },
        { kind: "p", text: "After careful review we are not able to go forward with this application at this time." },
        ...(p.reason.trim() ? [{ kind: "p" as const, text: p.reason.trim() }] : []),
        { kind: "p", text: "You are welcome to apply again in the future. We are sorry we could not say yes this time." },
      ],
    },
    ctx,
  );
}

export function memberApproved(ctx: Ctx, p: { name: string }) {
  return done(
    {
      subject: "TACE Foundation: your membership is approved",
      preheader: "You can now sign in.",
      heading: "Welcome to TACE Foundation",
      blocks: [
        { kind: "p", text: `Hello ${p.name},` },
        { kind: "p", text: "Your membership has been approved. You can now sign in and open your member dashboard." },
        { kind: "button", label: "Sign in", href: link(ctx, "/login") },
      ],
    },
    ctx,
  );
}

export function sponsorApproved(ctx: Ctx, p: { name: string }) {
  return done(
    {
      subject: "TACE Foundation: your sponsorship is approved",
      preheader: "You can now follow your child's progress.",
      heading: "Thank you for your sponsorship",
      blocks: [
        { kind: "p", text: `Hello ${p.name},` },
        { kind: "p", text: "Your sponsorship has been approved and you have been linked to a child. You can now sign in to follow their progress." },
        { kind: "button", label: "Sign in", href: link(ctx, "/login") },
      ],
    },
    ctx,
  );
}

export function mentorCleared(ctx: Ctx, p: { name: string; accountActive: boolean }) {
  return done(
    {
      subject: "TACE Foundation: you have been cleared as a mentor",
      preheader: "Thank you for completing our checks.",
      heading: "You have been cleared as a mentor",
      blocks: [
        { kind: "p", text: `Hello ${p.name},` },
        { kind: "p", text: "Thank you for completing our checks. We are pleased to tell you that you have been **cleared** as a TACE mentor." },
        ...(p.accountActive
          ? [{ kind: "button" as const, label: "Sign in", href: link(ctx, "/login") }]
          : [{ kind: "p" as const, text: "We will switch your account on shortly and email you when it is ready." }]),
      ],
    },
    ctx,
  );
}

export function mentorRejected(ctx: Ctx, p: { name: string }) {
  return done(
    {
      subject: "TACE Foundation: an update on your mentor application",
      preheader: "Thank you for your interest in mentoring.",
      heading: "An update on your mentor application",
      blocks: [
        { kind: "p", text: `Hello ${p.name},` },
        { kind: "p", text: "Thank you for your interest in mentoring with TACE Foundation. After careful review we are not able to take your application forward at this time." },
        { kind: "p", text: "We are grateful for the time you gave to the process." },
      ],
    },
    ctx,
  );
}

export function mentorAccountActive(ctx: Ctx, p: { name: string }) {
  return done(
    {
      subject: "TACE Foundation: your mentor account is active",
      preheader: "Sign in to read the code of conduct.",
      heading: "Your mentor account is active",
      blocks: [
        { kind: "p", text: `Hello ${p.name},` },
        { kind: "p", text: "Your mentor account is now active. Sign in to read and accept the code of conduct and to see any mentoring requests." },
        { kind: "button", label: "Sign in", href: link(ctx, "/login") },
      ],
    },
    ctx,
  );
}

export function adminInvited(ctx: Ctx, p: { name: string; setPasswordLink: string | null }) {
  return done(
    {
      subject: "TACE Foundation: you have been added as an administrator",
      preheader: "Set your password to get started.",
      heading: "You are now a TACE administrator",
      blocks: [
        { kind: "p", text: `Hello ${p.name},` },
        { kind: "p", text: "You have been added as an administrator of the TACE Foundation platform." },
        p.setPasswordLink
          ? { kind: "button", label: "Set your password and sign in", href: p.setPasswordLink }
          : { kind: "p", text: "Open the sign-in page and choose Forgot password to set a password." },
        { kind: "note", text: "Administrators can see private information about children. Please keep your password secret and never share your account." },
      ],
    },
    ctx,
  );
}

export function donationReceipt(
  ctx: Ctx,
  p: { donorName: string; amountFormatted: string; purpose: string | null; dateFormatted: string; bankRef: string | null },
) {
  return done(
    {
      subject: "TACE Foundation: your donation receipt",
      preheader: `Thank you for your gift of ${p.amountFormatted}.`,
      heading: "Thank you for your gift",
      blocks: [
        { kind: "p", text: `Hello ${p.donorName},` },
        { kind: "p", text: `Thank you for your donation of **${p.amountFormatted}**${p.purpose ? ` for ${p.purpose}` : ""}.` },
        { kind: "p", text: `Date received: ${p.dateFormatted}.${p.bankRef ? ` Your bank reference: ${p.bankRef}.` : ""}` },
        { kind: "note", text: "Please keep this email as your receipt. Every gift goes toward the education, training and mentoring of children in our programmes." },
      ],
    },
    ctx,
  );
}

// A message exists. The email NEVER says what it says or shows any of it.
export function newMessageNotice(ctx: Ctx, p: { recipientName: string; senderFirstName: string; messagesPath: string }) {
  return done(
    {
      subject: "TACE Foundation: you have a new message",
      preheader: `${p.senderFirstName} sent you a message.`,
      heading: "You have a new message",
      blocks: [
        { kind: "p", text: `Hello ${p.recipientName},` },
        { kind: "p", text: `**${p.senderFirstName}** sent you a message on TACE. Sign in to read it and reply.` },
        { kind: "button", label: "Open my messages", href: link(ctx, p.messagesPath) },
        { kind: "note", text: "For everyone's safety, messages are only read and answered inside TACE. We will never ask you to share a phone number or move to another app." },
      ],
    },
    ctx,
  );
}

export function mentorRequest(ctx: Ctx, p: { mentorName: string; childFirstName: string; dashboardPath: string }) {
  return done(
    {
      subject: "TACE Foundation: a new mentoring request",
      preheader: `${p.childFirstName} would like you as a mentor.`,
      heading: "A new mentoring request",
      blocks: [
        { kind: "p", text: `Hello ${p.mentorName},` },
        { kind: "p", text: `**${p.childFirstName}** would like you as a mentor. Please read the request and choose to accept or decline.` },
        { kind: "button", label: "See the request", href: link(ctx, p.dashboardPath) },
        { kind: "note", text: "Mentoring starts only after both you and the child's family have said yes." },
      ],
    },
    ctx,
  );
}

export function mentorSuggestedToFamily(ctx: Ctx, p: { name: string; childFirstName: string; mentorName: string; dashboardPath: string }) {
  return done(
    {
      subject: "TACE Foundation: a mentor has been suggested",
      preheader: `Please review the request for ${p.childFirstName}.`,
      heading: "A mentor has been suggested",
      blocks: [
        { kind: "p", text: `Hello ${p.name},` },
        { kind: "p", text: `**${p.mentorName}** could be **${p.childFirstName}**'s mentor. Please read about them and choose to accept or decline.` },
        { kind: "button", label: "Review the request", href: link(ctx, p.dashboardPath) },
        { kind: "note", text: "Nothing starts until you say yes. You can say no at any time." },
      ],
    },
    ctx,
  );
}

// ---------------------------------------------------------------------------
// Sign-up and password emails are sent by Supabase Auth, not by this code. These
// two use Supabase's own placeholders so the same look can be pasted into
// Authentication > Email Templates (see docs/EMAIL_SETUP.md). Supabase sends
// only the HTML part for these two.
// ---------------------------------------------------------------------------
export const SUPABASE_CONFIRM_LINK =
  "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup";
export const SUPABASE_RECOVERY_LINK =
  "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery";

export function confirmSignup(ctx: Ctx, p: { link?: string } = {}) {
  return done(
    {
      subject: "Confirm your TACE Foundation account",
      preheader: "One tap to confirm your email address.",
      heading: "Confirm your email address",
      blocks: [
        { kind: "p", text: "Welcome to TACE Foundation. Please confirm your email address so we know it is really you." },
        { kind: "button", label: "Confirm my email", href: p.link ?? SUPABASE_CONFIRM_LINK },
        { kind: "note", text: "If you did not create an account, you can ignore this email. Nothing will happen." },
      ],
    },
    ctx,
  );
}

export function resetPassword(ctx: Ctx, p: { link?: string } = {}) {
  return done(
    {
      subject: "Reset your TACE Foundation password",
      preheader: "Use this link to choose a new password.",
      heading: "Reset your password",
      blocks: [
        { kind: "p", text: "We received a request to reset the password for your TACE Foundation account." },
        { kind: "button", label: "Choose a new password", href: p.link ?? SUPABASE_RECOVERY_LINK },
        { kind: "note", text: "The link can be used once and stops working after a short time. If you did not ask for this, you can ignore this email: your password stays the same." },
      ],
    },
    ctx,
  );
}

export function weeklyDigest(
  ctx: Ctx,
  p: { openConcerns: number; flaggedMessages: number; pendingApplications: number },
) {
  const urgent = p.openConcerns + p.flaggedMessages > 0;
  return done(
    {
      subject: urgent
        ? "TACE Foundation: items need your review this week"
        : "TACE Foundation: weekly summary, nothing urgent",
      preheader: "Counts only. Sign in to see the details.",
      heading: "Your weekly summary",
      blocks: [
        { kind: "p", text: "Here is where things stand on the platform. This email holds numbers only; the details are behind your sign-in." },
        { kind: "p", text: `Open safeguarding concerns: **${p.openConcerns}**` },
        { kind: "p", text: `Flagged messages: **${p.flaggedMessages}**` },
        { kind: "p", text: `Applications waiting for a decision: **${p.pendingApplications}**` },
        { kind: "button", label: "Open the admin dashboard", href: link(ctx, "/dashboard/admin") },
        { kind: "note", text: "Please do not forward this email. Sent every Monday to the active administrators." },
      ],
    },
    ctx,
  );
}

// Sample data for the admin preview page and the tests.
export function allSamples(ctx: Ctx): { key: string; label: string; email: RenderedEmail }[] {
  const link1 = "https://example.org/auth/confirm?token_hash=SAMPLE&type=recovery";
  return [
    { key: "confirmSignup", label: "Confirm sign-up (Supabase)", email: confirmSignup(ctx) },
    { key: "resetPassword", label: "Reset password (Supabase)", email: resetPassword(ctx) },
    { key: "applicationReceived", label: "Application received", email: applicationReceived(ctx, { childFirstName: "Ada", reference: "A1B2C3D4" }) },
    { key: "applicationApproved", label: "Application approved", email: applicationApproved(ctx, { greetingName: "Mrs Obi", childFirstName: "Ada", taceId: "TACE-2026-001", setPasswordLink: link1 }) },
    { key: "applicationRejected", label: "Application not approved", email: applicationRejected(ctx, { childFirstName: "Ada", reason: "We could not verify the details given." }) },
    { key: "memberApproved", label: "Member approved", email: memberApproved(ctx, { name: "Tunde Bello" }) },
    { key: "sponsorApproved", label: "Sponsor approved", email: sponsorApproved(ctx, { name: "Chioma Eze" }) },
    { key: "mentorCleared", label: "Mentor cleared", email: mentorCleared(ctx, { name: "Mark Mentor", accountActive: true }) },
    { key: "mentorRejected", label: "Mentor not taken forward", email: mentorRejected(ctx, { name: "Mark Mentor" }) },
    { key: "mentorAccountActive", label: "Mentor account active", email: mentorAccountActive(ctx, { name: "Mark Mentor" }) },
    { key: "adminInvited", label: "Administrator invited", email: adminInvited(ctx, { name: "Ngozi Admin", setPasswordLink: link1 }) },
    { key: "donationReceipt", label: "Donation receipt", email: donationReceipt(ctx, { donorName: "Kind Donor", amountFormatted: "₦50,000", purpose: "school fees", dateFormatted: "14 October 2026", bankRef: "TRF-83921" }) },
    { key: "newMessageNotice", label: "New message notice", email: newMessageNotice(ctx, { recipientName: "Mrs Obi", senderFirstName: "Mark", messagesPath: "/dashboard/beneficiary/mentor/messages" }) },
    { key: "mentorRequest", label: "Mentor request (to the mentor)", email: mentorRequest(ctx, { mentorName: "Mark Mentor", childFirstName: "Ada", dashboardPath: "/dashboard/mentor" }) },
    { key: "weeklyDigest", label: "Weekly admin summary", email: weeklyDigest(ctx, { openConcerns: 2, flaggedMessages: 1, pendingApplications: 4 }) },
    { key: "mentorSuggestedToFamily", label: "Mentor suggested (to the family)", email: mentorSuggestedToFamily(ctx, { name: "Mrs Obi", childFirstName: "Ada", mentorName: "Mark Mentor", dashboardPath: "/dashboard/beneficiary/mentor" }) },
  ];
}
