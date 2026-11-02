// Error reports leave our servers (for the error tracker), so they must never
// carry personal data: no names, emails, phone numbers, message text or what
// someone typed. Two layers:
//  1. The tracker is started with everything that gathers context switched off
//     (see instrumentation.ts): no request data, no user, no breadcrumbs, no
//     source lines, no local variables.
//  2. Whatever is left (mostly the error's text) goes through scrubText, and the
//     whole event through scrubEvent as a last pass.
// Our own server log keeps the full error, because the people who run the
// foundation need it to fix faults and that log is private to them.

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_WITH_QUERY = /(https?:\/\/[^\s?#]+)\?[^\s]*/gi;
const BEARER = /\b(bearer|token|apikey|api_key|secret|password|authorization)\b\s*[:=]?\s*\S+/gi;
const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g;
const UUID = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const LONG_NUMBER = /(\+?\d[\s().-]?){7,}/g;
// Text inside quotes is how database and validation errors echo back values
// ("Key (email)=(ada@x.com) already exists", 'invalid input value "Ada"').
const QUOTED = /(["'`])(?:(?!\1).){1,200}\1/g;
const PARENS_VALUE = /\(([^()]{1,120})\)=\(([^()]{1,200})\)/g;

export function scrubText(input: unknown, max = 300): string {
  const text = typeof input === "string" ? input : String(input ?? "");
  return text
    .replace(JWT, "[token]")
    .replace(BEARER, "[secret]")
    .replace(EMAIL, "[email]")
    .replace(URL_WITH_QUERY, "$1")
    .replace(PARENS_VALUE, "($1)=([value])")
    .replace(UUID, "[id]")
    .replace(QUOTED, "[text]")
    .replace(LONG_NUMBER, "[number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// Sentry events are loosely shaped objects; this function deliberately works on
// them structurally so it keeps working whatever fields a version adds.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEvent = Record<string, any>;

/**
 * Final pass over an event before it is sent. Removes anything that could
 * identify a person and keeps only what is needed to find the fault: the error
 * type, a scrubbed message, the route and the digest.
 */
export function scrubEvent<T extends AnyEvent>(event: T): T {
  const e: AnyEvent = event;
  delete e.user;
  delete e.request;
  delete e.extra;
  delete e.server_name;
  delete e.breadcrumbs;
  delete e.sdkProcessingMetadata;
  if (e.contexts) {
    // Keep the runtime and nothing about the person's device or location.
    e.contexts = Object.fromEntries(
      Object.entries(e.contexts as AnyEvent).filter(([k]) => ["runtime", "trace"].includes(k)),
    );
  }
  if (typeof e.message === "string") e.message = scrubText(e.message);
  if (e.logentry?.message) e.logentry.message = scrubText(e.logentry.message);
  for (const ex of e.exception?.values ?? []) {
    if (typeof ex.value === "string") ex.value = scrubText(ex.value);
    // Stack frames keep file names and line numbers (code, not people); drop any
    // captured source text or variables.
    for (const frame of ex.stacktrace?.frames ?? []) {
      delete frame.pre_context;
      delete frame.context_line;
      delete frame.post_context;
      delete frame.vars;
    }
  }
  if (typeof e.transaction === "string") e.transaction = e.transaction.split("?")[0];
  if (e.tags) {
    e.tags = Object.fromEntries(
      Object.entries(e.tags as AnyEvent).map(([k, v]) => [k, scrubText(v, 80)]),
    );
  }
  return event;
}

/** A short, safe description of an error for the tracker. */
export function describeError(err: unknown): { name: string; message: string } {
  if (err instanceof Error) return { name: err.name || "Error", message: scrubText(err.message) };
  return { name: "NonError", message: scrubText(err) };
}
