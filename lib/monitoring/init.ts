import * as Sentry from "@sentry/node";
import { scrubEvent } from "@/lib/monitoring/scrub";

// Starts the error tracker, but only when SENTRY_DSN is set. Everything that
// normally gathers context is OFF on purpose, so a report holds little more than
// the error type, a scrubbed message, a code location and the route:
//  - no default integrations (no request data, console or HTTP breadcrumbs,
//    source lines or local variables),
//  - no user, IP, cookies, headers, bodies or query strings (dataCollection),
//    no performance traces, no breadcrumbs,
//  - and scrubEvent as a final pass (see lib/monitoring/scrub.ts).
let started = false;

export function initErrorTracking() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || started) return;
  started = true;
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.VERCEL_GIT_COMMIT_SHA,
    // Collect NOTHING about the request or the person (Sentry 11 setting; it
    // replaced sendDefaultPii).
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      mcp: { inputs: false, outputs: false },
    },
    defaultIntegrations: false,
    integrations: [],
    tracesSampleRate: 0,
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    beforeSend: (event) => scrubEvent(event),
  });
}
