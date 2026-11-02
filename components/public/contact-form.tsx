"use client";

import { useActionState } from "react";
import { sendContactMessage, type ContactState } from "@/lib/contact/actions";
import { Button } from "@/components/ui/button";

const initial: ContactState = { ok: false, message: "" };
const field =
  "mt-1.5 block w-full rounded-lg border border-border bg-white px-3.5 py-3 text-base text-tace-navy shadow-sm focus-visible:border-tace-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tace-blue/30";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, initial);

  if (state.ok) {
    return (
      <p
        role="status"
        className="rounded-xl border border-tace-green/30 bg-tace-green/10 p-5 font-semibold text-tace-navy"
      >
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="contact-name" className="text-sm font-bold text-tace-navy">
          Your name
        </label>
        <input id="contact-name" name="name" type="text" autoComplete="name" required maxLength={100} className={field} />
      </div>
      <div>
        <label htmlFor="contact-email" className="text-sm font-bold text-tace-navy">
          Your email
        </label>
        <input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={200} className={field} />
      </div>
      <div>
        <label htmlFor="contact-message" className="text-sm font-bold text-tace-navy">
          Your message
        </label>
        <textarea id="contact-message" name="message" rows={6} required minLength={10} maxLength={2000} className={field} />
        <p className="mt-1.5 text-xs text-tace-gray">
          Please do not include a child&apos;s full name, address or health details. If a child is in danger, see our child protection page.
        </p>
      </div>
      {/* Hidden from people; simple bots tend to fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Leave this empty
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.message ? (
        <p role="alert" className="text-sm font-semibold text-tace-red">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending} className="bg-tace-blue text-white hover:bg-tace-blue/90">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
