import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { LIMITS, allowAttempt } from "@/lib/security/rate-limit";
import { reportClientRenderFailure } from "@/lib/monitoring/report";

// Receives "a screen crashed in the browser" notes from the error screens. It
// accepts only a digest, a path and a scope (no error text), caps what it keeps,
// and is rate limited because anyone can call it.
const bodySchema = z.object({
  digest: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/).nullable(),
  path: z.string().regex(/^\/[A-Za-z0-9/_\-.]{0,199}$/),
  scope: z.enum(["site", "public", "auth", "admin", "member", "sponsor", "mentor", "beneficiary", "global"]),
});

export async function POST(request: NextRequest) {
  const text = await request.text();
  if (text.length > 2000) return new NextResponse(null, { status: 413 });
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new NextResponse(null, { status: 400 });
  if (!(await allowAttempt(LIMITS.clientError))) return new NextResponse(null, { status: 429 });

  // Ids in a path ("/dashboard/admin/beneficiaries/<uuid>") are replaced so the
  // report names the page, not the child.
  const path = parsed.data.path.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "[id]");
  await reportClientRenderFailure({ digest: parsed.data.digest, path, scope: parsed.data.scope });
  return new NextResponse(null, { status: 204 });
}
