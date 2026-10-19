// Returns `raw` only if it is a plain path on this same site, otherwise null.
//
// "starts with / and not //" is not enough: browsers treat a backslash like a
// slash, so "/\evil.com" is read as "//evil.com" and sends the visitor off-site,
// and "/..//evil.com" normalises to "//evil.com". So this resolves the value
// against a dummy origin, then checks the NORMALISED result is still a
// single-slash path on that origin.
const BAD_CHARS = new RegExp("[\\x00-\\x1f\\x5c]");

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (BAD_CHARS.test(raw)) return null; // control characters and backslash
  try {
    const base = "http://same-site.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return null;
    const path = `${url.pathname}${url.search}`;
    if (!path.startsWith("/") || path.startsWith("//")) return null;
    return path;
  } catch {
    return null;
  }
}
