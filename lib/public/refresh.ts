import { revalidatePath, revalidateTag } from "next/cache";
import { PUBLIC_HOME_TAG } from "@/lib/public/home-data";

// Call after staff change something visitors can see (publish a story or a
// project, log a donation), so the cached landing page data is rebuilt on the
// next visit instead of waiting for the 5-minute timer. Server Actions only.
export function refreshPublicHome() {
  revalidateTag(PUBLIC_HOME_TAG, { expire: 0 });
  revalidatePath("/");
}
