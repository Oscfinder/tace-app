import type { NextConfig } from "next";

// Photos come from Supabase Storage (signed links), so next/image may fetch,
// resize and cache them. The protocol and port follow the configured Supabase
// URL, so local development against http://localhost works too.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
  : undefined;

// Headers that never change between requests. The Content-Security-Policy is
// different on every request (it carries a script nonce), so proxy.ts sets it.
const securityHeaders = [
  // Nobody may put this site in a frame (clickjacking). Older browsers read
  // X-Frame-Options; newer ones read the CSP's frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// One canonical address. In production, the "www" twin and every *.vercel.app
// address redirect (308) to NEXT_PUBLIC_SITE_URL. Previews keep their own
// addresses, and /api/cron is left alone so Vercel Cron is never redirected.
// If the Vercel Domains page also redirects the canonical host elsewhere, the
// two would loop: keep them pointing the same way.
function canonicalRedirects() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw || process.env.VERCEL_ENV !== "production") return [];
  let host: string;
  try {
    host = new URL(raw).host;
  } catch {
    return [];
  }
  const twin = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  const source = "/:path((?!api/cron).*)";
  const destination = `${new URL(raw).origin}/:path`;
  return [
    { source, has: [{ type: "host" as const, value: twin }], destination, permanent: true },
    {
      source,
      has: [{ type: "host" as const, value: "(?<sub>.+)\\.vercel\\.app" }],
      destination,
      permanent: true,
    },
  ];
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return canonicalRedirects();
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: {
      // Ticket 2C's document uploader allows files up to 5MB; the default
      // Server Action body limit is 1MB, so this must be raised to match
      // (with headroom for multipart overhead, per Next's own guidance).
      bodySizeLimit: "6mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      ...(supabaseUrl
        ? [
            {
              protocol: supabaseUrl.protocol.replace(":", "") as "http" | "https",
              hostname: supabaseUrl.hostname,
              ...(supabaseUrl.port ? { port: supabaseUrl.port } : {}),
              pathname: "/storage/v1/object/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
