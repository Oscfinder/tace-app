"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";
import { sendEmail } from "@/lib/email/send";

type ActionResult = { error: string } | { success: true };

export async function activateSponsor(input: {
  sponsorId: string;
  profileId: string;
  beneficiaryId: string;
}): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", input.profileId)
    .eq("role", "sponsor")
    .maybeSingle();
  if (!profile) return { error: "Sponsor not found." };

  // A beneficiary can only ever have one sponsor — re-check sponsor_id is
  // still null here rather than trusting the dropdown only showed
  // unsponsored beneficiaries at the time the page loaded.
  const { data: updatedBeneficiary, error: beneficiaryError } = await supabase
    .from("beneficiaries")
    .update({ sponsor_id: input.sponsorId })
    .eq("id", input.beneficiaryId)
    .is("sponsor_id", null)
    .select("id")
    .maybeSingle();
  if (beneficiaryError) return { error: beneficiaryError.message };
  if (!updatedBeneficiary) {
    return {
      error: "That beneficiary already has a sponsor — pick another.",
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", input.profileId);
  if (profileError) return { error: profileError.message };

  try {
    await sendEmail({
      to: profile.email,
      subject: "TACE Foundation — You're approved",
      html: `<p>Hi ${profile.full_name},</p>
<p>Your TACE Foundation sponsorship has been approved and you've been linked to a child. You can now sign in to follow their progress.</p>`,
    });
  } catch (err) {
    console.error("Sponsor approval email failed to send:", err);
  }

  revalidatePath("/dashboard/admin/sponsors");
  revalidatePath(`/dashboard/admin/sponsors/${input.sponsorId}`);
  return { success: true };
}

export async function logDonation(input: {
  donorName: string;
  donorEmail: string | null;
  donorPhone: string | null;
  sponsorId: string | null;
  projectId: string | null;
  beneficiaryId: string | null;
  amount: number;
  purpose: string | null;
  bankRef: string | null;
  /** Admin already clicked through the mismatch warning client-side. Still
   * re-checked here — the client gating is UX, not the actual gate. */
  confirmedMismatch?: boolean;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  if (!input.donorName.trim()) return { error: "Donor name is required." };
  if (!input.amount || input.amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  const supabase = await createClient();

  // Re-derive the sponsor's linked beneficiary from the database, never
  // from anything the client sent — the whole point of a server-side check
  // is that it doesn't trust the client's own idea of the mismatch.
  let notes: string | null = null;
  if (input.sponsorId && input.beneficiaryId) {
    const { data: linked } = await supabase
      .from("beneficiaries")
      .select("id, first_name, last_name")
      .eq("sponsor_id", input.sponsorId);

    if (linked && linked.length === 1 && linked[0].id !== input.beneficiaryId) {
      const linkedName = `${linked[0].first_name} ${linked[0].last_name}`;
      if (!input.confirmedMismatch) {
        return {
          error: `This sponsor is linked to ${linkedName}. Confirm to log this donation against a different child.`,
        };
      }
      const { data: chosen } = await supabase
        .from("beneficiaries")
        .select("first_name, last_name")
        .eq("id", input.beneficiaryId)
        .maybeSingle();
      const chosenName = chosen
        ? `${chosen.first_name} ${chosen.last_name}`
        : "a different child";
      notes = `Logged against ${chosenName} despite sponsor being linked to ${linkedName}.`;
    }
  }

  const { error: insertError } = await supabase.from("donations").insert({
    donor_name: input.donorName,
    donor_email: input.donorEmail,
    donor_phone: input.donorPhone,
    sponsor_id: input.sponsorId,
    project_id: input.projectId,
    beneficiary_id: input.beneficiaryId,
    amount: input.amount,
    purpose: input.purpose,
    bank_ref: input.bankRef,
    notes,
    logged_by: session.user.id,
  });
  if (insertError) return { error: insertError.message };

  if (input.sponsorId) {
    // Recomputed from the donations table rather than incremented via a
    // read-then-write on sponsors.total_donated, which raced under
    // concurrent writes — this is self-correcting and always matches the
    // real sum of this sponsor's donations, no atomic-increment RPC needed.
    const { data: sponsorDonations } = await supabase
      .from("donations")
      .select("amount")
      .eq("sponsor_id", input.sponsorId);
    const total = (sponsorDonations ?? []).reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );
    await supabase
      .from("sponsors")
      .update({ total_donated: total })
      .eq("id", input.sponsorId);
  }

  revalidatePath("/dashboard/admin/sponsors");
  if (input.sponsorId) {
    revalidatePath(`/dashboard/admin/sponsors/${input.sponsorId}`);
  }
  return { success: true };
}

export async function sendDonationReceipt(
  donationId: string,
): Promise<ActionResult> {
  await requireRole("admin");
  const supabase = await createClient();

  const { data: donation } = await supabase
    .from("donations")
    .select("donor_name, donor_email, amount, purpose, receipt_sent")
    .eq("id", donationId)
    .maybeSingle();
  if (!donation) return { error: "Donation not found." };
  if (donation.receipt_sent) return { error: "Receipt already sent." };
  if (!donation.donor_email) {
    return { error: "No email on file for this donor." };
  }

  const { error } = await supabase
    .from("donations")
    .update({ receipt_sent: true, receipt_sent_at: new Date().toISOString() })
    .eq("id", donationId);
  if (error) return { error: error.message };

  try {
    await sendEmail({
      to: donation.donor_email,
      subject: "TACE Foundation — Donation Receipt",
      html: `<p>Hi ${donation.donor_name},</p>
<p>Thank you for your donation of <strong>₦${Number(donation.amount).toLocaleString()}</strong>${
        donation.purpose ? ` for ${donation.purpose}` : ""
      }. This email serves as your receipt.</p>`,
    });
  } catch (err) {
    console.error("Receipt email failed to send:", err);
  }

  revalidatePath("/dashboard/admin/sponsors");
  return { success: true };
}
