import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { allSamples } from "@/lib/email/templates";
import { getSiteUrl } from "@/lib/site-url";

// Development-only page for checking how every email looks, in HTML and in plain
// text, with sample data. In production it does not exist (404).
export default async function EmailPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  await requireRole("admin");
  const samples = allSamples({ siteUrl: getSiteUrl(), supportEmail: "hello@example.org" });

  return (
    <div className="flex flex-col gap-8 pt-5">
      <div>
        <h1 className="font-heading text-2xl font-bold text-tace-navy">Email preview</h1>
        <p className="mt-1 text-sm text-tace-gray">
          Development only. Every email the platform sends, with sample data. The sign-up and password emails
          are sent by Supabase: paste them into Authentication, Email Templates (see docs/EMAIL_SETUP.md).
        </p>
      </div>
      {samples.map(({ key, label, email }) => (
        <section key={key} id={key} className="rounded-[13px] border border-[#e5edf6] bg-white p-5">
          <h2 className="font-heading text-base font-semibold text-tace-navy">{label}</h2>
          <p className="mt-1 text-sm text-tace-gray">
            Subject: <b className="text-tace-navy">{email.subject}</b>
          </p>
          <div className="mt-3 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <iframe
              title={`${label} (HTML)`}
              srcDoc={email.html}
              sandbox=""
              className="h-[560px] w-full rounded-lg border border-[#e5edf6]"
            />
            <pre className="max-h-[560px] overflow-auto rounded-lg bg-[#f7faff] p-4 text-xs leading-relaxed whitespace-pre-wrap text-tace-navy">
              {email.text}
            </pre>
          </div>
        </section>
      ))}
    </div>
  );
}
