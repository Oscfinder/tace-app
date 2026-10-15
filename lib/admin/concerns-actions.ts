"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/guards";

type ActionResult = { error: string } | { success: true };

const schema = z.object({
  id: z.string().uuid(),
  status: z.enum(["open", "reviewing", "closed"]),
});

// Only an admin can change a concern's status (the table has no update policy
// for anyone else). Records who handled it and when.
export async function setConcernStatus(input: {
  id: string;
  status: "open" | "reviewing" | "closed";
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("safeguarding_concerns")
    .update(
      parsed.data.status === "open"
        ? { status: "open", handled_by: null, handled_at: null }
        : {
            status: parsed.data.status,
            handled_by: session.user.id,
            handled_at: new Date().toISOString(),
          },
    )
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/concerns");
  revalidatePath("/dashboard/admin");
  return { success: true };
}
