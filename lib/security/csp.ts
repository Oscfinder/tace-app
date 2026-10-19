// Content-Security-Policy for the whole site. Built per request in proxy.ts so
// each page load gets its own script nonce.
//
// What the site loads, and why each source is allowed:
//  - scripts:   our own bundles only. 'nonce' + 'strict-dynamic' lets Next's
//               own inline bootstrap scripts run and blocks any other script,
//               including one injected by an attacker.
//  - styles:    'unsafe-inline' is needed because React writes style="..."
//               attributes (these cannot carry a nonce). Script injection is
//               what matters most and stays blocked. api.fontshare.com serves
//               the display font's CSS.
//  - fonts:     cdn.fontshare.com serves the font files; next/font self-hosts
//               Quicksand and the dashboard fonts.
//  - images:    our own site, Supabase Storage (photos), Unsplash (landing page),
//               data:/blob: for upload previews.
//  - connect:   our own site and Supabase over https and wss (Realtime chat).
//  - nothing may embed this site in a frame, and no plugins (object-src none).

function supabaseOrigins(): { http: string[]; ws: string[] } {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return { http: [], ws: [] };
  try {
    const url = new URL(raw);
    const ws = new URL(raw);
    ws.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return { http: [url.origin], ws: [ws.origin] };
  } catch {
    return { http: [], ws: [] };
  }
}

export function buildCsp(nonce: string, isDev = process.env.NODE_ENV !== "production") {
  const supabase = supabaseOrigins();
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // React uses eval in development only, for readable error stacks.
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://api.fontshare.com"],
    "img-src": ["'self'", "data:", "blob:", ...supabase.http, "https://images.unsplash.com"],
    "font-src": ["'self'", "data:", "https://cdn.fontshare.com"],
    "connect-src": ["'self'", ...supabase.http, ...supabase.ws],
    "media-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    ...(isDev ? {} : { "upgrade-insecure-requests": [] }),
  };
  return Object.entries(directives)
    .map(([name, values]) => (values.length ? `${name} ${values.join(" ")}` : name))
    .join("; ");
}

export function newNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}
