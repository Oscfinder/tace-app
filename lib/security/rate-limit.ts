import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const isProd = process.env.NODE_ENV === "production";

// Which header to trust matters: a spoofable one lets anyone dodge the limit,
// a missing one makes everybody share a single bucket.
//  - x-vercel-forwarded-for is set by Vercel's edge and can't come from the client.
//  - the others are only used when it is absent (not on Vercel).
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    (isProd ? null : "127.0.0.1") // local dev has no proxy headers
  );
}

// Only a salted hash is ever stored, never the address or email itself.
export function hashKey(value: string, salt: string) {
  return createHash("sha256").update(`${value}:${salt}`).digest("hex");
}

export type Limit = { bucket: string; max: number; windowSeconds: number };

export const LIMITS = {
  loginIp: { bucket: "login-ip", max: 20, windowSeconds: 15 * 60 },
  loginEmail: { bucket: "login-email", max: 8, windowSeconds: 15 * 60 },
  signupIp: { bucket: "signup-ip", max: 5, windowSeconds: 60 * 60 },
  resetIp: { bucket: "reset-ip", max: 5, windowSeconds: 60 * 60 },
  resetEmail: { bucket: "reset-email", max: 3, windowSeconds: 60 * 60 },
  contactIp: { bucket: "contact-ip", max: 5, windowSeconds: 60 * 60 },
  receiptIp: { bucket: "receipt-ip", max: 5, windowSeconds: 60 * 60 },
} satisfies Record<string, Limit>;

export const RATE_LIMITED_MESSAGE =
  "Too many attempts. Please wait a little while and try again.";

/**
 * Records one attempt against `limit` for this visitor and returns whether it
 * is allowed. `identifier` adds a second key such as an email address (it is
 * hashed first). Without one, the visitor's IP is the key.
 *
 * If the limiter itself is unavailable it fails OPEN (logs and allows), because
 * these forms need the same database to work at all, and locking every
 * real person out is worse than skipping a counter for a moment. In
 * production a missing IP_HASH_SALT is treated the same way, loudly.
 */
export async function allowAttempt(
  limit: Limit,
  identifier?: string,
): Promise<boolean> {
  const salt = process.env.IP_HASH_SALT || (isProd ? null : "dev-only-salt");
  if (!salt) {
    console.error("IP_HASH_SALT is not set: rate limiting is OFF for", limit.bucket);
    return true;
  }
  const subject = identifier ?? (await clientIp());
  if (!subject) {
    console.error("No client IP: rate limit skipped for", limit.bucket);
    return true;
  }
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("rate_limit_hit", {
      p_bucket: limit.bucket,
      p_key_hash: hashKey(subject.trim().toLowerCase(), salt),
      p_max: limit.max,
      p_window_seconds: limit.windowSeconds,
    });
    if (error) {
      console.error("Rate limiter error:", error.message);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error("Rate limiter unavailable:", err);
    return true;
  }
}
