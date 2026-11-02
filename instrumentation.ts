import type { Instrumentation } from "next";

// Runs once when the server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initErrorTracking } = await import("@/lib/monitoring/init");
    initErrorTracking();
  }
}

// Called by Next.js for every error thrown while rendering a page, running a
// Server Action or handling a route. The real error is written to the server
// log; the error tracker (if SENTRY_DSN is set) gets a scrubbed copy.
export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { reportServerError } = await import("@/lib/monitoring/report");
  await reportServerError(err, {
    route: context.routePath,
    kind: context.routeType,
    method: request.method,
  });
};
