import { createClient } from "@/lib/supabase/server";

// The only keys the site_settings table accepts (also enforced by a CHECK in
// migration 013). None of them may ever be a secret.
export const SETTING_KEYS = [
  "foundation_name",
  "cac_number",
  "bank_name",
  "bank_account_name",
  "bank_account_number",
  "contact_email",
] as const;
export type SettingKey = (typeof SETTING_KEYS)[number];
export type FoundationSettings = Record<SettingKey, string>;

// Used only while a value has not been entered in Admin > Settings yet, so the
// sponsor card keeps working through the switch from environment variables.
const ENV_FALLBACK: Partial<Record<SettingKey, string | undefined>> = {
  bank_name: process.env.NEXT_PUBLIC_BANK_NAME,
  bank_account_name: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,
  bank_account_number: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER,
};

export async function getFoundationSettings(): Promise<FoundationSettings> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  const stored = new Map((data ?? []).map((r) => [r.key, r.value]));
  return Object.fromEntries(
    SETTING_KEYS.map((key) => [key, stored.get(key) || ENV_FALLBACK[key] || ""]),
  ) as FoundationSettings;
}

export type BankDetails = {
  bank: string;
  accountName: string;
  accountNumber: string;
};

export function bankDetailsFrom(s: FoundationSettings): BankDetails {
  return {
    bank: s.bank_name,
    accountName: s.bank_account_name || s.foundation_name || "TACE Welfare Foundation",
    accountNumber: s.bank_account_number,
  };
}

export async function getBankDetails(): Promise<BankDetails> {
  return bankDetailsFrom(await getFoundationSettings());
}
