import type { Metadata } from "next";
import { getFoundationSettings, bankDetailsFrom } from "@/lib/site-settings";
import { BankDetailsCard } from "@/components/sponsor/bank-details-card";

export const metadata: Metadata = {
  title: "Donate | TACE Welfare Foundation",
  description: "Give to TACE Welfare Foundation by bank transfer.",
};

// Reads the live bank details from Admin > Settings, so a change there shows
// here straight away (the page is rendered per request, not cached).
export default async function DonatePage() {
  const settings = await getFoundationSettings();
  return (
    <main className="mx-auto max-w-xl px-4 py-16 md:py-24">
      <h1 className="font-heading text-3xl font-extrabold text-tace-navy">
        Give to a child&apos;s future
      </h1>
      <p className="mt-3 text-tace-gray">
        Every gift goes to the education, training and mentoring of children in
        our programmes. Please give by bank transfer using the details below.
        We will email you a receipt once we have recorded your gift.
      </p>
      <div className="mt-8">
        <BankDetailsCard details={bankDetailsFrom(settings)} />
      </div>
      {settings.contact_email ? (
        <p className="mt-6 text-sm text-tace-gray">
          Questions about giving? Email{" "}
          <a className="font-semibold text-tace-blue underline" href={`mailto:${settings.contact_email}`}>
            {settings.contact_email}
          </a>
          .
        </p>
      ) : null}
    </main>
  );
}
