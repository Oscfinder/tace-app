import * as Sentry from "@sentry/node";

type Where = {
  /** Route pattern such as /dashboard/admin/finance (never the visitor's real URL with ids or query). */
  route?: string;
  kind?: string;
  method?: string;
  scope?: string;
};

function digestOf(err: unknown): string | undefined {
  return typeof err === "object" && err !== null && "digest" in err
    ? String((err as { digest: unknown }).digest)
    : undefined;
}

/**
 * Records a server-side error. The FULL error goes to our own server log (the
 * foundation's private Vercel logs) so the fault can be fixed; the error tracker,
 * when configured, receives only the scrubbed version.
 */
export async function reportServerError(err: unknown, where: Where = {}) {
  const digest = digestOf(err);
  console.error(
    "[server-error]",
    JSON.stringify({ digest, route: where.route, kind: where.kind, method: where.method, scope: where.scope }),
    err,
  );
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!Sentry.getClient()) return;
  Sentry.withScope((scope) => {
    if (digest) scope.setTag("digest", digest);
    if (where.route) scope.setTag("route", where.route);
    if (where.kind) scope.setTag("kind", where.kind);
    if (where.scope) scope.setTag("scope", where.scope);
    Sentry.captureException(err);
  });
  await Sentry.flush(2000);
}

/** For failures that happened in the browser (a screen that crashed). Only a digest and a path arrive. */
export async function reportClientRenderFailure(info: { digest: string | null; path: string; scope: string }) {
  console.error("[client-render-error]", JSON.stringify(info));
  if (!Sentry.getClient()) return;
  Sentry.withScope((scope) => {
    scope.setTag("digest", info.digest ?? "none");
    scope.setTag("route", info.path);
    scope.setTag("scope", info.scope);
    Sentry.captureMessage("A screen failed to display in the browser", "error");
  });
  await Sentry.flush(2000);
}
