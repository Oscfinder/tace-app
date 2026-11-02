import { test } from "node:test";
import assert from "node:assert/strict";
import { allSamples, applicationApproved, applicationRejected, donationReceipt, newMessageNotice } from "./templates.ts";

const ctx = { siteUrl: "https://tacefoundation.org", supportEmail: "hello@tacefoundation.org" };

test("every template has a subject, an HTML part and a plain-text part", () => {
  const samples = allSamples(ctx);
  assert.ok(samples.length >= 15);
  for (const { key, email } of samples) {
    assert.ok(email.subject.length > 5, `${key} subject`);
    assert.match(email.html, /<!doctype html>/i, `${key} html`);
    assert.ok(email.text.length > 40, `${key} text`);
    assert.doesNotMatch(email.text, /<[a-z][^>]*>/i, `${key} text has no HTML tags`);
    assert.doesNotMatch(email.text, /\*\*/, `${key} text has no formatting marks`);
    assert.match(email.html, /lang="en"/, `${key} language`);
    assert.match(email.text, /TACE Welfare Foundation/, `${key} text footer`);
  }
});

test("the plain-text version contains every link in the HTML button", () => {
  const e = applicationApproved(ctx, { greetingName: "Mrs Obi", childFirstName: "Ada", taceId: "TACE-1", setPasswordLink: "https://tacefoundation.org/auth/confirm?token_hash=abc&type=recovery" });
  assert.ok(e.html.includes("token_hash=abc"));
  assert.ok(e.text.includes("https://tacefoundation.org/auth/confirm?token_hash=abc&type=recovery"));
});

test("anything a person typed is escaped in the HTML", () => {
  const evil = '<a href="https://evil.example">click</a><script>alert(1)</script>';
  const e = applicationRejected(ctx, { childFirstName: evil, reason: evil });
  assert.doesNotMatch(e.html, /<script>/);
  assert.doesNotMatch(e.html, /<a href="https:\/\/evil/);
  assert.match(e.html, /&lt;script&gt;/);
  const r = donationReceipt(ctx, { donorName: evil, amountFormatted: "₦1", purpose: evil, dateFormatted: "today", bankRef: evil });
  assert.doesNotMatch(r.html, /<script>|<a href="https:\/\/evil/);
});

test("the new-message email says a message exists and never what it says", () => {
  const e = newMessageNotice(ctx, { recipientName: "Mrs Obi", senderFirstName: "Mark", messagesPath: "/dashboard/beneficiary/mentor/messages" });
  assert.match(e.text, /Mark sent you a message/);
  assert.match(e.html, /\/dashboard\/beneficiary\/mentor\/messages/);
});

test("a rejection without a reason still reads well", () => {
  const e = applicationRejected(ctx, { childFirstName: "Ada", reason: "  " });
  assert.doesNotMatch(e.text, /\n\n\n\n/);
});

test("Supabase templates carry Supabase's own placeholders", () => {
  const confirm = allSamples(ctx).find((s) => s.key === "confirmSignup")!;
  assert.ok(confirm.email.html.includes("{{ .TokenHash }}") && confirm.email.html.includes("{{ .SiteURL }}"));
});
